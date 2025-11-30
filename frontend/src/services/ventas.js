import api from './api';

export const ventasService = {
  getAll: (params = {}) => api.get('/ventas/', { params }),
  getById: (id) => api.get(`/ventas/${id}/`),
  create: (data) => api.post('/ventas/', data),
  update: (id, data) => api.put(`/ventas/${id}/`, data),
  delete: (id) => api.delete(`/ventas/${id}/`),
  exportarCSV: (params = {}) => 
    api.get('/ventas/exportar_csv/', { 
      params,
      responseType: 'blob',
    }),
};

