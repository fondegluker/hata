import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Slider,
  Divider,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { settingsApi, type SettingsUpdate } from '@/api';
import { useSettingsStore, useAuthStore } from '@/store';
import type { Settings } from '@/types/api';

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { setTheme } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery<Settings>(
    'settings',
    () => settingsApi.get(),
    {
      enabled: isAuthenticated,
    }
  );

  const [formData, setFormData] = useState<SettingsUpdate>({
    theme: 'dark',
    language: 'ru',
    map_clustering: true,
    map_show_markers_count: true,
    show_photos_in_list: true,
    photos_per_row: 4,
    cards_per_page: 20,
    notifications_enabled: true,
  });

  // Update form data when settings load
  React.useEffect(() => {
    if (settings) {
      setFormData({
        theme: settings.theme,
        language: settings.language,
        map_provider: settings.map_provider,
        map_style: settings.map_style,
        map_default_lat: settings.map_default_lat ?? undefined,
        map_default_lng: settings.map_default_lng ?? undefined,
        map_default_zoom: settings.map_default_zoom ?? undefined,
        map_clustering: settings.map_clustering,
        map_show_markers_count: settings.map_show_markers_count,
        parser_delay_min: settings.parser_delay_min ?? undefined,
        parser_delay_max: settings.parser_delay_max ?? undefined,
        parser_concurrent_pages: settings.parser_concurrent_pages ?? undefined,
        parser_auto_save_interval: settings.parser_auto_save_interval ?? undefined,
        parser_proxy_enabled: settings.parser_proxy_enabled,
        show_photos_in_list: settings.show_photos_in_list,
        photos_per_row: settings.photos_per_row,
        cards_per_page: settings.cards_per_page,
        default_sort_field: settings.default_sort_field,
        default_sort_order: settings.default_sort_order,
        notifications_enabled: settings.notifications_enabled,
        email_notifications: settings.email_notifications,
        new_properties_notification: settings.new_properties_notification,
      });
    }
  }, [settings]);

  const updateMutation = useMutation(
    (data: SettingsUpdate) => settingsApi.update(data),
    {
      onSuccess: (data) => {
        setTheme(data.theme);
        queryClient.setQueryData('settings', data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      },
    }
  );

  const resetMutation = useMutation(() => settingsApi.reset(), {
    onSuccess: (data) => {
      queryClient.setQueryData('settings', data);
      setTheme(data.theme);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleReset = () => {
    resetMutation.mutate();
  };

  const handleChange = <K extends keyof SettingsUpdate>(
    key: K,
    value: SettingsUpdate[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Войдите в систему для доступа к настройкам</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Загрузка...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Настройки
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Настройки сохранены
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Interface settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Интерфейс
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.theme === 'dark'}
                    onChange={(e) => handleChange('theme', e.target.checked ? 'dark' : 'light')}
                  />
                }
                label="Тёмная тема"
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Язык</InputLabel>
                <Select
                  value={formData.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  label="Язык"
                >
                  <MenuItem value="ru">Русский</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.show_photos_in_list}
                    onChange={(e) => handleChange('show_photos_in_list', e.target.checked)}
                  />
                }
                label="Показывать фото в списке"
              />

              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>Фото в строке: {formData.photos_per_row}</Typography>
                <Slider
                  value={formData.photos_per_row}
                  onChange={(_, value) => handleChange('photos_per_row', value as number)}
                  min={2}
                  max={6}
                  step={1}
                  marks
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>Элементов на странице: {formData.cards_per_page}</Typography>
                <Slider
                  value={formData.cards_per_page}
                  onChange={(_, value) => handleChange('cards_per_page', value as number)}
                  min={10}
                  max={100}
                  step={10}
                  marks
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Map settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Карта
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.map_clustering}
                    onChange={(e) => handleChange('map_clustering', e.target.checked)}
                  />
                }
                label="Кластеризация маркеров"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.map_show_markers_count}
                    onChange={(e) => handleChange('map_show_markers_count', e.target.checked)}
                  />
                }
                label="Показывать количество маркеров"
              />

              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>Масштаб по умолчанию: {formData.map_default_zoom}</Typography>
                <Slider
                  value={formData.map_default_zoom ?? 7}
                  onChange={(_, value) => handleChange('map_default_zoom', value as number)}
                  min={1}
                  max={18}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Parser settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Парсер
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>
                  Задержка: {formData.parser_delay_min ?? 1} - {formData.parser_delay_max ?? 3} сек.
                </Typography>
                <Slider
                  value={[formData.parser_delay_min ?? 1, formData.parser_delay_max ?? 3]}
                  onChange={(_, value) => {
                    const [min, max] = value as [number, number];
                    handleChange('parser_delay_min', min);
                    handleChange('parser_delay_max', max);
                  }}
                  min={0.5}
                  max={10}
                  step={0.5}
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>
                  Параллельных страниц: {formData.parser_concurrent_pages ?? 2}
                </Typography>
                <Slider
                  value={formData.parser_concurrent_pages ?? 2}
                  onChange={(_, value) => handleChange('parser_concurrent_pages', value as number)}
                  min={1}
                  max={5}
                  step={1}
                  marks
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.parser_proxy_enabled}
                    onChange={(e) => handleChange('parser_proxy_enabled', e.target.checked)}
                  />
                }
                label="Использовать прокси"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Уведомления
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifications_enabled}
                    onChange={(e) => handleChange('notifications_enabled', e.target.checked)}
                  />
                }
                label="Включить уведомления"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.email_notifications}
                    onChange={(e) => handleChange('email_notifications', e.target.checked)}
                    disabled={!formData.notifications_enabled}
                  />
                }
                label="Email уведомления"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.new_properties_notification}
                    onChange={(e) => handleChange('new_properties_notification', e.target.checked)}
                    disabled={!formData.notifications_enabled}
                  />
                }
                label="Уведомлять о новых объектах"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={updateMutation.isLoading}
        >
          Сохранить
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleReset}
          disabled={resetMutation.isLoading}
        >
          Сбросить
        </Button>
      </Box>
    </Box>
  );
};

import React from 'react';
export default SettingsPage;
