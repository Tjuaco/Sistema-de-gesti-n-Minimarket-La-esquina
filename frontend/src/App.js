import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';
import { ThemeProvider, useThemeSettings } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Inicio from './pages/Inicio';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - los datos se consideran "frescos" por 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos - mantener datos en caché
      refetchOnWindowFocus: false, // No recargar al cambiar de ventana
      refetchOnMount: false, // No recargar si los datos están en caché
      retry: (failureCount, error) => {
        // No reintentar si es un error de conexión (backend no disponible)
        if (error?.code === 'ERR_NETWORK' || error?.code === 'ERR_CONNECTION_REFUSED') {
          return false;
        }
        // Reintentar solo 1 vez para otros errores
        return failureCount < 1;
      },
      onError: (error) => {
        // No mostrar errores en consola si es un error de conexión (backend no disponible)
        // Esto es normal durante el desarrollo cuando el backend no está corriendo
        if (error?.code !== 'ERR_NETWORK' && error?.code !== 'ERR_CONNECTION_REFUSED') {
          console.error('Query error:', error);
        }
      },
    },
    mutations: {
      onError: (error) => {
        // No mostrar errores en consola si es un error de conexión (backend no disponible)
        if (error?.code !== 'ERR_NETWORK' && error?.code !== 'ERR_CONNECTION_REFUSED') {
          console.error('Mutation error:', error);
        }
      },
    },
  },
});

// Lazy loading de componentes para mejorar el tiempo de carga inicial
const Productos = React.lazy(() => import('./pages/Productos'));
const Compras = React.lazy(() => import('./pages/Compras'));
const Ventas = React.lazy(() => import('./pages/Ventas'));
const Proveedores = React.lazy(() => import('./pages/Proveedores'));
const Reportes = React.lazy(() => import('./pages/Reportes'));
const Configuracion = React.lazy(() => import('./pages/Configuracion'));

// Componente de carga para Suspense
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
    <CircularProgress />
  </Box>
);

function AppContent() {
  const { theme } = useThemeSettings();

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Inicio />} />
          <Route path="/registro" element={<Inicio />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route 
                    path="/productos" 
                    element={
                      <ProtectedRoute requiredPermission="productos">
                        <Suspense fallback={<LoadingFallback />}>
                          <Productos />
                        </Suspense>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/compras" 
                    element={
                      <ProtectedRoute requiredPermission="compras">
                        <Suspense fallback={<LoadingFallback />}>
                          <Compras />
                        </Suspense>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/ventas" 
                    element={
                      <ProtectedRoute requiredPermission="ventas">
                        <Suspense fallback={<LoadingFallback />}>
                          <Ventas />
                        </Suspense>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/proveedores" 
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingFallback />}>
                          <Proveedores />
                        </Suspense>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/reportes" 
                    element={
                      <ProtectedRoute requiredPermission="reportes">
                        <Suspense fallback={<LoadingFallback />}>
                          <Reportes />
                        </Suspense>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/configuracion" 
                    element={
                      <ProtectedRoute requiredPermission="productos">
                        <Suspense fallback={<LoadingFallback />}>
                          <Configuracion />
                        </Suspense>
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </Router>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

