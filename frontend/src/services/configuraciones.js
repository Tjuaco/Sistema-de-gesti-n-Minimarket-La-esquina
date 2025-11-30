import api from './api';

export const configuracionesService = {
  getAll: (params = {}) => api.get('/usuarios/configuraciones/', { params }),
  getById: (id) => api.get(`/usuarios/configuraciones/${id}/`),
  create: (data) => api.post('/usuarios/configuraciones/', data),
  update: (id, data) => api.put(`/usuarios/configuraciones/${id}/`, data),
  delete: (id) => api.delete(`/usuarios/configuraciones/${id}/`),
  obtenerDireccion: () => api.get('/usuarios/configuraciones/obtener_direccion/'),
  establecerDireccion: (direccion) => api.post('/usuarios/configuraciones/establecer_direccion/', { direccion }),
};


