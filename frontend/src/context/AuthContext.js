import React, { createContext, useState, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const queryClient = useQueryClient();

  // Obtener usuario actual al cargar la aplicación
  // Esto verifica si hay una sesión activa cuando se recarga la página
  const { data: currentUser, isLoading } = useQuery(
    'current-user',
    () => authService.getCurrentUser(),
    {
      enabled: true, // Ejecutar automáticamente al montar
      retry: (failureCount, error) => {
        // No reintentar si es un error de conexión o si es 401 (no autenticado)
        if (error?.code === 'ERR_NETWORK' || 
            error?.code === 'ERR_CONNECTION_REFUSED' ||
            error?.response?.status === 401) {
          return false;
        }
        // Reintentar solo 1 vez para otros errores
        return failureCount < 1;
      },
      onSuccess: (response) => {
        setUser(response.data);
        setIsInitializing(false);
      },
      onError: (error) => {
        // Solo limpiar usuario si es un error 401 (no autenticado)
        // No limpiar si es un error de conexión (backend no disponible)
        if (error?.response?.status === 401) {
          // Error 401: definitivamente no hay sesión
          setUser(null);
          setIsInitializing(false);
        } else if (error?.code === 'ERR_NETWORK' || error?.code === 'ERR_CONNECTION_REFUSED') {
          // Error de conexión: el backend no está disponible
          // Si hay datos en caché (de una sesión previa), usarlos temporalmente
          const cachedData = queryClient.getQueryData('current-user');
          if (cachedData?.data) {
            setUser(cachedData.data);
          }
          setIsInitializing(false);
        } else {
          // Otros errores: asumir que no hay sesión
          setUser(null);
          setIsInitializing(false);
        }
      },
      useErrorBoundary: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      // Usar datos en caché si están disponibles mientras se carga
      placeholderData: (previousData) => previousData,
    }
  );

  // Sincronizar el estado del usuario con los datos del query cuando cambian
  useEffect(() => {
    if (currentUser?.data) {
      setUser(currentUser.data);
    }
  }, [currentUser]);

  // Escuchar eventos de no autorizado desde el interceptor de API
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      queryClient.setQueryData('current-user', null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [queryClient]);

  // Mutación de login
  const loginMutation = useMutation(
    ({ username, password }) => authService.login(username, password),
    {
      onSuccess: (response) => {
        setUser(response.data.user);
        queryClient.invalidateQueries('current-user');
      },
      onError: (error) => {
        // Propagar el error para que el componente pueda manejarlo
        // No hacer nada aquí, dejar que el componente maneje el error
      },
    }
  );

  // Mutación de logout
  const logoutMutation = useMutation(
    () => authService.logout(),
    {
      onSuccess: () => {
        setUser(null);
        queryClient.clear();
      },
    }
  );

  const login = (username, password) => {
    return loginMutation.mutateAsync({ username, password });
  };

  const logout = () => {
    return logoutMutation.mutateAsync();
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.rol === 'ADMINISTRADOR';
  const isCajero = user?.rol === 'CAJERO';
  const isBodeguero = user?.rol === 'BODEGUERO';

  // Permisos
  const puedeVentas = isCajero || isAdmin;
  const puedeCompras = isBodeguero || isAdmin;
  const puedeProductos = isAdmin;
  const puedeReportes = isAdmin;

  const value = {
    user,
    isLoading: isLoading || isInitializing, // Combinar ambos estados de carga
    isAuthenticated,
    isAdmin,
    isCajero,
    isBodeguero,
    puedeVentas,
    puedeCompras,
    puedeProductos,
    puedeReportes,
    login,
    logout,
    loginLoading: loginMutation.isLoading,
    logoutLoading: logoutMutation.isLoading,
    refetchUser: () => queryClient.invalidateQueries('current-user'), // Función para refrescar usuario
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



