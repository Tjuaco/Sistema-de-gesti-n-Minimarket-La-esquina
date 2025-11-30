import api from './api';

export const productosService = {
  getAll: (params = {}) => api.get('/inventario/productos/', { params }),
  getById: (id) => api.get(`/inventario/productos/${id}/`),
  create: (data) => {
    // Si hay una imagen, usar FormData
    if (data.imagen instanceof File) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'imagen') {
          formData.append('imagen', data.imagen);
        } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          // Convertir booleanos y números a string para FormData
          if (typeof data[key] === 'boolean') {
            formData.append(key, data[key] ? 'true' : 'false');
          } else if (typeof data[key] === 'number') {
            formData.append(key, data[key].toString());
          } else if (typeof data[key] === 'string' && data[key].trim() !== '') {
            formData.append(key, data[key]);
          } else if (typeof data[key] !== 'string') {
            formData.append(key, data[key]);
          }
        }
      });
      return api.post('/inventario/productos/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    // Sin imagen, enviar JSON normal pero limpiar campos vacíos
    const cleanData = { ...data };
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === '' || cleanData[key] === null || cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });
    return api.post('/inventario/productos/', cleanData);
  },
  update: (id, data) => {
    // Si hay una imagen, usar FormData
    if (data.imagen instanceof File) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'imagen') {
          formData.append('imagen', data.imagen);
        } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          // Convertir booleanos y números a string para FormData
          if (typeof data[key] === 'boolean') {
            formData.append(key, data[key] ? 'true' : 'false');
          } else if (typeof data[key] === 'number') {
            formData.append(key, data[key].toString());
          } else if (typeof data[key] === 'string' && data[key].trim() !== '') {
            formData.append(key, data[key]);
          } else if (typeof data[key] !== 'string') {
            formData.append(key, data[key]);
          }
        }
      });
      return api.put(`/inventario/productos/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    // Sin imagen, enviar JSON normal pero limpiar campos vacíos
    const cleanData = { ...data };
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === '' || cleanData[key] === null || cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });
    return api.put(`/inventario/productos/${id}/`, cleanData);
  },
  delete: (id) => api.delete(`/inventario/productos/${id}/`),
  ajustarStock: (id, cantidad, motivo) =>
    api.post(`/inventario/productos/${id}/ajustar_stock/`, {
      cantidad,
      motivo: motivo || 'Ajuste manual',
    }),
  bajoStock: () => api.get('/inventario/productos/bajo_stock/'),
  exportarCSV: (params = {}) => 
    api.get('/inventario/productos/exportar_csv/', { 
      params,
      responseType: 'blob',
    }),
};

