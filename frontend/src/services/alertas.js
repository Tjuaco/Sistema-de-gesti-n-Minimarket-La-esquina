import api from './api';

export const alertasService = {
  getAll: (params = {}) => api.get('/usuarios/alertas/', { params }),
  getById: (id) => api.get(`/usuarios/alertas/${id}/`),
  noLeidas: () => api.get('/usuarios/alertas/no_leidas/'),
  contarNoLeidas: () => api.get('/usuarios/alertas/contar_no_leidas/'),
  marcarLeida: (id) => api.post(`/usuarios/alertas/${id}/marcar_leida/`),
  marcarTodasLeidas: () => api.post('/usuarios/alertas/marcar_todas_leidas/'),
};




