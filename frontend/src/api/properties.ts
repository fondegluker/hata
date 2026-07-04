import apiClient from './client';
import type { Property, PropertyListResponse, PropertyFilter, MapMarker } from '@/types/api';

export const propertiesApi = {
  list: async (filters: PropertyFilter): Promise<PropertyListResponse> => {
    const params = new URLSearchParams();

    // Add filters to params
    if (filters.search) params.append('search', filters.search);
    if (filters.property_type?.length) {
      filters.property_type.forEach((t) => params.append('property_type', t));
    }
    if (filters.sale_type?.length) {
      filters.sale_type.forEach((t) => params.append('sale_type', t));
    }
    if (filters.region?.length) {
      filters.region.forEach((r) => params.append('region', r));
    }
    if (filters.city?.length) {
      filters.city.forEach((c) => params.append('city', c));
    }
    if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    if (filters.min_area !== undefined) params.append('min_area', filters.min_area.toString());
    if (filters.max_area !== undefined) params.append('max_area', filters.max_area.toString());
    if (filters.min_rooms !== undefined) params.append('min_rooms', filters.min_rooms.toString());
    if (filters.max_rooms !== undefined) params.append('max_rooms', filters.max_rooms.toString());
    if (filters.status?.length) {
      filters.status.forEach((s) => params.append('status', s));
    }
    if (filters.has_coordinates !== undefined) {
      params.append('has_coordinates', filters.has_coordinates.toString());
    }
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());

    const response = await apiClient.get<PropertyListResponse>('/properties/', { params });
    return response.data;
  },

  get: async (id: number): Promise<Property> => {
    const response = await apiClient.get<Property>(`/properties/${id}`);
    return response.data;
  },

  getRegions: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/properties/regions');
    return response.data;
  },

  getCities: async (region?: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/properties/cities', {
      params: region ? { region } : undefined,
    });
    return response.data;
  },

  getPropertyTypes: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/properties/property-types');
    return response.data;
  },
};

export const mapApi = {
  getMarkers: async (filters?: {
    region?: string[];
    property_type?: string[];
    sale_type?: string[];
    min_price?: number;
    max_price?: number;
  }): Promise<MapMarker[]> => {
    const params = new URLSearchParams();
    if (filters?.region?.length) {
      filters.region.forEach((r) => params.append('region', r));
    }
    if (filters?.property_type?.length) {
      filters.property_type.forEach((t) => params.append('property_type', t));
    }
    if (filters?.sale_type?.length) {
      filters.sale_type.forEach((t) => params.append('sale_type', t));
    }
    if (filters?.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters?.max_price !== undefined) params.append('max_price', filters.max_price.toString());

    const response = await apiClient.get<MapMarker[]>('/map/markers', { params });
    return response.data;
  },

  getBounds: async (): Promise<{
    min_lat: number;
    max_lat: number;
    min_lng: number;
    max_lng: number;
  } | { center: { lat: number; lng: number }; zoom: number }> => {
    const response = await apiClient.get('/map/bounds');
    return response.data;
  },
};
