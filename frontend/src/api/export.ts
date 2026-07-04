import apiClient from './client';

export interface ExportFilters {
  property_ids?: number[];
  region?: string[];
  property_type?: string[];
  sale_type?: string[];
  min_price?: number;
  max_price?: number;
}

export const exportApi = {
  exportExcel: async (filters: ExportFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters.property_ids?.length) {
      filters.property_ids.forEach((id) => params.append('property_ids', id.toString()));
    }
    if (filters.region?.length) {
      filters.region.forEach((r) => params.append('region', r));
    }
    if (filters.property_type?.length) {
      filters.property_type.forEach((t) => params.append('property_type', t));
    }
    if (filters.sale_type?.length) {
      filters.sale_type.forEach((t) => params.append('sale_type', t));
    }
    if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString());

    const response = await apiClient.get('/export/excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  exportPropertyPdf: async (propertyId: number): Promise<Blob> => {
    const response = await apiClient.get(`/export/pdf/${propertyId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportPropertiesPdfBatch: async (propertyIds: number[]): Promise<Blob> => {
    const response = await apiClient.post('/export/pdf/batch', propertyIds, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
