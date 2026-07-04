import { useEffect, useRef } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { useParserStore } from '@/store';
import type { ParserLog } from '@/types/api';

const LogEntry = ({ log }: { log: ParserLog }) => {
  const theme = useTheme();

  const getColor = (level: string) => {
    switch (level) {
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-BY', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        py: 0.5,
        px: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: 'text.disabled', minWidth: 80, fontFamily: 'monospace' }}
      >
        {formatTime(log.timestamp)}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: getColor(log.level),
          fontWeight: 'bold',
          minWidth: 60,
          textTransform: 'uppercase',
        }}
      >
        [{log.level}]
      </Typography>
      <Typography variant="caption" sx={{ flex: 1, wordBreak: 'break-word' }}>
        {log.message}
      </Typography>
    </Box>
  );
};

interface ParserLogsProps {
  maxHeight?: number | string;
}

const ParserLogs = ({ maxHeight = 400 }: ParserLogsProps) => {
  const { logs } = useParserStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 1, bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2">Логи парсера</Typography>
      </Box>
      <Box
        ref={containerRef}
        sx={{
          height: maxHeight,
          maxHeight,
          overflowY: 'auto',
          bgcolor: 'background.paper',
          fontFamily: 'monospace',
          fontSize: 12,
        }}
      >
        {logs.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center', color: 'text.disabled' }}>
            <Typography variant="body2">Нет записей</Typography>
          </Box>
        ) : (
          logs.map((log, index) => <LogEntry key={index} log={log} />)
        )}
      </Box>
    </Paper>
  );
};

export default ParserLogs;
