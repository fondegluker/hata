import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Box, Typography, Chip, Button, Card, CardMedia, CardContent, CardActions } from '@mui/material';
import { OpenInNew, LocationOn } from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useNavigate } from 'react-router-dom';
import type { MapMarker } from '@/types/api';
import { useSettingsStore } from '@/store';

// Fix leaflet marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon based on property type
const createCustomIcon = (type: string, isSelected: boolean = false) => {
  const colors: Record<string, string> = {
    house: '#4CAF50',
    apartment: '#2196F3',
    commercial: '#FF9800',
    land: '#795548',
    other: '#9E9E9E',
  };

  const color = colors[type] || colors.other;

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        ${isSelected ? 'outline: 3px solid #4472C4; outline-offset: 2px;' : ''}
      "></div>
    `,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

interface PropertyMapProps {
  markers: MapMarker[];
  selectedMarkerId?: number | null;
  onMarkerClick?: (marker: MapMarker) => void;
}

const MapBounds = ({ markers }: { markers: MapMarker[] }) => {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);

  return null;
};

const PropertyMap = ({ markers, selectedMarkerId, onMarkerClick }: PropertyMapProps) => {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();

  const defaultCenter: [number, number] = [
    settings?.map_default_lat ?? 53.9,
    settings?.map_default_lng ?? 27.5667,
  ];
  const defaultZoom = settings?.map_default_zoom ?? 7;

  const handleMarkerClick = useCallback(
    (marker: MapMarker) => {
      onMarkerClick?.(marker);
    },
    [onMarkerClick]
  );

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'Цена не указана';
    return new Intl.NumberFormat('ru-BY', {
      style: 'currency',
      currency: currency === 'BYN' ? 'BYN' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 400 }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds markers={markers} />

        <MarkerClusterGroup chunkedLoading>
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={createCustomIcon(marker.property_type, selectedMarkerId === marker.id)}
              eventHandlers={{
                click: () => handleMarkerClick(marker),
              }}
            >
              <Popup maxWidth={300} minWidth={200}>
                <Card sx={{ maxWidth: 280, boxShadow: 'none', bgcolor: 'transparent' }}>
                  {marker.main_photo && (
                    <CardMedia
                      component="img"
                      height="120"
                      image={marker.main_photo}
                      alt={marker.title}
                      sx={{ objectFit: 'cover', borderRadius: 1 }}
                    />
                  )}
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="subtitle2" noWrap gutterBottom>
                      {marker.title}
                    </Typography>

                    <Typography variant="h6" color="primary" gutterBottom>
                      {formatPrice(marker.price, marker.currency)}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                      <Chip
                        size="small"
                        label={marker.property_type}
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Chip
                        size="small"
                        label={marker.sale_type === 'auction' ? 'Аукцион' : 'Прямая продажа'}
                        variant="outlined"
                      />
                    </Box>

                    {marker.address && (
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn fontSize="small" />
                        {marker.city}, {marker.address}
                      </Typography>
                    )}

                    {marker.total_area && (
                      <Typography variant="body2" color="text.secondary">
                        Площадь: {marker.total_area} м²
                        {marker.rooms && `, ${marker.rooms} комн.`}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ pt: 0 }}>
                    <Button
                      size="small"
                      onClick={() => navigate(`/property/${marker.id}`)}
                    >
                      Подробнее
                    </Button>
                  </CardActions>
                </Card>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </Box>
  );
};

export default PropertyMap;
