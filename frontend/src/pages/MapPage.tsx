import { useState, useCallback, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useQuery } from 'react-query';
import { mapApi } from '@/api';
import { PropertyMap, FilterPanel } from '@/components/Map';
import type { MapMarker } from '@/types/api';

const MapPage = () => {
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  // Fetch markers
  const { data: markers = [], isLoading, error } = useQuery(
    ['markers', filters],
    () => mapApi.getMarkers(filters as Parameters<typeof mapApi.getMarkers>[0]),
    {
      keepPreviousData: true,
    }
  );

  const handleFilterChange = useCallback((newFilters: Record<string, unknown>) => {
    setFilters(newFilters);
    setSelectedMarker(null);
  }, []);

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker);
  }, []);

  const mapHeight = useMemo(() => 'calc(100vh - 200px)', []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Карта недвижимости
        </Typography>
        <FilterPanel onFilterChange={handleFilterChange} initialFilters={filters} />
      </Box>

      <Box sx={{ flexGrow: 1, position: 'relative', minHeight: mapHeight }}>
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
            }}
          >
            <Typography>Загрузка...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1, m: 2 }}>
            <Typography>Ошибка загрузки данных. Попробуйте обновить страницу.</Typography>
          </Box>
        )}

        <PropertyMap
          markers={markers}
          selectedMarkerId={selectedMarker?.id}
          onMarkerClick={handleMarkerClick}
        />

        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            bgcolor: 'background.paper',
            p: 1.5,
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant="body2">
            Найдено объектов: <strong>{markers.length}</strong>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default MapPage;
