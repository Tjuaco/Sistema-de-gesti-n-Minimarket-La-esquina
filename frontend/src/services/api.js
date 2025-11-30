import axios from 'axios';

/**
 * NOTA IMPORTANTE SOBRE ERRORES EN CONSOLA:
 * 
 * Cuando el backend no está disponible, el navegador mostrará automáticamente
 * errores de red (ERR_CONNECTION_REFUSED, ERR_NETWORK) en la consola.
 * Estos errores son parte del comportamiento normal del navegador y NO se pueden
 * silenciar completamente desde JavaScript. Son útiles para debugging.
 * 
 * Estos errores NO afectan el funcionamiento de la aplicación cuando el backend
 * no está disponible - la aplicación simplemente no podrá comunicarse con el servidor.
 * 
 * Cuando el backend esté disponible, estos errores desaparecerán automáticamente.
 */

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Variable para almacenar el token CSRF
let csrfToken = null;
// Variable para rastrear si el backend está disponible
let backendAvailable = true;
// Variable para rastrear si estamos intentando obtener el token
let fetchingToken = false;

// Interceptor para obtener token CSRF antes de peticiones que lo requieren
api.interceptors.request.use(
  async (config) => {
    // Evitar loop infinito: no obtener CSRF token para el endpoint de CSRF token
    if (config.url?.includes('csrf-token')) {
      return config;
    }
    
    // Solo obtener CSRF token para métodos que lo requieren
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      // Si no tenemos el token y el backend está disponible, intentar obtenerlo
      if (!csrfToken && backendAvailable && !fetchingToken) {
        fetchingToken = true;
        try {
          // Usar axios directamente para evitar loop
          // Usar timeout corto para fallar rápido si el backend no está disponible
          const response = await axios.get('http://localhost:8000/api/usuarios/csrf-token/', {
            withCredentials: true,
            timeout: 2000, // Timeout de 2 segundos para fallar rápido
          });
          
          if (response.status === 200 && response.data?.csrfToken) {
            csrfToken = response.data.csrfToken;
            backendAvailable = true;
          }
        } catch (err) {
          // Si es un error de conexión o timeout, marcar backend como no disponible
          if (err?.code === 'ERR_NETWORK' || 
              err?.code === 'ERR_CONNECTION_REFUSED' || 
              err?.code === 'ECONNABORTED') {
            backendAvailable = false;
            // Resetear después de 10 segundos para permitir reintentos cuando el backend esté disponible
            setTimeout(() => {
              backendAvailable = true;
              csrfToken = null;
            }, 10000);
          }
          // Silenciar errores de conexión - son esperados si el backend no está disponible
          // Nota: El navegador mostrará estos errores en la consola automáticamente,
          // pero no afectan el funcionamiento de la aplicación
        } finally {
          fetchingToken = false;
        }
      }
      
      // Agregar el token CSRF al header si está disponible
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { data, status } = error.response;
      
      // Manejar error 401 (no autenticado) - limpiar sesión
      if (status === 401) {
        // Disparar evento personalizado para que AuthContext limpie la sesión
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        // No rechazar aquí, dejar que el componente maneje el error
      }
      
      // Si hay un mensaje de error directo
      if (data.error && typeof data.error === 'string') {
        return Promise.reject(new Error(data.error));
      }
      
      // Si hay un mensaje detail
      if (data.detail && typeof data.detail === 'string') {
        return Promise.reject(new Error(data.detail));
      }
      
      // Manejar errores de validación de Django
      if (status === 400 && data) {
        let errorMessage = '';
        
        // Si es un string directo
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.non_field_errors) {
          // Errores generales
          errorMessage = Array.isArray(data.non_field_errors) 
            ? data.non_field_errors.join(', ') 
            : String(data.non_field_errors);
        } else if (data.items) {
          // Errores en items
          const itemErrors = [];
          if (Array.isArray(data.items)) {
            data.items.forEach((item, idx) => {
              if (item && typeof item === 'object') {
                Object.values(item).forEach(err => {
                  if (Array.isArray(err)) {
                    itemErrors.push(...err);
                  } else {
                    itemErrors.push(String(err));
                  }
                });
              } else {
                itemErrors.push(String(item));
              }
            });
          } else if (typeof data.items === 'object') {
            Object.values(data.items).forEach(err => {
              if (Array.isArray(err)) {
                itemErrors.push(...err);
              } else {
                itemErrors.push(String(err));
              }
            });
          }
          errorMessage = itemErrors.join(', ');
        } else {
          // Extraer todos los errores de validación
          const errors = [];
          Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach(err => {
                errors.push(`${key}: ${err}`);
              });
            } else if (typeof value === 'string') {
              errors.push(`${key}: ${value}`);
            } else {
              errors.push(`${key}: ${JSON.stringify(value)}`);
            }
          });
          errorMessage = errors.join(', ');
        }
        
        if (errorMessage) {
          return Promise.reject(new Error(errorMessage));
        }
      }
    }
    
    // Si no hay respuesta, devolver el error original
    return Promise.reject(error);
  }
);

export default api;

