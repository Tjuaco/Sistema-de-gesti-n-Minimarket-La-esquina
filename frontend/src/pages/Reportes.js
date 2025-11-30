import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  Avatar,
  TableSortLabel,
  Snackbar,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { reportesService } from '../services/reportes';
import { formatearPesosChilenos } from '../utils/formato';
import { useThemeSettings } from '../context/ThemeContext';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`reporte-tabpanel-${index}`} aria-labelledby={`reporte-tab-${index}`}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Reportes() {
  const { settings } = useThemeSettings();
  const [tab, setTab] = useState(0);
  const [año, setAño] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Estados para ordenamiento
  const [orderBy, setOrderBy] = useState({});
  const [orderDirection, setOrderDirection] = useState({});
  

  // Compras Mensuales (tab 0)
  const { data: reporteComprasMensual, isLoading: loadingComprasMensual, error: errorComprasMensual } = useQuery(
    ['compras-mensuales', año, mes],
    () => reportesService.comprasMensuales(año, mes),
    { 
      enabled: tab === 0,
      staleTime: 2 * 60 * 1000,
      retry: 1,
      onError: (error) => {
        console.error('Error al cargar reporte compras mensuales:', error);
      },
    }
  );

  // Ventas Mensuales (tab 1)
  const { data: reporteMensual, isLoading: loadingMensual, error: errorMensual } = useQuery(
    ['reporte-mensual', año, mes],
    () => reportesService.ventasMensuales(año, mes),
    { 
      enabled: tab === 1,
      staleTime: 2 * 60 * 1000,
      retry: 1,
      onError: (error) => {
        console.error('Error al cargar reporte mensual:', error);
      },
    }
  );

  // Reporte Proveedores (tab 2)
  const { data: reporteProveedores, isLoading: loadingProveedores, error: errorProveedores } = useQuery(
    'reporte-proveedores',
    () => reportesService.reporteProveedores(),
    { 
      enabled: tab === 2,
      staleTime: 5 * 60 * 1000,
      retry: 1,
      onError: (error) => {
        console.error('Error al cargar reporte proveedores:', error);
      },
    }
  );

  // Reporte Productos (tab 3)
  const { data: reporteProductos, isLoading: loadingProductos, error: errorProductos } = useQuery(
    'reporte-productos',
    () => reportesService.reporteProductos(),
    { 
      enabled: tab === 3,
      staleTime: 5 * 60 * 1000,
      retry: 1,
      onError: (error) => {
        console.error('Error al cargar reporte productos:', error);
      },
    }
  );

  // Margen Productos (tab 4)
  const { data: reporteMargen, isLoading: loadingMargen, error: errorMargen } = useQuery(
    'reporte-margen',
    () => reportesService.margenProductos(),
    { 
      enabled: tab === 4,
      staleTime: 5 * 60 * 1000,
      retry: 1,
      onError: (error) => {
        console.error('Error al cargar reporte margen:', error);
      },
    }
  );

  // Rotación Inventario (tab 5)
  const { data: reporteRotacion, isLoading: loadingRotacion, error: errorRotacion } = useQuery(
    'reporte-rotacion',
    () => reportesService.rotacionInventario(),
    { 
      enabled: tab === 5,
      staleTime: 5 * 60 * 1000,
      retry: 1,
      onError: (error) => {
        console.error('Error al cargar reporte rotación:', error);
      },
    }
  );

  const handleSort = (tabIndex, column) => {
    if (orderBy[tabIndex] === column) {
      setOrderDirection({
        ...orderDirection,
        [tabIndex]: orderDirection[tabIndex] === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setOrderBy({ ...orderBy, [tabIndex]: column });
      setOrderDirection({ ...orderDirection, [tabIndex]: 'asc' });
    }
  };

  const sortData = (data, tabIndex, getValue) => {
    if (!orderBy[tabIndex]) return data;
    
    const sorted = [...data].sort((a, b) => {
      const aValue = getValue(a);
      const bValue = getValue(b);
      const direction = orderDirection[tabIndex] === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * direction;
      }
      return String(aValue).localeCompare(String(bValue)) * direction;
    });
    
    return sorted;
  };


  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      // Si es una fecha en formato YYYY-MM-DD, parsearla correctamente
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-CL', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  // Datos ordenados para cada tab
  // Compras Mensuales - Top productos comprados (tab 0)
  const topProductosCompradosOrdenado = useMemo(() => {
    const datos = reporteComprasMensual?.data?.top_productos || [];
    if (!Array.isArray(datos) || datos.length === 0) return [];
    return sortData(datos, 0, (item) => {
      switch (orderBy[0]) {
        case 'total': return item.total_comprado || 0;
        case 'cantidad': return item.cantidad_comprada || 0;
        default: return item.producto__nombre || '';
      }
    });
  }, [reporteComprasMensual, orderBy, orderDirection]);

  const comprasPorProveedorOrdenado = useMemo(() => {
    const datos = reporteComprasMensual?.data?.compras_por_proveedor || [];
    if (!Array.isArray(datos) || datos.length === 0) return [];
    return sortData(datos, 0, (item) => {
      switch (orderBy[0]) {
        case 'total': return item.total_comprado || 0;
        case 'cantidad': return item.cantidad_compras || 0;
        default: return item.proveedor__nombre || '';
      }
    });
  }, [reporteComprasMensual, orderBy, orderDirection]);

  // Ventas Mensuales - Top productos vendidos (tab 1)
  const topProductosVendidosOrdenado = useMemo(() => {
    const datos = reporteMensual?.data?.top_productos || [];
    if (!Array.isArray(datos) || datos.length === 0) return [];
    return sortData(datos, 1, (item) => {
      switch (orderBy[1]) {
        case 'total': return item.total_vendido || 0;
        case 'cantidad': return item.cantidad_vendida || 0;
        default: return item.producto__nombre || '';
      }
    });
  }, [reporteMensual, orderBy, orderDirection]);

  // Proveedores ordenados (tab 2)
  const proveedoresOrdenado = useMemo(() => {
    const datos = reporteProveedores?.data?.proveedores || [];
    if (!Array.isArray(datos) || datos.length === 0) return [];
    return sortData(datos, 2, (item) => {
      switch (orderBy[2]) {
        case 'total': return item.total_compras_30dias || 0;
        case 'cantidad': return item.cantidad_compras_30dias || 0;
        case 'productos': return item.cantidad_productos || 0;
        default: return item.nombre || '';
      }
    });
  }, [reporteProveedores, orderBy, orderDirection]);

  // Productos ordenados (tab 3)
  const productosBajoStockOrdenado = useMemo(() => {
    const datos = reporteProductos?.data?.productos_bajo_stock || [];
    if (!Array.isArray(datos) || datos.length === 0) return [];
    return sortData(datos, 3, (item) => {
      switch (orderBy[3]) {
        case 'stock': return item.stock_actual || 0;
        case 'minimo': return item.stock_minimo || 0;
        default: return item.nombre || '';
      }
    });
  }, [reporteProductos, orderBy, orderDirection]);

  const productosMasVendidosOrdenado = useMemo(() => {
    const datos = reporteProductos?.data?.productos_mas_vendidos || [];
    if (!Array.isArray(datos) || datos.length === 0) return [];
    return sortData(datos, 3, (item) => {
      switch (orderBy[3]) {
        case 'cantidad': return item.cantidad_vendida_30dias || 0;
        case 'precio': return item.precio_venta || 0;
        default: return item.nombre || '';
      }
    });
  }, [reporteProductos, orderBy, orderDirection]);

  // Margen Productos (tab 4)
  const productosMargenOrdenado = useMemo(() => {
    const datos = reporteMargen?.data?.productos || [];
    if (!Array.isArray(datos) || datos.length === 0) return [];
    return sortData(datos, 4, (item) => {
      switch (orderBy[4]) {
        case 'margen': return item.margen_porcentaje || 0;
        case 'ganancia': return item.ganancia_unitaria || 0;
        case 'stock': return item.stock_actual || 0;
        default: return item.nombre || '';
      }
    });
  }, [reporteMargen, orderBy, orderDirection]);

  // Rotación Inventario (tab 5)
  const productosRotacionOrdenado = useMemo(() => {
    const datos = reporteRotacion?.data?.productos || [];
    if (!Array.isArray(datos) || datos.length === 0) return [];
    return sortData(datos, 5, (item) => {
      switch (orderBy[5]) {
        case 'rotacion': return item.rotacion || 0;
        case 'vendido': return item.cantidad_vendida_30dias || 0;
        case 'stock': return item.stock_actual || 0;
        default: return item.nombre || '';
      }
    });
  }, [reporteRotacion, orderBy, orderDirection]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Reportes
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Compras Mensuales" icon={<ShoppingCartIcon />} iconPosition="start" />
          <Tab label="Ventas Mensuales" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label="Proveedores" icon={<TrendingUpIcon />} iconPosition="start" />
          <Tab label="Productos" icon={<InventoryIcon />} iconPosition="start" />
          <Tab label="Margen Productos" icon={<TrendingUpIcon />} iconPosition="start" />
          <Tab label="Rotación Inventario" icon={<InventoryIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Compras Mensuales */}
      {/* Compras Mensuales */}
      <TabPanel value={tab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Año"
              type="number"
              value={año}
              onChange={(e) => setAño(parseInt(e.target.value) || new Date().getFullYear())}
              inputProps={{ min: 2000, max: 2100 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Mes"
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value))}
            >
              {meses.map((opcion) => (
                <MenuItem key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          </Grid>
          <Grid item xs={12}>
            {loadingComprasMensual ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : errorComprasMensual ? (
              <Alert severity="error">
                Error al cargar el reporte: {errorComprasMensual.message || 'Error desconocido'}
              </Alert>
            ) : (() => {
              const datosCompras = reporteComprasMensual?.data;
              return datosCompras ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumen de Compras - {meses.find(m => m.value === mes)?.label} {año}
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <AttachMoneyIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Total Compras
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {formatearPesosChilenos(datosCompras.total_compras || 0)}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <ShoppingCartIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Cantidad Compras
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {datosCompras.cantidad_compras || 0}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <TrendingUpIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Ticket Promedio
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {datosCompras.cantidad_compras > 0
                                  ? formatearPesosChilenos(
                                      (datosCompras.total_compras || 0) / datosCompras.cantidad_compras
                                    )
                                  : formatearPesosChilenos(0)}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <InventoryIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Productos Comprados
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {topProductosCompradosOrdenado.length}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Top 10 Productos Comprados
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy[0] === 'codigo'}
                              direction={orderBy[0] === 'codigo' ? orderDirection[0] : 'asc'}
                              onClick={() => handleSort(0, 'codigo')}
                            >
                              Código
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy[0] === 'nombre'}
                              direction={orderBy[0] === 'nombre' ? orderDirection[0] : 'asc'}
                              onClick={() => handleSort(0, 'nombre')}
                            >
                              Producto
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[0] === 'cantidad'}
                              direction={orderBy[0] === 'cantidad' ? orderDirection[0] : 'asc'}
                              onClick={() => handleSort(0, 'cantidad')}
                            >
                              Cantidad Comprada
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[0] === 'total'}
                              direction={orderBy[0] === 'total' ? orderDirection[0] : 'asc'}
                              onClick={() => handleSort(0, 'total')}
                            >
                              Total Comprado
                            </TableSortLabel>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topProductosCompradosOrdenado.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                No hay datos para este mes
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          topProductosCompradosOrdenado.map((item, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Chip label={idx + 1} size="small" color="primary" />
                              </TableCell>
                              <TableCell>{item.producto__codigo || '-'}</TableCell>
                              <TableCell>{item.producto__nombre || '-'}</TableCell>
                              <TableCell align="right">{item.cantidad_comprada || 0}</TableCell>
                              <TableCell align="right">
                                {formatearPesosChilenos(item.total_comprado || 0)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Typography variant="h6" gutterBottom>
                    Compras por Proveedor
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy[0] === 'proveedor'}
                              direction={orderBy[0] === 'proveedor' ? orderDirection[0] : 'asc'}
                              onClick={() => handleSort(0, 'proveedor')}
                            >
                              Proveedor
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[0] === 'total'}
                              direction={orderBy[0] === 'total' ? orderDirection[0] : 'asc'}
                              onClick={() => handleSort(0, 'total')}
                            >
                              Total Comprado
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[0] === 'cantidad'}
                              direction={orderBy[0] === 'cantidad' ? orderDirection[0] : 'asc'}
                              onClick={() => handleSort(0, 'cantidad')}
                            >
                              Cantidad Compras
                            </TableSortLabel>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {comprasPorProveedorOrdenado.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                No hay datos para este mes
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          comprasPorProveedorOrdenado.map((item, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>{item.proveedor__nombre || '-'}</TableCell>
                              <TableCell align="right">
                                {formatearPesosChilenos(item.total_comprado || 0)}
                              </TableCell>
                              <TableCell align="right">{item.cantidad_compras || 0}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
              ) : (
                <Alert severity="info">No hay datos para este mes</Alert>
              );
            })()}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Ventas Mensuales */}
      <TabPanel value={tab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Año"
              type="number"
              value={año}
              onChange={(e) => setAño(parseInt(e.target.value) || new Date().getFullYear())}
              inputProps={{ min: 2000, max: 2100 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Mes"
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value))}
            >
              {meses.map((opcion) => (
                <MenuItem key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          </Grid>
          <Grid item xs={12}>
            {loadingMensual ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : errorMensual ? (
              <Alert severity="error">
                Error al cargar el reporte: {errorMensual.message || 'Error desconocido'}
              </Alert>
            ) : (() => {
              const datosMensual = reporteMensual?.data;
              return datosMensual ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumen Mensual - {meses.find(m => m.value === mes)?.label} {año}
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <AttachMoneyIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Total Ventas
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {formatearPesosChilenos(datosMensual.total_ventas || 0)}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <ShoppingCartIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Cantidad Ventas
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {datosMensual.cantidad_ventas || 0}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <TrendingUpIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Ticket Promedio
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {datosMensual.cantidad_ventas > 0
                                  ? formatearPesosChilenos(
                                      (datosMensual.total_ventas || 0) / datosMensual.cantidad_ventas
                                    )
                                  : formatearPesosChilenos(0)}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <InventoryIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Productos Top
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {topProductosVendidosOrdenado.length}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  <Typography variant="h6" gutterBottom>
                    Top 10 Productos
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy[1] === 'codigo'}
                              direction={orderBy[1] === 'codigo' ? orderDirection[1] : 'asc'}
                              onClick={() => handleSort(1, 'codigo')}
                            >
                              Código
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy[1] === 'nombre'}
                              direction={orderBy[1] === 'nombre' ? orderDirection[1] : 'asc'}
                              onClick={() => handleSort(1, 'nombre')}
                            >
                              Producto
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[1] === 'cantidad'}
                              direction={orderBy[1] === 'cantidad' ? orderDirection[1] : 'asc'}
                              onClick={() => handleSort(1, 'cantidad')}
                            >
                              Cantidad Vendida
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[1] === 'total'}
                              direction={orderBy[1] === 'total' ? orderDirection[1] : 'asc'}
                              onClick={() => handleSort(1, 'total')}
                            >
                              Total Vendido
                            </TableSortLabel>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topProductosVendidosOrdenado.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                No hay datos para este mes
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          topProductosVendidosOrdenado.map((item, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Chip label={idx + 1} size="small" color="primary" />
                              </TableCell>
                              <TableCell>{item.producto__codigo || '-'}</TableCell>
                              <TableCell>{item.producto__nombre || '-'}</TableCell>
                              <TableCell align="right">{item.cantidad_vendida || 0}</TableCell>
                              <TableCell align="right">
                                {formatearPesosChilenos(item.total_vendido || 0)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
              ) : (
                <Alert severity="info">No hay datos para este mes</Alert>
              );
            })()}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Reporte Proveedores */}
      <TabPanel value={tab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          </Grid>
          <Grid item xs={12}>
            {loadingProveedores ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : errorProveedores ? (
              <Alert severity="error">
                Error al cargar el reporte: {errorProveedores.message || 'Error desconocido'}
              </Alert>
            ) : proveedoresOrdenado.length > 0 ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Reporte de Proveedores
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total de proveedores activos: {proveedoresOrdenado.length}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy[2] === 'nombre'}
                              direction={orderBy[2] === 'nombre' ? orderDirection[2] : 'asc'}
                              onClick={() => handleSort(2, 'nombre')}
                            >
                              Nombre
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>RUT</TableCell>
                          <TableCell>Contacto</TableCell>
                          <TableCell>Teléfono</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[2] === 'productos'}
                              direction={orderBy[2] === 'productos' ? orderDirection[2] : 'asc'}
                              onClick={() => handleSort(2, 'productos')}
                            >
                              Cant. Productos
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[2] === 'total'}
                              direction={orderBy[2] === 'total' ? orderDirection[2] : 'asc'}
                              onClick={() => handleSort(2, 'total')}
                            >
                              Total Compras 30 días
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[2] === 'cantidad'}
                              direction={orderBy[2] === 'cantidad' ? orderDirection[2] : 'asc'}
                              onClick={() => handleSort(2, 'cantidad')}
                            >
                              Cant. Compras 30 días
                            </TableSortLabel>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {proveedoresOrdenado.map((item, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>{item.nombre}</TableCell>
                            <TableCell>{item.rut || '-'}</TableCell>
                            <TableCell>{item.contacto || '-'}</TableCell>
                            <TableCell>{item.telefono || '-'}</TableCell>
                            <TableCell>{item.email || '-'}</TableCell>
                            <TableCell align="right">{item.cantidad_productos || 0}</TableCell>
                            <TableCell align="right">
                              {formatearPesosChilenos(item.total_compras_30dias || 0)}
                            </TableCell>
                            <TableCell align="right">{item.cantidad_compras_30dias || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info">No hay proveedores activos</Alert>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Reporte Productos */}
      <TabPanel value={tab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          </Grid>
          <Grid item xs={12}>
            {loadingProductos ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : errorProductos ? (
              <Alert severity="error">
                Error al cargar el reporte: {errorProductos.message || 'Error desconocido'}
              </Alert>
            ) : reporteProductos?.data ? (
              <>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Productos con Stock Bajo
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total: {productosBajoStockOrdenado.length} productos
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <TableSortLabel
                                active={orderBy[3] === 'codigo'}
                                direction={orderBy[3] === 'codigo' ? orderDirection[3] : 'asc'}
                                onClick={() => handleSort(3, 'codigo')}
                              >
                                Código
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={orderBy[3] === 'nombre'}
                                direction={orderBy[3] === 'nombre' ? orderDirection[3] : 'asc'}
                                onClick={() => handleSort(3, 'nombre')}
                              >
                                Producto
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>Categoría</TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy[3] === 'stock'}
                                direction={orderBy[3] === 'stock' ? orderDirection[3] : 'asc'}
                                onClick={() => handleSort(3, 'stock')}
                              >
                                Stock Actual
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy[3] === 'minimo'}
                                direction={orderBy[3] === 'minimo' ? orderDirection[3] : 'asc'}
                                onClick={() => handleSort(3, 'minimo')}
                              >
                                Stock Mínimo
                              </TableSortLabel>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productosBajoStockOrdenado.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                  No hay productos con stock bajo
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            productosBajoStockOrdenado.map((item, idx) => (
                              <TableRow key={idx} hover>
                                <TableCell>{item.codigo}</TableCell>
                                <TableCell>{item.nombre}</TableCell>
                                <TableCell>{item.categoria__nombre || '-'}</TableCell>
                                <TableCell align="right">
                                  <Chip
                                    label={item.stock_actual}
                                    size="small"
                                    color={item.stock_actual <= 0 ? 'error' : 'warning'}
                                  />
                                </TableCell>
                                <TableCell align="right">{item.stock_minimo}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Productos Más Vendidos (Últimos 30 días)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total: {productosMasVendidosOrdenado.length} productos
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={orderBy[3] === 'codigo'}
                                direction={orderBy[3] === 'codigo' ? orderDirection[3] : 'asc'}
                                onClick={() => handleSort(3, 'codigo')}
                              >
                                Código
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={orderBy[3] === 'nombre'}
                                direction={orderBy[3] === 'nombre' ? orderDirection[3] : 'asc'}
                                onClick={() => handleSort(3, 'nombre')}
                              >
                                Producto
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy[3] === 'cantidad'}
                                direction={orderBy[3] === 'cantidad' ? orderDirection[3] : 'asc'}
                                onClick={() => handleSort(3, 'cantidad')}
                              >
                                Cantidad Vendida
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy[3] === 'precio'}
                                direction={orderBy[3] === 'precio' ? orderDirection[3] : 'asc'}
                                onClick={() => handleSort(3, 'precio')}
                              >
                                Precio Venta
                              </TableSortLabel>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productosMasVendidosOrdenado.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                  No hay datos disponibles
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            productosMasVendidosOrdenado.map((item, idx) => (
                              <TableRow key={idx} hover>
                                <TableCell>
                                  <Chip label={idx + 1} size="small" color="primary" />
                                </TableCell>
                                <TableCell>{item.codigo}</TableCell>
                                <TableCell>{item.nombre}</TableCell>
                                <TableCell align="right">{item.cantidad_vendida_30dias || 0}</TableCell>
                                <TableCell align="right">
                                  {formatearPesosChilenos(item.precio_venta || 0)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Alert severity="info">No hay datos disponibles</Alert>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Margen Productos */}
      <TabPanel value={tab} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          </Grid>
          <Grid item xs={12}>
            {loadingMargen ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : errorMargen ? (
              <Alert severity="error">
                Error al cargar el reporte: {errorMargen.message || 'Error desconocido'}
              </Alert>
            ) : reporteMargen?.data?.productos?.length > 0 ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Margen de Ganancia por Producto
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total de productos: {productosMargenOrdenado.length}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy[3] === 'codigo'}
                              direction={orderBy[3] === 'codigo' ? orderDirection[3] : 'asc'}
                              onClick={() => handleSort(3, 'codigo')}
                            >
                              Código
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy[3] === 'nombre'}
                              direction={orderBy[3] === 'nombre' ? orderDirection[3] : 'asc'}
                              onClick={() => handleSort(3, 'nombre')}
                            >
                              Producto
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[3] === 'costo'}
                              direction={orderBy[3] === 'costo' ? orderDirection[3] : 'asc'}
                              onClick={() => handleSort(3, 'costo')}
                            >
                              Costo
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">Precio Venta</TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[3] === 'ganancia'}
                              direction={orderBy[3] === 'ganancia' ? orderDirection[3] : 'asc'}
                              onClick={() => handleSort(3, 'ganancia')}
                            >
                              Ganancia Unitaria
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[3] === 'margen'}
                              direction={orderBy[3] === 'margen' ? orderDirection[3] : 'asc'}
                              onClick={() => handleSort(3, 'margen')}
                            >
                              Margen %
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[3] === 'stock'}
                              direction={orderBy[3] === 'stock' ? orderDirection[3] : 'asc'}
                              onClick={() => handleSort(3, 'stock')}
                            >
                              Stock
                            </TableSortLabel>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {productosMargenOrdenado.map((item, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>{item.codigo}</TableCell>
                            <TableCell>{item.nombre}</TableCell>
                            <TableCell align="right">
                              {formatearPesosChilenos(item.costo)}
                            </TableCell>
                            <TableCell align="right">
                              {formatearPesosChilenos(item.precio_venta)}
                            </TableCell>
                            <TableCell align="right">
                              {formatearPesosChilenos(item.ganancia_unitaria)}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${(item.margen_porcentaje || 0).toFixed(2)}%`}
                                color={
                                  (item.margen_porcentaje || 0) > 50 
                                    ? 'success' 
                                    : (item.margen_porcentaje || 0) > 30 
                                    ? 'warning' 
                                    : (item.margen_porcentaje || 0) > 0
                                    ? 'default'
                                    : 'error'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">{item.stock_actual}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info">No hay datos disponibles</Alert>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Rotación Inventario */}
      <TabPanel value={tab} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          </Grid>
          <Grid item xs={12}>
            {loadingRotacion ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : errorRotacion ? (
              <Alert severity="error">
                Error al cargar el reporte: {errorRotacion.message || 'Error desconocido'}
              </Alert>
            ) : reporteRotacion?.data?.productos?.length > 0 ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Rotación de Inventario (últimos 30 días)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total de productos: {productosRotacionOrdenado.length}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy[4] === 'codigo'}
                              direction={orderBy[4] === 'codigo' ? orderDirection[4] : 'asc'}
                              onClick={() => handleSort(4, 'codigo')}
                            >
                              Código
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy[4] === 'nombre'}
                              direction={orderBy[4] === 'nombre' ? orderDirection[4] : 'asc'}
                              onClick={() => handleSort(4, 'nombre')}
                            >
                              Producto
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[4] === 'stock'}
                              direction={orderBy[4] === 'stock' ? orderDirection[4] : 'asc'}
                              onClick={() => handleSort(4, 'stock')}
                            >
                              Stock Actual
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[4] === 'vendido'}
                              direction={orderBy[4] === 'vendido' ? orderDirection[4] : 'asc'}
                              onClick={() => handleSort(4, 'vendido')}
                            >
                              Vendido 30 días
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy[4] === 'rotacion'}
                              direction={orderBy[4] === 'rotacion' ? orderDirection[4] : 'asc'}
                              onClick={() => handleSort(4, 'rotacion')}
                            >
                              Rotación
                            </TableSortLabel>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {productosRotacionOrdenado.map((item, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>{item.codigo}</TableCell>
                            <TableCell>{item.nombre}</TableCell>
                            <TableCell align="right">{item.stock_actual}</TableCell>
                            <TableCell align="right">{item.cantidad_vendida_30dias}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={(item.rotacion || 0).toFixed(2)}
                                color={
                                  (item.rotacion || 0) > 1 
                                    ? 'success' 
                                    : (item.rotacion || 0) > 0.5 
                                    ? 'warning' 
                                    : (item.rotacion || 0) > 0
                                    ? 'default'
                                    : 'error'
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info">No hay datos disponibles</Alert>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Reportes;
