import apiClient from './client';
import type { ParserStatus, ParserLog, ParserStats } from '@/types/api';

export interface ParserStartRequest {
  incremental?: boolean;
  property_types?: string[];
  regions?: string[];
  max_pages?: number;
  download_photos?: boolean;
}

export interface ParserControlRequest {
  action: 'pause' | 'resume' | 'stop';
}

export const parserApi = {
  getStatus: async (): Promise<ParserStatus> => {
    const response = await apiClient.get<ParserStatus>('/parser/status');
    return response.data;
  },

  start: async (request: ParserStartRequest): Promise<{ message: string; status: string }> => {
    const response = await apiClient.post<{ message: string; status: string }>(
      '/parser/start',
      request
    );
    return response.data;
  },

  control: async (request: ParserControlRequest): Promise<{ message: string; status: string }> => {
    const response = await apiClient.post<{ message: string; status: string }>(
      '/parser/control',
      request
    );
    return response.data;
  },

  getLogs: async (limit?: number, level?: string): Promise<ParserLog[]> => {
    const response = await apiClient.get<ParserLog[]>('/parser/logs', {
      params: { limit, level },
    });
    return response.data;
  },

  getStats: async (): Promise<ParserStats> => {
    const response = await apiClient.get<ParserStats>('/parser/stats');
    return response.data;
  },

  downloadLogs: async (): Promise<Blob> => {
    const response = await apiClient.get('/parser/logs/download', {
      responseType: 'blob',
    });
    return response.data;
  },
};
