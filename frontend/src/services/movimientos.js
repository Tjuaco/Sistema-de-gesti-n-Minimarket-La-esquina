import api from './api';

export const movimientosService = {
  getAll: (params = {}) => api.get('/inventario/movimientos/', { params }),
  getByProducto: (productoId, params = {}) => 
    api.get('/inventario/movimientos/', { params: { producto: productoId, ...params } }),
  exportarCSV: (params = {}) => 
    api.get('/inventario/movimientos/exportar_csv/', { 
      params,
      responseType: 'blob',
    }),
};



