import api from './api';

export const proveedoresService = {
  getAll: (params = {}) => api.get('/inventario/proveedores/', { params }),
  getById: (id) => api.get(`/inventario/proveedores/${id}/`),
  create: (data) => api.post('/inventario/proveedores/', data),
  update: (id, data) => api.put(`/inventario/proveedores/${id}/`, data),
  enviarPedido: (id, data) => api.post(`/inventario/proveedores/${id}/enviar_pedido/`, data),
  getHistorialPedidos: (params = {}) => api.get('/inventario/pedidos-proveedores/', { params }),
  exportarHistorialExcel: (params = {}) => api.get('/inventario/pedidos-proveedores/exportar_excel/', { 
    params,
    responseType: 'blob' 
  }),
  exportarCSV: (params = {}) => 
    api.get('/inventario/proveedores/exportar_csv/', { 
      params,
      responseType: 'blob',
    }),
};

