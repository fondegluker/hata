// API types

export interface User {
  id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  role: string;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserRegister {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
}

export interface Property {
  id: number;
  external_id: string;
  title: string;
  source_url: string | null;
  description: string | null;
  property_type: string;
  sale_type: string;
  region: string | null;
  district: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  total_area: number | null;
  living_area: number | null;
  land_area: number | null;
  land_area_unit: string | null;
  rooms: number | null;
  floors: number | null;
  floor: number | null;
  building_type: string | null;
  year_built: number | null;
  condition: string | null;
  price: number | null;
  starting_price: number | null;
  current_bid: number | null;
  price_per_sqm: number | null;
  currency: string;
  auction_start: string | null;
  auction_end: string | null;
  auction_status: string | null;
  bid_count: number | null;
  seller_name: string | null;
  seller_phone: string | null;
  seller_email: string | null;
  seller_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  parsed_at: string | null;
  photos: PropertyPhoto[];
}

export interface PropertyPhoto {
  id: number;
  property_id: number;
  original_url: string;
  local_path: string | null;
  order: number;
  description: string | null;
  is_main: boolean;
  created_at: string;
}

export interface PropertyListResponse {
  items: Property[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PropertyFilter {
  search?: string;
  property_type?: string[];
  sale_type?: string[];
  region?: string[];
  city?: string[];
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  min_rooms?: number;
  max_rooms?: number;
  status?: string[];
  has_coordinates?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface MapMarker {
  id: number;
  external_id: string;
  title: string;
  lat: number;
  lng: number;
  price: number | null;
  currency: string;
  property_type: string;
  sale_type: string;
  city: string | null;
  address: string | null;
  total_area: number | null;
  rooms: number | null;
  main_photo: string | null;
  status: string;
}

export interface Settings {
  id: number;
  user_id: number;
  theme: 'light' | 'dark';
  language: string;
  map_provider: string;
  map_style: string;
  map_default_lat: number | null;
  map_default_lng: number | null;
  map_default_zoom: number | null;
  map_clustering: boolean;
  map_show_markers_count: boolean;
  parser_delay_min: number | null;
  parser_delay_max: number | null;
  parser_concurrent_pages: number | null;
  parser_auto_save_interval: number | null;
  parser_proxy_enabled: boolean;
  show_photos_in_list: boolean;
  photos_per_row: number;
  cards_per_page: number;
  default_sort_field: string;
  default_sort_order: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  new_properties_notification: boolean;
  saved_filters: Record<string, unknown> | null;
}

export interface ParserProgress {
  status: 'idle' | 'running' | 'paused' | 'stopping' | 'error' | 'completed';
  current_page: number;
  total_pages: number;
  current_item: string | null;
  total_items_found: number;
  items_processed: number;
  items_added: number;
  items_updated: number;
  items_skipped: number;
  items_failed: number;
  photos_downloaded: number;
  photos_failed: number;
  started_at: string | null;
  estimated_completion: string | null;
}

export interface ParserStats {
  total_properties: number;
  total_photos: number;
  by_property_type: Record<string, number>;
  by_sale_type: Record<string, number>;
  by_region: Record<string, number>;
  by_status: Record<string, number>;
  last_parse_at: string | null;
  last_parse_duration: number | null;
  last_error: string | null;
  last_error_at: string | null;
}

export interface ParserLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  details: Record<string, unknown> | null;
}

export interface ParserStatus {
  progress: ParserProgress;
  stats: ParserStats;
  recent_logs: ParserLog[];
}
