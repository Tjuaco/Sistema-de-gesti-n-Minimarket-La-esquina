import api from './api';

export const reportesService = {
  ventasDiarias: (fecha, formato = 'json') => {
    const params = formato === 'csv' ? { fecha, formato: 'csv' } : { fecha };
    if (formato === 'csv') {
      return api.get('/reportes/ventas_diarias/', { 
        params,
        responseType: 'blob' 
      });
    }
    return api.get('/reportes/ventas_diarias/', { params });
  },
  
  ventasSemanales: (fechaInicio, formato = 'json') => {
    const params = formato === 'csv' ? { fecha_inicio: fechaInicio, formato: 'csv' } : { fecha_inicio: fechaInicio };
    if (formato === 'csv') {
      return api.get('/reportes/ventas_semanales/', { 
        params,
        responseType: 'blob' 
      });
    }
    return api.get('/reportes/ventas_semanales/', { params });
  },
  
  ventasMensuales: (año, mes, formato = 'json') => {
    const params = (formato === 'csv' || formato === 'excel') ? { año, mes, formato } : { año, mes };
    if (formato === 'csv' || formato === 'excel') {
      return api.get('/reportes/ventas_mensuales/', { 
        params,
        responseType: 'blob' 
      });
    }
    return api.get('/reportes/ventas_mensuales/', { params });
  },
  
  margenProductos: (formato = 'json') => {
    const params = formato === 'csv' ? { formato: 'csv' } : {};
    if (formato === 'csv') {
      return api.get('/reportes/margen_productos/', { 
        params,
        responseType: 'blob' 
      });
    }
    return api.get('/reportes/margen_productos/', { params });
  },
  
  rotacionInventario: (formato = 'json') => {
    const params = formato === 'csv' ? { formato: 'csv' } : {};
    if (formato === 'csv') {
      return api.get('/reportes/rotacion_inventario/', { 
        params,
        responseType: 'blob' 
      });
    }
    return api.get('/reportes/rotacion_inventario/', { params });
  },
  
  quiebresSemana: (fechaInicio, formato = 'json') => {
    const params = formato === 'csv' ? { fecha_inicio: fechaInicio, formato: 'csv' } : { fecha_inicio: fechaInicio };
    if (formato === 'csv') {
      return api.get('/reportes/quiebres_semana/', { 
        params,
        responseType: 'blob' 
      });
    }
    return api.get('/reportes/quiebres_semana/', { params });
  },
  
  comprasMensuales: (año, mes, formato = 'json') => {
    const params = formato === 'csv' ? { año, mes, formato: 'csv' } : { año, mes };
    if (formato === 'csv') {
      return api.get('/reportes/compras_mensuales/', { 
        params,
        responseType: 'blob' 
      });
    }
    return api.get('/reportes/compras_mensuales/', { params });
  },
  
  reporteProveedores: (formato = 'json') => {
    const params = formato === 'csv' ? { formato: 'csv' } : {};
    if (formato === 'csv') {
      return api.get('/reportes/reporte_proveedores/', { 
        params,
        responseType: 'blob' 
      });
    }
    return api.get('/reportes/reporte_proveedores/', { params });
  },
  
  reporteProductos: (formato = 'json') => {
    const params = formato === 'csv' ? { formato: 'csv' } : {};
    if (formato === 'csv') {
      return api.get('/reportes/reporte_productos/', { 
        params,
        responseType: 'blob' 
      });
    }
    return api.get('/reportes/reporte_productos/', { params });
  },
  
  descargarCSV: (blob, nombreArchivo) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};




