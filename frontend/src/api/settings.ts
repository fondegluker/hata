import apiClient from './client';
import type { Settings } from '@/types/api';

export interface SettingsUpdate {
  theme?: 'light' | 'dark';
  language?: string;
  map_provider?: string;
  map_style?: string;
  map_default_lat?: number;
  map_default_lng?: number;
  map_default_zoom?: number;
  map_clustering?: boolean;
  map_show_markers_count?: boolean;
  parser_delay_min?: number;
  parser_delay_max?: number;
  parser_concurrent_pages?: number;
  parser_auto_save_interval?: number;
  parser_proxy_enabled?: boolean;
  show_photos_in_list?: boolean;
  photos_per_row?: number;
  cards_per_page?: number;
  default_sort_field?: string;
  default_sort_order?: string;
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  new_properties_notification?: boolean;
  saved_filters?: Record<string, unknown>;
}

export const settingsApi = {
  get: async (): Promise<Settings> => {
    const response = await apiClient.get<Settings>('/settings/');
    return response.data;
  },

  update: async (data: SettingsUpdate): Promise<Settings> => {
    const response = await apiClient.patch<Settings>('/settings/', data);
    return response.data;
  },

  reset: async (): Promise<Settings> => {
    const response = await apiClient.post<Settings>('/settings/reset');
    return response.data;
  },
};
