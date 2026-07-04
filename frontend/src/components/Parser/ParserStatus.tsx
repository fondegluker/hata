import { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import { PlayArrow, Pause, Stop, Refresh, Download } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { parserApi, downloadFile } from '@/api';
import { useParserStore } from '@/store';
import type { ParserStatus as ParserStatusType, ParserStartRequest } from '@/types/api';

const StatusChip = ({ status }: { status: string }) => {
  const colors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
    idle: 'default',
    running: 'primary',
    paused: 'warning',
    stopping: 'warning',
    error: 'error',
    completed: 'success',
  };

  const labels: Record<string, string> = {
    idle: 'Ожидание',
    running: 'Работает',
    paused: 'Пауза',
    stopping: 'Останавливается',
    error: 'Ошибка',
    completed: 'Завершено',
  };

  return <Chip label={labels[status] || status} color={colors[status]} size="small" />;
};

const ParserStatus = () => {
  const queryClient = useQueryClient();
  const { status, setStatus } = useParserStore();

  // Fetch status periodically
  const { data, refetch } = useQuery<ParserStatusType>(
    'parserStatus',
    () => parserApi.getStatus(),
    {
      refetchInterval: status?.progress?.status === 'running' ? 2000 : false,
      onSuccess: (data) => {
        setStatus(data);
      },
    }
  );

  const startMutation = useMutation(
    (request: ParserStartRequest) => parserApi.start(request),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('parserStatus');
      },
    }
  );

  const controlMutation = useMutation(
    (action: 'pause' | 'resume' | 'stop') => parserApi.control({ action }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('parserStatus');
      },
    }
  );

  const handleStart = () => {
    startMutation.mutate({
      incremental: true,
      download_photos: true,
    });
  };

  const handlePause = () => {
    controlMutation.mutate('pause');
  };

  const handleResume = () => {
    controlMutation.mutate('resume');
  };

  const handleStop = () => {
    controlMutation.mutate('stop');
  };

  const handleDownloadLogs = async () => {
    const blob = await parserApi.downloadLogs();
    downloadFile(blob, `parser_logs_${new Date().toISOString().split('T')[0]}.json`);
  };

  const progress = data?.progress;
  const stats = data?.stats;

  const progressPercent = progress?.total_pages
    ? Math.round((progress.current_page / progress.total_pages) * 100)
    : 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Controls */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {progress?.status === 'idle' || progress?.status === 'completed' || progress?.status === 'error' ? (
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleStart}
                disabled={startMutation.isLoading}
              >
                Запустить парсер
              </Button>
            ) : progress?.status === 'running' ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Pause />}
                  onClick={handlePause}
                  disabled={controlMutation.isLoading}
                >
                  Пауза
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleStop}
                  disabled={controlMutation.isLoading}
                >
                  Остановить
                </Button>
              </>
            ) : progress?.status === 'paused' ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={handleResume}
                  disabled={controlMutation.isLoading}
                >
                  Продолжить
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleStop}
                  disabled={controlMutation.isLoading}
                >
                  Остановить
                </Button>
              </>
            ) : null}

            <StatusChip status={progress?.status || 'idle'} />

            <Box sx={{ flexGrow: 1 }} />

            <Tooltip title="Обновить статус">
              <IconButton onClick={() => refetch()}>
                <Refresh />
              </IconButton>
            </Tooltip>

            <Tooltip title="Скачать логи">
              <IconButton onClick={handleDownloadLogs}>
                <Download />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Progress bar */}
          {progress?.status === 'running' && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Страница {progress.current_page} из {progress.total_pages || '?'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progressPercent}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={progressPercent} />
            </Box>
          )}

          {/* Current item */}
          {progress?.current_item && (
            <Typography variant="body2" color="text.secondary" noWrap>
              Обрабатывается: {progress.current_item}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Статистика парсинга
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Найдено объектов
                  </Typography>
                  <Typography variant="h4">{progress?.total_items_found || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Обработано
                  </Typography>
                  <Typography variant="h4">{progress?.items_processed || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Добавлено
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {progress?.items_added || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Обновлено
                  </Typography>
                  <Typography variant="h5" color="info.main">
                    {progress?.items_updated || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Пропущено
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    {progress?.items_skipped || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Ошибок
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    {progress?.items_failed || 0}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                База данных
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Всего объектов
                  </Typography>
                  <Typography variant="h4">{stats?.total_properties || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Фотографий
                  </Typography>
                  <Typography variant="h4">{stats?.total_photos || 0}</Typography>
                </Grid>
              </Grid>

              {stats?.by_property_type && Object.keys(stats.by_property_type).length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    По типам
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {Object.entries(stats.by_property_type).map(([type, count]) => (
                      <Chip key={type} label={`${type}: ${count}`} size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              {stats?.last_error && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="error.main">
                    Последняя ошибка: {stats.last_error}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ParserStatus;
