import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
  Avatar,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  WarningAmber as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  ArrowForward as ArrowForwardIcon,
  Store as StoreIcon,
  LocalShipping as ShippingIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { productosService } from '../services/productos';
import { ventasService } from '../services/ventas';
import { comprasService } from '../services/compras';
import { alertasService } from '../services/alertas';
import { reportesService } from '../services/reportes';
import { useThemeSettings } from '../context/ThemeContext';
import { formatearPesosChilenos } from '../utils/formato';

function Dashboard() {
  const { settings } = useThemeSettings();
  const navigate = useNavigate();
  
  // Obtener fecha de hoy y ayer
  const hoy = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.toISOString().split('T')[0];
  }, []);

  const ayer = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    date.setHours(0, 0, 0, 0);
    return date.toISOString().split('T')[0];
  }, []);

  // Productos con stock bajo
  const { data: productos, isLoading: productosLoading } = useQuery(
    'productos-bajo-stock',
    () => productosService.bajoStock(),
    {
      refetchInterval: 30000, // Actualizar cada 30 segundos
      staleTime: 30 * 1000,
      cacheTime: 2 * 60 * 1000,
    }
  );

  // Alertas no leídas
  const { data: alertas, isLoading: alertasLoading } = useQuery(
    'alertas-no-leidas',
    () => alertasService.noLeidas(),
    {
      refetchInterval: 30000,
      staleTime: 30 * 1000,
      cacheTime: 2 * 60 * 1000,
    }
  );

  // Ventas de hoy
  const { data: ventasHoy, isLoading: ventasHoyLoading } = useQuery(
    ['ventas-diarias', hoy],
    () => reportesService.ventasDiarias(hoy),
    {
      refetchInterval: 60000, // Actualizar cada minuto
      staleTime: 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    }
  );

  // Ventas de ayer (para comparación)
  const { data: ventasAyer } = useQuery(
    ['ventas-diarias', ayer],
    () => reportesService.ventasDiarias(ayer),
    {
      staleTime: 10 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
    }
  );

  // Ventas recientes (últimas 5)
  const { data: ventas, isLoading: ventasLoading } = useQuery(
    ['ventas-recientes', 5],
    () => ventasService.getAll({ page_size: 5, ordering: '-fecha' }),
    {
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    }
  );

  // Compras recientes (últimas 5)
  const { data: compras, isLoading: comprasLoading } = useQuery(
    ['compras-recientes', 5],
    () => comprasService.getAll({ page_size: 5, ordering: '-fecha' }),
    {
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    }
  );

  // Compras de hoy
  const { data: comprasHoyData, isLoading: comprasHoyLoading } = useQuery(
    ['compras-hoy', hoy],
    () => comprasService.getAll({ 
      fecha_desde: `${hoy}T00:00:00`,
      fecha_hasta: `${hoy}T23:59:59`,
    }),
    {
      refetchInterval: 60000,
      staleTime: 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    }
  );

  // Total de productos activos
  const { data: productosActivos, isLoading: productosActivosLoading } = useQuery(
    'productos-activos',
    () => productosService.getAll({ activo: true, page_size: 1 }),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );

  // Obtener fecha de inicio de semana (lunes)
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const fechaInicioSemana = useMemo(() => getMonday(new Date()), []);

  // Quiebres de stock esta semana
  const { data: quiebres, isLoading: quiebresLoading } = useQuery(
    ['quiebres-semana', fechaInicioSemana],
    () => reportesService.quiebresSemana(fechaInicioSemana),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );

  // Rotación de inventario
  const { data: rotacion, isLoading: rotacionLoading } = useQuery(
    'rotacion-inventario',
    () => reportesService.rotacionInventario(),
    {
      staleTime: 10 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
    }
  );

  // Cálculos
  const totalVentasHoy = ventasHoy?.data?.total_ventas || 0;
  const cantidadVentasHoy = ventasHoy?.data?.cantidad_ventas || 0;
  const totalVentasAyer = ventasAyer?.data?.total_ventas || 0;
  const diferenciaVentas = totalVentasHoy - totalVentasAyer;
  const porcentajeCambioVentas = totalVentasAyer > 0 
    ? ((diferenciaVentas / totalVentasAyer) * 100).toFixed(1)
    : totalVentasHoy > 0 ? 100 : 0;

  const comprasHoy = comprasHoyData?.data?.results || [];
  const totalComprasHoy = comprasHoy.reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
  const cantidadComprasHoy = comprasHoy.length;

  const cantidadProductosBajoStock = productos?.data?.length || 0;
  const cantidadAlertas = alertas?.data?.length || 0;
  const totalQuiebresSemana = quiebres?.data?.total_quiebres || 0;
  const totalProductosActivos = productosActivos?.data?.count || productosActivos?.data?.results?.length || 0;
  
  // Calcular rotación promedio
  const productosConRotacion = rotacion?.data?.productos || [];
  const rotacionPromedio = productosConRotacion.length > 0
    ? productosConRotacion.reduce((sum, p) => sum + (p.rotacion || 0), 0) / productosConRotacion.length
    : 0;

  // Top productos vendidos hoy
  const topProductosHoy = ventasHoy?.data?.detalle_productos?.slice(0, 5) || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString('es-CL', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Typography>
      </Box>
      
      {/* Cards de Resumen Principal */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Ventas Hoy */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${settings.colorPrimario} 0%, #ff6f00 100%)`,
              color: 'white',
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
            onClick={() => navigate('/ventas')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                  <MoneyIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Ventas Hoy
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {ventasHoyLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      formatearPesosChilenos(totalVentasHoy)
                    )}
                  </Typography>
                  {!ventasHoyLoading && cantidadVentasHoy > 0 && (
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                      {cantidadVentasHoy} venta{cantidadVentasHoy > 1 ? 's' : ''}
                    </Typography>
                  )}
                </Box>
              </Box>
              {!ventasHoyLoading && totalVentasAyer > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {diferenciaVentas >= 0 ? (
                    <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  )}
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {diferenciaVentas >= 0 ? '+' : ''}{porcentajeCambioVentas}% vs ayer
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Stock Bajo */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: cantidadProductosBajoStock > 0 ? 'error.main' : 'grey.500',
              color: 'white',
              height: '100%',
              cursor: cantidadProductosBajoStock > 0 ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              '&:hover': cantidadProductosBajoStock > 0 ? {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              } : {},
            }}
            onClick={() => cantidadProductosBajoStock > 0 && navigate('/productos')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                  <WarningIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Stock Bajo
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {productosLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      cantidadProductosBajoStock
                    )}
                  </Typography>
                  {cantidadAlertas > 0 && (
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                      {cantidadAlertas} alerta{cantidadAlertas > 1 ? 's' : ''} nueva{cantidadAlertas > 1 ? 's' : ''}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Compras Hoy */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: 'info.main',
              color: 'white',
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
            onClick={() => navigate('/compras')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                  <ShippingIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Compras Hoy
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {comprasHoyLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      formatearPesosChilenos(totalComprasHoy)
                    )}
                  </Typography>
                  {!comprasHoyLoading && cantidadComprasHoy > 0 && (
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                      {cantidadComprasHoy} compra{cantidadComprasHoy > 1 ? 's' : ''}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Productos Activos */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: 'success.main',
              color: 'white',
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
            onClick={() => navigate('/productos')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                  <StoreIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Productos Activos
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {productosActivosLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      totalProductosActivos
                    )}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Métricas Adicionales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Rotación de Inventario */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Rotación de Inventario
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {rotacionLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ mb: 1 }}>
                    {rotacionPromedio.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {rotacionPromedio > 1 
                      ? 'Excelente rotación' 
                      : rotacionPromedio > 0.5 
                      ? 'Buena rotación' 
                      : 'Rotación baja - Revisar inventario'}
                  </Typography>
                  {productosConRotacion.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Basado en {productosConRotacion.length} productos activos
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quiebres de Stock */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon sx={{ mr: 1, color: totalQuiebresSemana > 0 ? 'error.main' : 'success.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Quiebres Esta Semana
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {quiebresLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  {totalQuiebresSemana > 0 ? (
                    <>
                      <Typography variant="h4" fontWeight="bold" color="error.main" sx={{ mb: 1 }}>
                        {totalQuiebresSemana}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Productos con stock agotado
                      </Typography>
                      {quiebres?.data?.quiebres?.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                            Más afectados:
                          </Typography>
                          {quiebres.data.quiebres.slice(0, 2).map((q, idx) => (
                            <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              • {q.producto__nombre} ({q.cantidad_quiebres}x)
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ mb: 1 }}>
                        0
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ¡Excelente! No hubo quiebres esta semana
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Productos Vendidos Hoy */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingCartIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Top Productos Hoy
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {ventasHoyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  {topProductosHoy.length > 0 ? (
                    <List dense>
                      {topProductosHoy.map((producto, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.875rem' }}>
                              {index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={producto.producto__nombre}
                            secondary={`${producto.cantidad_vendida} unidades - ${formatearPesosChilenos(producto.total_vendido)}`}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hay ventas registradas hoy
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detalles - Productos con Stock Bajo y Actividad Reciente */}
      <Grid container spacing={3}>
        {/* Productos con Stock Bajo */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WarningIcon sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Productos con Stock Bajo
                  </Typography>
                  {cantidadAlertas > 0 && (
                    <Chip
                      label={`${cantidadAlertas} nueva${cantidadAlertas > 1 ? 's' : ''}`}
                      color="error"
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  )}
                </Box>
                {productos?.data?.length > 0 && (
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/productos')}
                  >
                    Ver todos
                  </Button>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              {productosLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  {productos?.data?.length > 0 ? (
                    <>
                      {productos.data.slice(0, 5).map((producto, index) => {
                        const tieneAlerta = alertas?.data?.some(a => a.producto_codigo === producto.codigo);
                        const porcentajeStock = (producto.stock_actual / producto.stock_minimo) * 100;
                        return (
                          <Box key={producto.id}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                py: 1.5,
                                px: 2,
                                bgcolor: tieneAlerta 
                                  ? 'error.50' 
                                  : index % 2 === 0 
                                  ? 'grey.50' 
                                  : 'transparent',
                                borderRadius: 1,
                                mb: 0.5,
                                border: tieneAlerta ? '1px solid' : 'none',
                                borderColor: tieneAlerta ? 'error.main' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  bgcolor: tieneAlerta ? 'error.100' : 'action.hover',
                                  transform: 'translateX(4px)',
                                },
                              }}
                              onClick={() => navigate(`/productos`)}
                            >
                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="body1" fontWeight="medium" noWrap>
                                    {producto.nombre}
                                  </Typography>
                                  {tieneAlerta && (
                                    <Chip
                                      label="Nueva"
                                      color="error"
                                      size="small"
                                      sx={{ height: '20px', fontSize: '0.65rem' }}
                                    />
                                  )}
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                  {producto.codigo}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.min(porcentajeStock, 100)}
                                    sx={{
                                      flexGrow: 1,
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: 'grey.200',
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: porcentajeStock < 50 ? 'error.main' : 'warning.main',
                                      },
                                    }}
                                  />
                                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: '60px', textAlign: 'right' }}>
                                    {producto.stock_actual} / {producto.stock_minimo}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                      {productos.data.length > 5 && (
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                          <Button
                            size="small"
                            onClick={() => navigate('/productos')}
                          >
                            Ver {productos.data.length - 5} más
                          </Button>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                      No hay productos con stock bajo
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Actividad Reciente */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Actividad Reciente
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box>
                {/* Ventas Recientes */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ mb: 1 }}>
                    Últimas Ventas
                  </Typography>
                  {ventasLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Box>
                      {ventas?.data?.results?.length > 0 ? (
                        ventas.data.results.slice(0, 3).map((venta, index) => (
                          <Box
                            key={venta.id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              py: 1,
                              px: 1.5,
                              bgcolor: index % 2 === 0 ? 'grey.50' : 'transparent',
                              borderRadius: 1,
                              mb: 0.5,
                            }}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                Venta #{venta.numero_boleta || venta.id}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(venta.fecha).toLocaleString('es-CL', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Typography>
                            </Box>
                            <Chip
                              label={formatearPesosChilenos(venta.total)}
                              color="primary"
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                          No hay ventas recientes
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Compras Recientes */}
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ mb: 1 }}>
                    Últimas Compras
                  </Typography>
                  {comprasLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Box>
                      {compras?.data?.results?.length > 0 ? (
                        compras.data.results.slice(0, 3).map((compra, index) => (
                          <Box
                            key={compra.id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              py: 1,
                              px: 1.5,
                              bgcolor: index % 2 === 0 ? 'grey.50' : 'transparent',
                              borderRadius: 1,
                              mb: 0.5,
                            }}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                Compra #{compra.numero_factura || compra.id}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(compra.fecha).toLocaleString('es-CL', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Typography>
                            </Box>
                            <Chip
                              label={formatearPesosChilenos(compra.total)}
                              color="info"
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                          No hay compras recientes
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
