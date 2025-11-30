import api from './api';

export const comprasService = {
  getAll: (params = {}) => api.get('/compras/', { params }),
  getById: (id) => api.get(`/compras/${id}/`),
  create: (data) => api.post('/compras/', data),
  update: (id, data) => api.put(`/compras/${id}/`, data),
  delete: (id) => api.delete(`/compras/${id}/`),
  exportarCSV: (params = {}) => 
    api.get('/compras/exportar_csv/', { 
      params,
      responseType: 'blob',
    }),
};

