import api from './api';

export const categoriasService = {
  getAll: (params = {}) => api.get('/inventario/categorias/', { params }),
  getById: (id) => api.get(`/inventario/categorias/${id}/`),
  create: (data) => api.post('/inventario/categorias/', data),
  update: (id, data) => api.put(`/inventario/categorias/${id}/`, data),
  delete: (id) => api.delete(`/inventario/categorias/${id}/`),
};




