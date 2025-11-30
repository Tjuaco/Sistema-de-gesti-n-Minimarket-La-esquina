import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, requiredPermission = null }) => {
  const { isAuthenticated, isLoading, puedeVentas, puedeCompras, puedeProductos, puedeReportes } = useAuth();

  // Mostrar spinner mientras se está verificando la sesión
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Solo redirigir al login si definitivamente no hay sesión
  // Si isLoading es false pero isAuthenticated es false, significa que se verificó y no hay sesión
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permisos específicos si se requiere
  if (requiredPermission) {
    const permissions = {
      ventas: puedeVentas,
      compras: puedeCompras,
      productos: puedeProductos,
      reportes: puedeReportes,
    };

    if (!permissions[requiredPermission]) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;



