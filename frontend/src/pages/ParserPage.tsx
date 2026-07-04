import { Box, Typography, Grid } from '@mui/material';
import { ParserStatus, ParserLogs } from '@/components/Parser';

const ParserPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Парсер недвижимости
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Запуск и мониторинг парсинга данных с eri2.nca.by
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <ParserStatus />
        </Grid>
        <Grid item xs={12} lg={4}>
          <ParserLogs maxHeight={500} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ParserPage;
