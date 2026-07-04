import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Divider,
  Paper,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ArrowBack, OpenInNew, Print, Download } from '@mui/icons-material';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { propertiesApi, exportApi, downloadFile } from '@/api';
import type { Property, PropertyPhoto } from '@/types/api';

const PropertyPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  const { data: property, isLoading, error } = useQuery<Property>(
    ['property', id],
    () => propertiesApi.get(Number(id)),
    {
      enabled: !!id,
    }
  );

  const handleExportPdf = async () => {
    if (!property) return;
    const blob = await exportApi.exportPropertyPdf(property.id);
    downloadFile(blob, `property_${property.external_id}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'Не указана';
    return new Intl.NumberFormat('ru-BY', {
      style: 'currency',
      currency: currency === 'BYN' ? 'BYN' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={400} sx={{ mb: 2, borderRadius: 1 }} />
        <Skeleton variant="text" height={40} />
        <Skeleton variant="text" height={20} />
      </Box>
    );
  }

  if (error || !property) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Ошибка загрузки данных</Typography>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Назад
        </Button>
      </Box>
    );
  }

  const mainPhoto = property.photos.find((p) => p.is_main) || property.photos[0];
  const lightboxSlides = property.photos.map((p) => ({ src: p.original_url }));

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Назад к карте
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {property.title}
        </Typography>
        <Tooltip title="Распечатать">
          <IconButton onClick={handlePrint}>
            <Print />
          </IconButton>
        </Tooltip>
        <Tooltip title="Экспорт в PDF">
          <IconButton onClick={handleExportPdf}>
            <Download />
          </IconButton>
        </Tooltip>
        {property.source_url && (
          <Button
            href={property.source_url}
            target="_blank"
            startIcon={<OpenInNew />}
          >
            Источник
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Photos */}
        <Grid item xs={12} md={8}>
          {property.photos.length > 0 ? (
            <Box>
              {/* Main photo */}
              <Box
                component="img"
                src={mainPhoto?.original_url}
                alt={property.title}
                sx={{
                  width: '100%',
                  maxHeight: 500,
                  objectFit: 'cover',
                  borderRadius: 1,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setLightboxIndex(property.photos.findIndex((p) => p.id === mainPhoto?.id));
                  setLightboxOpen(true);
                }}
              />
              {/* Thumbnails */}
              {property.photos.length > 1 && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1, overflowX: 'auto' }}>
                  {property.photos.map((photo, index) => (
                    <Box
                      key={photo.id}
                      component="img"
                      src={photo.original_url}
                      alt={`Photo ${index + 1}`}
                      sx={{
                        width: 80,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 0.5,
                        cursor: 'pointer',
                        border: photo.is_main ? '2px solid primary.main' : '1px solid divider',
                      }}
                      onClick={() => {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Paper
              sx={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography color="text.secondary">Нет фотографий</Typography>
            </Paper>
          )}
        </Grid>

        {/* Details */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              {/* Price */}
              <Typography variant="h4" color="primary" gutterBottom>
                {formatPrice(property.price, property.currency)}
              </Typography>

              {property.starting_price && (
                <Typography variant="body2" color="text.secondary">
                  Начальная цена: {formatPrice(property.starting_price, property.currency)}
                </Typography>
              )}

              {property.current_bid && (
                <Typography variant="body2" color="text.secondary">
                  Текущая ставка: {formatPrice(property.current_bid, property.currency)}
                </Typography>
              )}

              {/* Tags */}
              <Box sx={{ display: 'flex', gap: 1, my: 2, flexWrap: 'wrap' }}>
                <Chip label={property.property_type} />
                <Chip
                  label={property.sale_type === 'auction' ? 'Аукцион' : 'Прямая продажа'}
                  variant="outlined"
                />
                <Chip label={property.status} variant="outlined" />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Location */}
              <Typography variant="body2" color="text.secondary">
                Расположение
              </Typography>
              {property.region && (
                <Typography variant="body1">{property.region}</Typography>
              )}
              {property.city && (
                <Typography variant="body1">{property.city}</Typography>
              )}
              {property.address && (
                <Typography variant="body2" color="text.secondary">
                  {property.address}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Property details */}
              <Box sx={{ display: 'grid', gap: 1 }}>
                {property.total_area && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Общая площадь:
                    </Typography>
                    <Typography variant="body2">{property.total_area} м²</Typography>
                  </Box>
                )}
                {property.living_area && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Жилая площадь:
                    </Typography>
                    <Typography variant="body2">{property.living_area} м²</Typography>
                  </Box>
                )}
                {property.land_area && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Участок:
                    </Typography>
                    <Typography variant="body2">
                      {property.land_area} {property.land_area_unit || 'м²'}
                    </Typography>
                  </Box>
                )}
                {property.rooms && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Комнат:
                    </Typography>
                    <Typography variant="body2">{property.rooms}</Typography>
                  </Box>
                )}
                {property.floor && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Этаж:
                    </Typography>
                    <Typography variant="body2">
                      {property.floor} / {property.floors || '?'}
                    </Typography>
                  </Box>
                )}
                {property.year_built && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Год постройки:
                    </Typography>
                    <Typography variant="body2">{property.year_built}</Typography>
                  </Box>
                )}
                {property.building_type && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Тип здания:
                    </Typography>
                    <Typography variant="body2">{property.building_type}</Typography>
                  </Box>
                )}
              </Box>

              {/* Auction info */}
              {property.sale_type === 'auction' && property.auction_start && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Аукцион
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Начало:
                      </Typography>
                      <Typography variant="body2">
                        {new Date(property.auction_start).toLocaleString('ru-BY')}
                      </Typography>
                    </Box>
                    {property.auction_end && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Окончание:
                        </Typography>
                        <Typography variant="body2">
                          {new Date(property.auction_end).toLocaleString('ru-BY')}
                        </Typography>
                      </Box>
                    )}
                    {property.bid_count !== null && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Ставок:
                        </Typography>
                        <Typography variant="body2">{property.bid_count}</Typography>
                      </Box>
                    )}
                  </Box>
                </>
              )}

              {/* Seller */}
              {property.seller_name && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Продавец
                  </Typography>
                  <Typography variant="body2">{property.seller_name}</Typography>
                  {property.seller_phone && (
                    <Typography variant="body2" color="text.secondary">
                      Тел: {property.seller_phone}
                    </Typography>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Description */}
        {property.description && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Описание
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {property.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
        on={{ view: ({ index }) => setLightboxIndex(index) }}
      />
    </Box>
  );
};

import React from 'react';
export default PropertyPage;
