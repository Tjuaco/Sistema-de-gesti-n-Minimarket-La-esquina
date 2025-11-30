import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Chip,
  InputAdornment,
  Tooltip,
  Snackbar,
  Card,
  CardContent,
  Divider,
  Collapse,
  TableSortLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import {
  FileDownload as FileDownloadIcon,
  AttachMoney as AttachMoneyIcon,
  PointOfSale as PointOfSaleIcon,
} from '@mui/icons-material';
import { ventasService } from '../services/ventas';
import { productosService } from '../services/productos';
import { formatearPesosChilenos } from '../utils/formato';
import { debounce } from '../utils/debounce';

function Ventas() {
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState(null);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [orderBy, setOrderBy] = useState('fecha');
  const [orderDirection, setOrderDirection] = useState('desc');
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    numero_boleta: '',
    fecha: '',
    observaciones: '',
  });
  const [currentItem, setCurrentItem] = useState({
    producto: '',
    cantidad: '',
    precio_unitario: '',
  });
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const queryClient = useQueryClient();

  const { data: ventas, isLoading } = useQuery('ventas', () =>
    ventasService.getAll(),
    {
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    }
  );

  const { data: productos } = useQuery(
    ['productos', 'activos'],
    () => productosService.getAll({ activo: true }),
    {
      staleTime: 2 * 60 * 1000, // 2 minutos - productos activos se actualizan más frecuentemente
      cacheTime: 5 * 60 * 1000, // 5 minutos en caché
      refetchInterval: 30 * 1000, // Refrescar cada 30 segundos para tener stock actualizado
    }
  );

  const createMutation = useMutation(
    (data) => ventasService.create(data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('ventas');
        queryClient.invalidateQueries('productos');
        setSnackbar({
          open: true,
          message: 'Venta registrada exitosamente',
          severity: 'success',
        });
        handleClose();
      },
      onError: (err) => {
        let errorMessage = 'Error al registrar la venta';
        
        try {
          if (typeof err === 'string') {
            errorMessage = err;
          } else if (err?.message) {
            errorMessage = err.message;
          } else if (err?.response?.data?.error) {
            errorMessage = err.response.data.error;
          } else if (err?.response?.data?.detail) {
            errorMessage = err.response.data.detail;
          } else if (err?.response?.data) {
            const data = err.response.data;
            if (typeof data === 'string') {
              errorMessage = data;
            } else if (data.non_field_errors) {
              errorMessage = Array.isArray(data.non_field_errors) 
                ? data.non_field_errors.join(', ') 
                : String(data.non_field_errors);
            } else {
              const errors = Object.values(data).flat();
              errorMessage = errors.map(e => typeof e === 'string' ? e : JSON.stringify(e)).join(', ');
            }
          }
        } catch (e) {
          errorMessage = 'Error al procesar el mensaje de error';
        }
        
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => ventasService.update(id, data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('ventas');
        queryClient.invalidateQueries('productos');
        setSnackbar({
          open: true,
          message: 'Venta actualizada exitosamente',
          severity: 'success',
        });
        handleClose();
      },
      onError: (err) => {
        let errorMessage = 'Error al actualizar la venta';
        
        try {
          if (typeof err === 'string') {
            errorMessage = err;
          } else if (err?.message) {
            errorMessage = err.message;
          } else if (err?.response?.data?.error) {
            errorMessage = err.response.data.error;
          } else if (err?.response?.data?.detail) {
            errorMessage = err.response.data.detail;
          } else if (err?.response?.data) {
            const data = err.response.data;
            if (typeof data === 'string') {
              errorMessage = data;
            } else if (data.non_field_errors) {
              errorMessage = Array.isArray(data.non_field_errors) 
                ? data.non_field_errors.join(', ') 
                : String(data.non_field_errors);
            } else {
              const errors = Object.values(data).flat();
              errorMessage = errors.map(e => typeof e === 'string' ? e : JSON.stringify(e)).join(', ');
            }
          }
        } catch (e) {
          errorMessage = 'Error al procesar el mensaje de error';
        }
        
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => ventasService.delete(id),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('ventas');
        queryClient.invalidateQueries('productos');
        const data = response?.data || {};
        setSnackbar({
          open: true,
          message: data.mensaje || 'Venta eliminada exitosamente',
          severity: 'success',
        });
        setDeletingId(null);
      },
      onError: (err) => {
        let errorMessage = 'Error al eliminar la venta';
        
        try {
          if (typeof err === 'string') {
            errorMessage = err;
          } else if (err?.message) {
            errorMessage = err.message;
          } else if (err?.response?.data?.error) {
            errorMessage = err.response.data.error;
          } else if (err?.response?.data?.detail) {
            errorMessage = err.response.data.detail;
          } else if (err?.response?.data) {
            const data = err.response.data;
            if (typeof data === 'string') {
              errorMessage = data;
            } else if (data.non_field_errors) {
              errorMessage = Array.isArray(data.non_field_errors) 
                ? data.non_field_errors.join(', ') 
                : String(data.non_field_errors);
            } else {
              const errors = Object.values(data).flat();
              errorMessage = errors.map(e => typeof e === 'string' ? e : JSON.stringify(e)).join(', ');
            }
          }
        } catch (e) {
          errorMessage = 'Error al procesar el mensaje de error';
        }
        
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
        setDeletingId(null);
      },
    }
  );

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setEditingVenta(null);
    setItems([]);
    // Establecer fecha actual por defecto
    const now = new Date();
    const fechaLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormData({
      numero_boleta: '',
      fecha: fechaLocal,
      observaciones: '',
    });
    setCurrentItem({
      producto: '',
      cantidad: '',
      precio_unitario: '',
    });
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setEditingVenta(null);
    setItems([]);
    setFormData({
      numero_boleta: '',
      fecha: '',
      observaciones: '',
    });
    setCurrentItem({
      producto: '',
      cantidad: '',
      precio_unitario: '',
    });
  };

  const handleEdit = (venta) => {
    setEditingVenta(venta);
    
    // Formatear fecha para el input datetime-local
    let fechaFormateada = '';
    if (venta.fecha) {
      const fecha = new Date(venta.fecha);
      fechaFormateada = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    }
    
    setFormData({
      numero_boleta: venta.numero_boleta || '',
      fecha: fechaFormateada,
      observaciones: venta.observaciones || '',
    });
    
    // Convertir items de la venta al formato del formulario
    const ventaItems = venta.items?.map(item => ({
      producto: item.producto,
      cantidad: item.cantidad,
      precio_unitario: Math.round(parseFloat(item.precio_unitario)),
    })) || [];
    
    setItems(ventaItems);
    setOpen(true);
    setError(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta venta? Se revertirán los cambios de stock.')) {
      setDeletingId(id);
      deleteMutation.mutate(id);
    }
  };

  const handleAddItem = () => {
    if (!currentItem.producto || !currentItem.cantidad) {
      setError('Producto y cantidad son requeridos');
      return;
    }

    const producto = productos?.data?.results?.find(
      (p) => p.id === parseInt(currentItem.producto)
    );

    if (!producto) {
      setError('Producto no encontrado');
      return;
    }

    const cantidad = parseInt(currentItem.cantidad);
    if (cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    // Verificar stock disponible (considerando items ya agregados)
    const cantidadYaAgregada = items
      .filter(item => item.producto === parseInt(currentItem.producto))
      .reduce((sum, item) => sum + item.cantidad, 0);
    
    const stockDisponible = producto.stock_actual;
    if (editingVenta) {
      // Al editar, considerar el stock que ya estaba en la venta original
      const itemOriginal = editingVenta.items?.find(
        item => item.producto === parseInt(currentItem.producto)
      );
      if (itemOriginal) {
        stockDisponible += itemOriginal.cantidad;
      }
    }

    if (cantidad + cantidadYaAgregada > stockDisponible) {
      setError(
        `Stock insuficiente. Disponible: ${stockDisponible}, Ya agregado: ${cantidadYaAgregada}, Solicitado: ${cantidad}`
      );
      return;
    }

    const precioUnitario = currentItem.precio_unitario 
      ? Math.round(parseFloat(currentItem.precio_unitario))
      : Math.round(parseFloat(producto.precio_venta));

    if (precioUnitario < producto.costo) {
      setError(
        `El precio de venta no puede ser menor al costo (${formatearPesosChilenos(producto.costo)})`
      );
      return;
    }

    setItems([...items, {
      producto: parseInt(currentItem.producto),
      cantidad: cantidad,
      precio_unitario: precioUnitario,
    }]);

    setCurrentItem({
      producto: '',
      cantidad: '',
      precio_unitario: '',
    });
    setError(null);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }

    const submitData = {
      observaciones: formData.observaciones || null,
      items: items.map((item) => ({
        producto: item.producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      })),
    };

    // Incluir fecha si está presente
    if (formData.fecha) {
      // Convertir fecha local a ISO 8601 para el backend
      submitData.fecha = new Date(formData.fecha).toISOString();
    }

    // Solo incluir numero_boleta si se está editando y tiene un valor
    if (editingVenta && formData.numero_boleta && formData.numero_boleta.trim() !== '') {
      submitData.numero_boleta = formData.numero_boleta.trim();
    }

    if (editingVenta) {
      updateMutation.mutate({ id: editingVenta.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleToggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleViewDetails = (venta) => {
    setSelectedVenta(venta);
    setDetailOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailOpen(false);
    setSelectedVenta(null);
  };

  // Estado para búsqueda con debounce
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce de búsqueda
  const debouncedSetSearch = useCallback(
    debounce((value) => {
      setDebouncedSearchTerm(value);
    }, 300),
    []
  );

  // Actualizar búsqueda con debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSetSearch(value);
  };

  // Filtrar y ordenar ventas con useMemo para optimización
  const ventasList = ventas?.data?.results || [];
  const filteredVentas = useMemo(() => {
    let filtered = ventasList.filter((venta) => {
      const matchesSearch =
        venta.numero_boleta?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        venta.id?.toString().includes(debouncedSearchTerm) ||
        venta.items?.some(item => 
          item.producto_nombre?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          item.producto_codigo?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );

      // Filtro por fecha
      const ventaFecha = venta.fecha ? new Date(venta.fecha) : null;
      const matchesFechaDesde = !filterFechaDesde || !ventaFecha || 
        ventaFecha >= new Date(filterFechaDesde + 'T00:00:00');
      const matchesFechaHasta = !filterFechaHasta || !ventaFecha || 
        ventaFecha <= new Date(filterFechaHasta + 'T23:59:59');

      return matchesSearch && matchesFechaDesde && matchesFechaHasta;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (orderBy) {
        case 'id':
          aValue = a.id || 0;
          bValue = b.id || 0;
          break;
        case 'fecha':
          aValue = a.fecha ? new Date(a.fecha).getTime() : 0;
          bValue = b.fecha ? new Date(b.fecha).getTime() : 0;
          break;
        case 'total':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'numero_boleta':
          aValue = a.numero_boleta || '';
          bValue = b.numero_boleta || '';
          break;
        case 'items':
          aValue = a.items?.length || 0;
          bValue = b.items?.length || 0;
          break;
        default:
          aValue = a.fecha ? new Date(a.fecha).getTime() : 0;
          bValue = b.fecha ? new Date(b.fecha).getTime() : 0;
      }

      if (typeof aValue === 'string') {
        return orderDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return orderDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [ventasList, debouncedSearchTerm, filterFechaDesde, filterFechaHasta, orderBy, orderDirection]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = filteredVentas.length;
    const montoTotal = filteredVentas.reduce((sum, v) => sum + (v.total || 0), 0);
    const totalItems = filteredVentas.reduce((sum, v) => sum + (v.items?.length || 0), 0);
    const promedioVenta = total > 0 ? montoTotal / total : 0;
    
    return { total, montoTotal, totalItems, promedioVenta };
  }, [filteredVentas]);

  const handleSort = (column) => {
    if (orderBy === column) {
      setOrderDirection(orderDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(column);
      setOrderDirection('asc');
    }
  };

  const handleExportarCSV = async () => {
    try {
      const params = {};
      
      // Aplicar filtros si existen
      if (filterFechaDesde) {
        params.fecha_desde = filterFechaDesde;
      }
      if (filterFechaHasta) {
        params.fecha_hasta = filterFechaHasta;
      }
      
      const response = await ventasService.exportarCSV(params);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbar({
        open: true,
        message: 'Ventas exportadas exitosamente',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al exportar ventas',
        severity: 'error',
      });
    }
  };

  const calcularTotal = () => {
    return items.reduce((total, item) => {
      return total + (item.cantidad * item.precio_unitario);
    }, 0);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4">Ventas</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Nueva Venta
        </Button>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PointOfSaleIcon color="primary" />
                <Typography variant="caption" color="text.secondary">Total Ventas</Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold">{estadisticas.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AttachMoneyIcon color="success" />
                <Typography variant="caption" color="text.secondary">Monto Total</Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {formatearPesosChilenos(estadisticas.montoTotal)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Total Items</Typography>
              <Typography variant="h6" fontWeight="bold">{estadisticas.totalItems}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Promedio por Venta</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {formatearPesosChilenos(estadisticas.promedioVenta)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros y búsqueda */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar por número de boleta, ID, producto..."
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Fecha Desde"
              type="date"
              value={filterFechaDesde}
              onChange={(e) => setFilterFechaDesde(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Fecha Hasta"
              type="date"
              value={filterFechaHasta}
              onChange={(e) => setFilterFechaHasta(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportarCSV}
              >
                Exportar CSV
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {filteredVentas.length} de {ventasList.length} ventas
          </Typography>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="50px"></TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'id'}
                  direction={orderBy === 'id' ? orderDirection : 'desc'}
                  onClick={() => handleSort('id')}
                >
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'numero_boleta'}
                  direction={orderBy === 'numero_boleta' ? orderDirection : 'asc'}
                  onClick={() => handleSort('numero_boleta')}
                >
                  Número Boleta
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'fecha'}
                  direction={orderBy === 'fecha' ? orderDirection : 'desc'}
                  onClick={() => handleSort('fecha')}
                >
                  Fecha
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'items'}
                  direction={orderBy === 'items' ? orderDirection : 'desc'}
                  onClick={() => handleSort('items')}
                >
                  Productos
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'total'}
                  direction={orderBy === 'total' ? orderDirection : 'desc'}
                  onClick={() => handleSort('total')}
                >
                  Total
                </TableSortLabel>
              </TableCell>
              <TableCell>Registrado por</TableCell>
              <TableCell align="center" width="180px">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVentas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchTerm ? 'No se encontraron ventas' : 'No hay ventas registradas'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredVentas.map((venta) => {
                const isExpanded = expandedRows[venta.id];
                const itemsCount = venta.items?.length || 0;
                
                return (
                  <React.Fragment key={venta.id}>
                    <TableRow hover>
                      <TableCell>
                        {itemsCount > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => handleToggleRow(venta.id)}
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell>{venta.id}</TableCell>
                      <TableCell>
                        <Chip 
                          label={venta.numero_boleta || 'Sin número'} 
                          size="small"
                          color={venta.numero_boleta ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(venta.fecha).toLocaleString('es-CL')}
                      </TableCell>
                      <TableCell>
                        {itemsCount > 0 ? (
                          <Box>
                            <Typography variant="body2">
                              {venta.items[0].producto_codigo} - {venta.items[0].producto_nombre}
                            </Typography>
                            {itemsCount > 1 && (
                              <Typography variant="caption" color="text.secondary">
                                +{itemsCount - 1} producto{itemsCount - 1 > 1 ? 's' : ''} más
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold">
                          {formatearPesosChilenos(venta.total)}
                        </Typography>
                      </TableCell>
                      <TableCell>{venta.usuario || '-'}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(venta)}
                            color="info"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(venta)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(venta.id)}
                            color="error"
                            disabled={deletingId === venta.id}
                          >
                            {deletingId === venta.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    {isExpanded && itemsCount > 1 && (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ py: 2, backgroundColor: 'grey.50' }}>
                          <Box sx={{ pl: 4 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Productos de la venta:
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Producto</TableCell>
                                  <TableCell align="right">Cantidad</TableCell>
                                  <TableCell align="right">Precio Unitario</TableCell>
                                  <TableCell align="right">Subtotal</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {venta.items.map((item, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>
                                      {item.producto_codigo} - {item.producto_nombre}
                                    </TableCell>
                                    <TableCell align="right">{item.cantidad}</TableCell>
                                    <TableCell align="right">
                                      {formatearPesosChilenos(item.precio_unitario)}
                                    </TableCell>
                                    <TableCell align="right">
                                      {formatearPesosChilenos(item.subtotal)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar venta */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingVenta ? `Editar Venta #${editingVenta.id}` : 'Nueva Venta'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Número de Boleta"
                  value={editingVenta ? formData.numero_boleta : 'Se generará automáticamente'}
                  onChange={(e) =>
                    setFormData({ ...formData, numero_boleta: e.target.value })
                  }
                  disabled={!editingVenta}
                  helperText={editingVenta ? 'Puede modificar el número de boleta' : 'El número de boleta se generará automáticamente al guardar'}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Fecha de Venta"
                  type="datetime-local"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  helperText="Fecha y hora de la venta"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>Agregar Productos</Divider>
              </Grid>

              <Grid item xs={12} sm={5}>
                <FormControl fullWidth>
                  <InputLabel>Producto</InputLabel>
                  <Select
                    value={currentItem.producto}
                    label="Producto"
                    onChange={(e) => {
                      const productoId = e.target.value;
                      const producto = productos?.data?.results?.find(p => p.id === parseInt(productoId));
                      setCurrentItem({
                        ...currentItem,
                        producto: productoId,
                        precio_unitario: producto ? Math.round(producto.precio_venta).toString() : '',
                      });
                    }}
                  >
                    <MenuItem value="">Seleccionar producto</MenuItem>
                    {productos?.data?.results
                      ?.filter(prod => {
                        if (editingVenta) {
                          // Al editar, mostrar todos los productos activos
                          return prod.activo;
                        }
                        // Al crear, solo mostrar productos con stock
                        return prod.activo && prod.stock_actual > 0;
                      })
                      ?.map((prod) => {
                        const cantidadYaAgregada = items
                          .filter(item => item.producto === prod.id)
                          .reduce((sum, item) => sum + item.cantidad, 0);
                        
                        let stockDisponible = prod.stock_actual;
                        if (editingVenta) {
                          const itemOriginal = editingVenta.items?.find(
                            item => item.producto === prod.id
                          );
                          if (itemOriginal) {
                            stockDisponible += itemOriginal.cantidad;
                          }
                        }
                        
                        const stockRestante = stockDisponible - cantidadYaAgregada;
                        
                        return (
                          <MenuItem key={prod.id} value={prod.id}>
                            {prod.codigo} - {prod.nombre} (Stock: {stockRestante})
                          </MenuItem>
                        );
                      })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Cantidad"
                  type="number"
                  value={currentItem.cantidad}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, cantidad: e.target.value })
                  }
                  inputProps={{ min: '1' }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                {(() => {
                  const producto = productos?.data?.results?.find(
                    p => p.id === parseInt(currentItem.producto)
                  );
                  const precioUnitario = currentItem.precio_unitario 
                    ? Math.round(parseFloat(currentItem.precio_unitario))
                    : producto ? Math.round(parseFloat(producto.precio_venta)) : 0;
                  const precioValido = producto && precioUnitario >= producto.costo;
                  const cantidad = parseInt(currentItem.cantidad) || 0;
                  
                  // Calcular stock disponible
                  let stockDisponible = producto ? producto.stock_actual : 0;
                  if (editingVenta && producto) {
                    const itemOriginal = editingVenta.items?.find(
                      item => item.producto === producto.id
                    );
                    if (itemOriginal) {
                      stockDisponible += itemOriginal.cantidad;
                    }
                  }
                  const cantidadYaAgregada = items
                    .filter(item => item.producto === parseInt(currentItem.producto))
                    .reduce((sum, item) => sum + item.cantidad, 0);
                  const stockRestante = stockDisponible - cantidadYaAgregada;
                  const stockSuficiente = cantidad > 0 && cantidad <= stockRestante;
                  
                  return (
                    <TextField
                      fullWidth
                      label="Precio Unitario"
                      type="number"
                      value={currentItem.precio_unitario}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, precio_unitario: e.target.value })
                      }
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      error={producto && precioUnitario > 0 && !precioValido}
                      helperText={
                        producto && precioUnitario > 0 && !precioValido
                          ? `Mínimo: ${formatearPesosChilenos(producto.costo)}`
                          : producto && precioUnitario > 0
                          ? `Costo: ${formatearPesosChilenos(producto.costo)}`
                          : ''
                      }
                    />
                  );
                })()}
              </Grid>
              <Grid item xs={12} sm={1}>
                {(() => {
                  const producto = productos?.data?.results?.find(
                    p => p.id === parseInt(currentItem.producto)
                  );
                  const precioUnitario = currentItem.precio_unitario 
                    ? Math.round(parseFloat(currentItem.precio_unitario))
                    : producto ? Math.round(parseFloat(producto.precio_venta)) : 0;
                  const precioValido = producto && precioUnitario >= producto.costo;
                  const cantidad = parseInt(currentItem.cantidad) || 0;
                  
                  // Calcular stock disponible
                  let stockDisponible = producto ? producto.stock_actual : 0;
                  if (editingVenta && producto) {
                    const itemOriginal = editingVenta.items?.find(
                      item => item.producto === producto.id
                    );
                    if (itemOriginal) {
                      stockDisponible += itemOriginal.cantidad;
                    }
                  }
                  const cantidadYaAgregada = items
                    .filter(item => item.producto === parseInt(currentItem.producto))
                    .reduce((sum, item) => sum + item.cantidad, 0);
                  const stockRestante = stockDisponible - cantidadYaAgregada;
                  const stockSuficiente = cantidad > 0 && cantidad <= stockRestante;
                  
                  const puedeAgregar = currentItem.producto && 
                    currentItem.cantidad && 
                    cantidad > 0 &&
                    producto &&
                    precioValido &&
                    stockSuficiente;
                  
                  return (
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleAddItem}
                      disabled={!puedeAgregar}
                      sx={{ height: '56px' }}
                      title={
                        !currentItem.producto ? 'Seleccione un producto' :
                        !currentItem.cantidad ? 'Ingrese una cantidad' :
                        !precioValido ? 'El precio no puede ser menor al costo' :
                        !stockSuficiente ? 'Stock insuficiente' :
                        'Agregar producto'
                      }
                    >
                      <AddIcon />
                    </Button>
                  );
                })()}
              </Grid>

              {items.length > 0 && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Productos agregados:
                      </Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Producto</TableCell>
                            <TableCell align="right">Cantidad</TableCell>
                            <TableCell align="right">Precio Unitario</TableCell>
                            <TableCell align="right">Subtotal</TableCell>
                            <TableCell width="50px"></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {items.map((item, index) => {
                            const producto = productos?.data?.results?.find(
                              p => p.id === item.producto
                            );
                            return (
                              <TableRow key={index}>
                                <TableCell>
                                  {producto ? `${producto.codigo} - ${producto.nombre}` : 'N/A'}
                                </TableCell>
                                <TableCell align="right">
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={item.cantidad}
                                    onChange={(e) => {
                                      const nuevaCantidad = parseInt(e.target.value) || 1;
                                      const nuevosItems = [...items];
                                      nuevosItems[index] = { ...item, cantidad: nuevaCantidad };
                                      setItems(nuevosItems);
                                    }}
                                    inputProps={{ min: 1 }}
                                    sx={{ width: '80px' }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={item.precio_unitario}
                                    onChange={(e) => {
                                      const nuevoPrecio = Math.round(parseFloat(e.target.value) || 0);
                                      const nuevosItems = [...items];
                                      nuevosItems[index] = { ...item, precio_unitario: nuevoPrecio };
                                      setItems(nuevosItems);
                                    }}
                                    InputProps={{
                                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={{ width: '120px' }}
                                    error={producto && item.precio_unitario > 0 && item.precio_unitario < producto.costo}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {formatearPesosChilenos(item.cantidad * item.precio_unitario)}
                                </TableCell>
                                <TableCell>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveItem(index)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      <Box sx={{ mt: 2, textAlign: 'right' }}>
                        <Typography variant="h6">
                          Total: {formatearPesosChilenos(calcularTotal())}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={items.length === 0 || createMutation.isLoading || updateMutation.isLoading}
            >
              {createMutation.isLoading || updateMutation.isLoading ? (
                <CircularProgress size={24} />
              ) : editingVenta ? (
                'Actualizar Venta'
              ) : (
                'Registrar Venta'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog para ver detalles */}
      <Dialog
        open={detailOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalles de la Venta #{selectedVenta?.id}
        </DialogTitle>
        <DialogContent>
          {selectedVenta && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Número de Boleta
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {selectedVenta.numero_boleta || 'Sin número'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Fecha
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedVenta.fecha).toLocaleString('es-CL')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Registrado por
                </Typography>
                <Typography variant="body1">
                  {selectedVenta.usuario || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatearPesosChilenos(selectedVenta.total)}
                </Typography>
              </Grid>
              {selectedVenta.observaciones && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography variant="body1">
                    {selectedVenta.observaciones}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Productos
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Precio Unitario</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedVenta.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {item.producto_codigo} - {item.producto_nombre}
                        </TableCell>
                        <TableCell align="right">{item.cantidad}</TableCell>
                        <TableCell align="right">
                          {formatearPesosChilenos(item.precio_unitario)}
                        </TableCell>
                        <TableCell align="right">
                          {formatearPesosChilenos(item.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Ventas;
