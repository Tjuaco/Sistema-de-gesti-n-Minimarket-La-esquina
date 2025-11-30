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
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Avatar,
  Chip,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  CardMedia,
  Tooltip,
  Snackbar,
  LinearProgress,
  TableSortLabel,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ImageIcon from '@mui/icons-material/Image';
import HistoryIcon from '@mui/icons-material/History';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import { productosService } from '../services/productos';
import { proveedoresService } from '../services/proveedores';
import { categoriasService } from '../services/categorias';
import { movimientosService } from '../services/movimientos';
import { formatearPesosChilenos } from '../utils/formato';
import { debounce } from '../utils/debounce';

function Productos() {
  const [open, setOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivo, setFilterActivo] = useState('all');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterProveedor, setFilterProveedor] = useState('');
  const [filterStockBajo, setFilterStockBajo] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' o 'grid'
  const [orderBy, setOrderBy] = useState('nombre');
  const [orderDirection, setOrderDirection] = useState('asc');
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    proveedor: '',
    costo: '',
    precio_venta: '',
    stock_actual: '',
    stock_minimo: '',
    codigo_barras: '',
    unidad_medida: 'UN',
    activo: true,
    imagen: null,
  });
  const [imagenPreview, setImagenPreview] = useState(null);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deletingId, setDeletingId] = useState(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [productoHistorial, setProductoHistorial] = useState(null);
  const [filtrosHistorial, setFiltrosHistorial] = useState({
    tipo: '',
    fecha_desde: '',
    fecha_hasta: '',
    usuario: '',
  });
  const [ajusteStockOpen, setAjusteStockOpen] = useState(false);
  const [productoAjuste, setProductoAjuste] = useState(null);
  const [ajusteStockData, setAjusteStockData] = useState({
    cantidad: '',
    motivo: '',
  });
  const [categoriaDialogOpen, setCategoriaDialogOpen] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', descripcion: '' });
  const [adminCategoriasOpen, setAdminCategoriasOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [deletingCategoriaId, setDeletingCategoriaId] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('productos', () =>
    productosService.getAll(),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );

  const { data: proveedores } = useQuery('proveedores', () =>
    proveedoresService.getAll(),
    {
      staleTime: 10 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
    }
  );

  const { data: categorias, isLoading: isLoadingCategorias } = useQuery('categorias', () =>
    categoriasService.getAll(),
    {
      staleTime: 10 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
    }
  );

  const createMutation = useMutation(
    (data) => productosService.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('productos');
        handleClose();
      },
      onError: (err) => setError(err.message || 'Error al crear el producto'),
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => productosService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('productos');
        handleClose();
      },
      onError: (err) => setError(err.message || 'Error al actualizar el producto'),
    }
  );

  const createCategoriaMutation = useMutation(
    (data) => categoriasService.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categorias');
        setSnackbar({
          open: true,
          message: 'Categoría creada exitosamente',
          severity: 'success',
        });
        setCategoriaDialogOpen(false);
        setNuevaCategoria({ nombre: '', descripcion: '' });
      },
      onError: (err) => {
        const errorMessage = err.response?.data?.nombre?.[0] || err.message || 'Error al crear la categoría';
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      },
    }
  );

  const updateCategoriaMutation = useMutation(
    ({ id, data }) => categoriasService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categorias');
        setSnackbar({
          open: true,
          message: 'Categoría actualizada exitosamente',
          severity: 'success',
        });
        setEditingCategoria(null);
        setNuevaCategoria({ nombre: '', descripcion: '' });
        setCategoriaDialogOpen(false);
      },
      onError: (err) => {
        const errorMessage = err.response?.data?.nombre?.[0] || err.message || 'Error al actualizar la categoría';
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      },
    }
  );

  const deleteCategoriaMutation = useMutation(
    (id) => categoriasService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categorias');
        setSnackbar({
          open: true,
          message: 'Categoría eliminada exitosamente',
          severity: 'success',
        });
        setDeletingCategoriaId(null);
      },
      onError: (err) => {
        const errorMessage = err.response?.data?.detail || err.message || 'Error al eliminar la categoría';
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
        setDeletingCategoriaId(null);
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => productosService.delete(id),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('productos');
        const data = response?.data || {};
        
        // Verificar si el producto fue desactivado o eliminado
        if (data.producto_desactivado) {
          setSnackbar({
            open: true,
            message: data.mensaje || 'El producto ha sido desactivado porque tiene ventas o compras asociadas',
            severity: 'info',
          });
        } else {
          setSnackbar({
            open: true,
            message: data.mensaje || 'Producto eliminado exitosamente',
            severity: 'success',
          });
        }
        setDeletingId(null);
      },
      onError: (err) => {
        let errorMessage = 'Error al eliminar el producto';
        
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

  const ajustarStockMutation = useMutation(
    ({ id, cantidad, motivo }) => productosService.ajustarStock(id, cantidad, motivo),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('productos');
        queryClient.invalidateQueries('productos-bajo-stock');
        queryClient.invalidateQueries('alertas-no-leidas');
        setSnackbar({ 
          open: true, 
          message: `Stock ajustado: ${response.data.stock_anterior} → ${response.data.stock_nuevo}`, 
          severity: 'success' 
        });
        handleCloseAjusteStock();
      },
      onError: (err) => {
        const errorMessage = err.response?.data?.error || err.message || 'Error al ajustar el stock';
        setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      },
    }
  );

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setImagenPreview(null);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProducto(null);
    setImagenPreview(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria: '',
      proveedor: '',
      costo: '',
      precio_venta: '',
      stock_actual: '',
      stock_minimo: '',
      codigo_barras: '',
      unidad_medida: 'UN',
      activo: true,
      imagen: null,
    });
  };

  const handleEdit = (producto) => {
    setEditingProducto(producto);
    setFormData({
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      categoria: producto.categoria || '',
      proveedor: producto.proveedor || '',
      costo: Math.round(producto.costo),
      precio_venta: Math.round(producto.precio_venta),
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo,
      codigo_barras: producto.codigo_barras || '',
      unidad_medida: producto.unidad_medida || 'UN',
      activo: producto.activo !== undefined ? producto.activo : true,
      imagen: null,
    });
    setImagenPreview(producto.imagen_url || null);
    handleOpen();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, imagen: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const costo = Math.round(parseFloat(formData.costo));
    const precio_venta = Math.round(parseFloat(formData.precio_venta));

    // Validar que precio de venta no sea menor al costo
    if (precio_venta < costo) {
      setError(`El precio de venta ($${precio_venta}) no puede ser menor al costo ($${costo}).`);
      return;
    }

    const submitData = {
      nombre: formData.nombre,
      costo: costo,
      precio_venta: precio_venta,
      stock_actual: parseInt(formData.stock_actual),
      stock_minimo: parseInt(formData.stock_minimo),
      unidad_medida: formData.unidad_medida,
      activo: formData.activo,
    };

    // Solo incluir código si se está editando (el código ya existe)
    if (editingProducto && formData.codigo) {
      submitData.codigo = formData.codigo;
    }

    // Agregar campos opcionales solo si tienen valor
    if (formData.descripcion) {
      submitData.descripcion = formData.descripcion;
    }
    if (formData.categoria) {
      submitData.categoria = formData.categoria;
    }
    if (formData.proveedor) {
      submitData.proveedor = formData.proveedor;
    }
    if (formData.codigo_barras) {
      submitData.codigo_barras = formData.codigo_barras;
    }
    if (formData.imagen instanceof File) {
      submitData.imagen = formData.imagen;
    }

    if (editingProducto) {
      updateMutation.mutate({ id: editingProducto.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (producto) => {
    if (window.confirm(`¿Está seguro de eliminar el producto "${producto.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      setDeletingId(producto.id);
      deleteMutation.mutate(producto.id);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenAjusteStock = (producto) => {
    setProductoAjuste(producto);
    setAjusteStockData({ cantidad: '', motivo: '' });
    setAjusteStockOpen(true);
  };

  const handleCloseAjusteStock = () => {
    setAjusteStockOpen(false);
    setProductoAjuste(null);
    setAjusteStockData({ cantidad: '', motivo: '' });
  };

  const handleAjustarStock = (e) => {
    e.preventDefault();
    
    if (!ajusteStockData.cantidad || ajusteStockData.cantidad === '0') {
      setSnackbar({ 
        open: true, 
        message: 'La cantidad debe ser diferente de cero', 
        severity: 'error' 
      });
      return;
    }

    const cantidad = parseInt(ajusteStockData.cantidad);
    const stockNuevo = productoAjuste.stock_actual + cantidad;

    if (stockNuevo < 0) {
      setSnackbar({ 
        open: true, 
        message: `No se permite stock negativo. Stock actual: ${productoAjuste.stock_actual}, Ajuste: ${cantidad}`, 
        severity: 'error' 
      });
      return;
    }

    ajustarStockMutation.mutate({
      id: productoAjuste.id,
      cantidad: cantidad,
      motivo: ajusteStockData.motivo || 'Ajuste manual',
    });
  };

  const handleCloseHistorial = () => {
    setHistorialOpen(false);
    setProductoHistorial(null);
    setFiltrosHistorial({
      tipo: '',
      fecha_desde: '',
      fecha_hasta: '',
      usuario: '',
    });
  };

  const handleExportarHistorial = async () => {
    try {
      const params = {
        producto: productoHistorial.id,
        ...filtrosHistorial,
      };
      // Limpiar parámetros vacíos
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });
      
      const response = await movimientosService.exportarCSV(params);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `historial_${productoHistorial.codigo}_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbar({
        open: true,
        message: 'Historial exportado exitosamente',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al exportar historial',
        severity: 'error',
      });
    }
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

  // Filtrar y ordenar productos con useMemo para optimización
  const productos = data?.data?.results || [];
  const filteredProductos = useMemo(() => {
    let filtered = productos.filter((producto) => {
      const matchesSearch =
        producto.codigo?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        producto.nombre?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        producto.codigo_barras?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesFilterActivo =
        filterActivo === 'all' ||
        (filterActivo === 'activo' && producto.activo) ||
        (filterActivo === 'inactivo' && !producto.activo);

      const matchesCategoria = !filterCategoria || 
        (producto.categoria && (typeof producto.categoria === 'object' ? producto.categoria.id : producto.categoria) == filterCategoria);

      const matchesProveedor = !filterProveedor || 
        (producto.proveedor && (typeof producto.proveedor === 'object' ? producto.proveedor.id : producto.proveedor) == filterProveedor);

      const matchesStockBajo = !filterStockBajo || producto.stock_actual <= producto.stock_minimo;

      return matchesSearch && matchesFilterActivo && matchesCategoria && matchesProveedor && matchesStockBajo;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (orderBy) {
        case 'codigo':
          aValue = a.codigo || '';
          bValue = b.codigo || '';
          break;
        case 'nombre':
          aValue = a.nombre || '';
          bValue = b.nombre || '';
          break;
        case 'stock':
          aValue = a.stock_actual || 0;
          bValue = b.stock_actual || 0;
          break;
        case 'precio':
          aValue = a.precio_venta || 0;
          bValue = b.precio_venta || 0;
          break;
        case 'costo':
          aValue = a.costo || 0;
          bValue = b.costo || 0;
          break;
        case 'margen':
          aValue = ((a.precio_venta || 0) - (a.costo || 0)) / (a.costo || 1) * 100;
          bValue = ((b.precio_venta || 0) - (b.costo || 0)) / (b.costo || 1) * 100;
          break;
        default:
          aValue = a.nombre || '';
          bValue = b.nombre || '';
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
  }, [productos, debouncedSearchTerm, filterActivo, filterCategoria, filterProveedor, filterStockBajo, orderBy, orderDirection]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = filteredProductos.length;
    const activos = filteredProductos.filter(p => p.activo).length;
    const inactivos = total - activos;
    const stockBajo = filteredProductos.filter(p => p.stock_actual <= p.stock_minimo).length;
    const stockCritico = filteredProductos.filter(p => p.stock_actual <= p.stock_minimo * 0.5).length;
    const valorInventario = filteredProductos.reduce((sum, p) => sum + (p.stock_actual * (p.costo || 0)), 0);
    
    return { total, activos, inactivos, stockBajo, stockCritico, valorInventario };
  }, [filteredProductos]);

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
      if (filterActivo && filterActivo !== 'all') {
        params.activo = filterActivo === 'true';
      }
      if (filterCategoria) {
        params.categoria = filterCategoria;
      }
      if (filterProveedor) {
        params.proveedor = filterProveedor;
      }
      
      const response = await productosService.exportarCSV(params);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `productos_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbar({
        open: true,
        message: 'Productos exportados exitosamente',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al exportar productos',
        severity: 'error',
      });
    }
  };

  const unidadesMedida = ['UN', 'KG', 'LT', 'GR', 'ML', 'M', 'CM'];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Productos</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => setAdminCategoriasOpen(true)}
          >
            Administrar Categorías
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpen}
          >
            Nuevo Producto
          </Button>
        </Box>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Total</Typography>
              <Typography variant="h6" fontWeight="bold">{estadisticas.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Activos</Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">{estadisticas.activos}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Stock Bajo</Typography>
              <Typography variant="h6" fontWeight="bold" color="warning.main">{estadisticas.stockBajo}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Stock Crítico</Typography>
              <Typography variant="h6" fontWeight="bold" color="error.main">{estadisticas.stockCritico}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Valor Inventario</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {formatearPesosChilenos(estadisticas.valorInventario)}
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
              placeholder="Buscar por código, nombre o código de barras..."
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
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filterActivo}
                label="Estado"
                onChange={(e) => setFilterActivo(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="activo">Activos</MenuItem>
                <MenuItem value="inactivo">Inactivos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoría</InputLabel>
              <Select
                value={filterCategoria}
                label="Categoría"
                onChange={(e) => setFilterCategoria(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {categorias?.data?.results?.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Proveedor</InputLabel>
              <Select
                value={filterProveedor}
                label="Proveedor"
                onChange={(e) => setFilterProveedor(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {proveedores?.data?.results?.map((prov) => (
                  <MenuItem key={prov.id} value={prov.id}>
                    {prov.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filterStockBajo}
                    onChange={(e) => setFilterStockBajo(e.target.checked)}
                    size="small"
                  />
                }
                label="Stock Bajo"
              />
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {filteredProductos.length} de {productos.length} productos
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="table">
                <ViewListIcon />
              </ToggleButton>
              <ToggleButton value="grid">
                <ViewModuleIcon />
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportarCSV}
            >
              Exportar CSV
            </Button>
          </Box>
        </Box>
      </Paper>

      {viewMode === 'table' ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Imagen</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'codigo'}
                    direction={orderBy === 'codigo' ? orderDirection : 'asc'}
                    onClick={() => handleSort('codigo')}
                  >
                    Código
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'nombre'}
                    direction={orderBy === 'nombre' ? orderDirection : 'asc'}
                    onClick={() => handleSort('nombre')}
                  >
                    Nombre
                  </TableSortLabel>
                </TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'stock'}
                    direction={orderBy === 'stock' ? orderDirection : 'asc'}
                    onClick={() => handleSort('stock')}
                  >
                    Stock
                  </TableSortLabel>
                </TableCell>
                <TableCell>Stock Mín.</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'precio'}
                    direction={orderBy === 'precio' ? orderDirection : 'asc'}
                    onClick={() => handleSort('precio')}
                  >
                    Precio
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'costo'}
                    direction={orderBy === 'costo' ? orderDirection : 'asc'}
                    onClick={() => handleSort('costo')}
                  >
                    Costo
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'margen'}
                    direction={orderBy === 'margen' ? orderDirection : 'asc'}
                    onClick={() => handleSort('margen')}
                  >
                    Margen
                  </TableSortLabel>
                </TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
          <TableBody>
            {filteredProductos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No se encontraron productos
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredProductos.map((producto) => (
                <TableRow key={producto.id} hover>
                  <TableCell>
                    <Avatar
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      variant="rounded"
                      sx={{ width: 56, height: 56 }}
                    >
                      <ImageIcon />
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {producto.codigo}
                    </Typography>
                    {producto.codigo_barras && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {producto.codigo_barras}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{producto.nombre}</Typography>
                    {producto.descripcion && (
                      <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 200 }}>
                        {producto.descripcion}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {producto.categoria_nombre ? (
                      <Chip label={producto.categoria_nombre} size="small" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            producto.stock_actual <= producto.stock_minimo * 0.5
                              ? 'error.main'
                              : producto.stock_actual <= producto.stock_minimo
                              ? 'warning.main'
                              : 'text.primary',
                          fontWeight:
                            producto.stock_actual <= producto.stock_minimo
                              ? 'bold'
                              : 'normal',
                          mb: 0.5,
                        }}
                      >
                        {producto.stock_actual} {producto.unidad_medida || 'UN'}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((producto.stock_actual / Math.max(producto.stock_minimo * 2, 1)) * 100, 100)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor:
                              producto.stock_actual <= producto.stock_minimo * 0.5
                                ? 'error.main'
                                : producto.stock_actual <= producto.stock_minimo
                                ? 'warning.main'
                                : 'success.main',
                          },
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{producto.stock_minimo} {producto.unidad_medida || 'UN'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatearPesosChilenos(producto.precio_venta)}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatearPesosChilenos(producto.costo)}</TableCell>
                  <TableCell>
                    {producto.costo ? (
                      <Box>
                        <Typography variant="body2" fontWeight="medium" color="success.main">
                          {((producto.precio_venta - producto.costo) / producto.costo * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatearPesosChilenos(producto.precio_venta - producto.costo)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={producto.activo ? 'Activo' : 'Inactivo'}
                      color={producto.activo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Ajustar Stock">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenAjusteStock(producto)}
                          color="warning"
                        >
                          <InventoryIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Historial">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setProductoHistorial(producto);
                            setHistorialOpen(true);
                          }}
                          color="info"
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(producto)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(producto)}
                            color="error"
                            disabled={deletingId === producto.id || deleteMutation.isLoading}
                          >
                            {deletingId === producto.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <DeleteIcon />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      ) : (
        <Grid container spacing={2}>
          {filteredProductos.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No se encontraron productos
                </Typography>
              </Paper>
            </Grid>
          ) : (
            filteredProductos.map((producto) => {
              const margen = producto.costo ? ((producto.precio_venta - producto.costo) / producto.costo * 100) : 0;
              const porcentajeStock = (producto.stock_actual / Math.max(producto.stock_minimo * 2, 1)) * 100;
              const stockBajo = producto.stock_actual <= producto.stock_minimo;
              const stockCritico = producto.stock_actual <= producto.stock_minimo * 0.5;

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={producto.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: stockCritico ? '2px solid' : stockBajo ? '1px solid' : 'none',
                      borderColor: stockCritico ? 'error.main' : stockBajo ? 'warning.main' : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <Box sx={{ position: 'relative', p: 2, pb: 0 }}>
                      <Avatar
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        variant="rounded"
                        sx={{ width: '100%', height: 200, mb: 2 }}
                      >
                        <ImageIcon sx={{ fontSize: 80 }} />
                      </Avatar>
                      {stockCritico && (
                        <Chip
                          label="Stock Crítico"
                          color="error"
                          size="small"
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                        />
                      )}
                      {stockBajo && !stockCritico && (
                        <Chip
                          label="Stock Bajo"
                          color="warning"
                          size="small"
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                        />
                      )}
                    </Box>
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        {producto.codigo}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" gutterBottom noWrap>
                        {producto.nombre}
                      </Typography>
                      {producto.categoria_nombre && (
                        <Chip label={producto.categoria_nombre} size="small" sx={{ mb: 1 }} />
                      )}
                      
                      <Box sx={{ mt: 'auto', pt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Stock:
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={stockCritico ? 'error.main' : stockBajo ? 'warning.main' : 'text.primary'}
                          >
                            {producto.stock_actual} / {producto.stock_minimo} {producto.unidad_medida || 'UN'}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(porcentajeStock, 100)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            mb: 2,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: stockCritico ? 'error.main' : stockBajo ? 'warning.main' : 'success.main',
                            },
                          }}
                        />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Precio:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {formatearPesosChilenos(producto.precio_venta)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Costo:
                          </Typography>
                          <Typography variant="body2">
                            {formatearPesosChilenos(producto.costo)}
                          </Typography>
                        </Box>
                        {producto.costo && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Margen:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                              <Typography variant="body2" fontWeight="bold" color="success.main">
                                {margen.toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 2 }}>
                          <Tooltip title="Ajustar Stock">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenAjusteStock(producto)}
                              color="warning"
                            >
                              <InventoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Historial">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setProductoHistorial(producto);
                                setHistorialOpen(true);
                              }}
                              color="info"
                            >
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(producto)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(producto)}
                                color="error"
                                disabled={deletingId === producto.id || deleteMutation.isLoading}
                              >
                                {deletingId === producto.id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      )}

      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Imagen */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  {imagenPreview ? (
                    <Card sx={{ maxWidth: 200, mb: 2 }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={imagenPreview}
                        alt="Vista previa"
                        sx={{ objectFit: 'contain' }}
                      />
                    </Card>
                  ) : (
                    <Avatar
                      sx={{ width: 200, height: 200, mb: 2, bgcolor: 'grey.200' }}
                      variant="rounded"
                    >
                      <ImageIcon sx={{ fontSize: 80 }} />
                    </Avatar>
                  )}
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<ImageIcon />}
                  >
                    {imagenPreview ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Código"
                  value={editingProducto ? formData.codigo : 'Se generará automáticamente'}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value })
                  }
                  disabled
                  helperText={editingProducto ? 'El código no se puede modificar' : 'El código se generará automáticamente al guardar'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={formData.categoria}
                    label="Categoría"
                    onChange={(e) =>
                      setFormData({ ...formData, categoria: e.target.value })
                    }
                    disabled={isLoadingCategorias}
                  >
                    <MenuItem value="">Sin categoría</MenuItem>
                    {categorias?.data?.results && categorias.data.results.length > 0 ? (
                      categorias.data.results.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </MenuItem>
                      ))
                    ) : (
                      !isLoadingCategorias && (
                        <MenuItem value="" disabled>
                          No hay categorías disponibles
                        </MenuItem>
                      )
                    )}
                  </Select>
                  {!isLoadingCategorias && (!categorias?.data?.results || categorias.data.results.length === 0) && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        No hay categorías. 
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => setCategoriaDialogOpen(true)}
                        sx={{ minWidth: 'auto', p: 0.5 }}
                      >
                        Crear categoría
                      </Button>
                    </Box>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Proveedor</InputLabel>
                  <Select
                    value={formData.proveedor}
                    label="Proveedor"
                    onChange={(e) =>
                      setFormData({ ...formData, proveedor: e.target.value })
                    }
                  >
                    <MenuItem value="">Sin proveedor</MenuItem>
                    {proveedores?.data?.results?.map((prov) => (
                      <MenuItem key={prov.id} value={prov.id}>
                        {prov.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Código de Barras"
                  value={formData.codigo_barras}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo_barras: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Unidad de Medida</InputLabel>
                  <Select
                    value={formData.unidad_medida}
                    label="Unidad de Medida"
                    onChange={(e) =>
                      setFormData({ ...formData, unidad_medida: e.target.value })
                    }
                  >
                    {unidadesMedida.map((unidad) => (
                      <MenuItem key={unidad} value={unidad}>
                        {unidad}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Costo"
                  type="number"
                  value={formData.costo}
                  onChange={(e) =>
                    setFormData({ ...formData, costo: e.target.value })
                  }
                  required
                  inputProps={{ step: '1', min: '1' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Precio de Venta"
                  type="number"
                  value={formData.precio_venta}
                  onChange={(e) =>
                    setFormData({ ...formData, precio_venta: e.target.value })
                  }
                  required
                  inputProps={{ step: '1', min: '1' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  error={!!(
                    formData.precio_venta && 
                    formData.costo && 
                    parseFloat(formData.precio_venta) < parseFloat(formData.costo)
                  )}
                  helperText={
                    formData.precio_venta && 
                    formData.costo && 
                    parseFloat(formData.precio_venta) < parseFloat(formData.costo)
                      ? `El precio de venta no puede ser menor al costo (${formatearPesosChilenos(formData.costo)})`
                      : formData.costo && formData.precio_venta
                      ? `Margen: ${((parseFloat(formData.precio_venta) - parseFloat(formData.costo)) / parseFloat(formData.costo) * 100).toFixed(2)}%`
                      : ''
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Stock Actual"
                  type="number"
                  value={formData.stock_actual}
                  onChange={(e) =>
                    setFormData({ ...formData, stock_actual: e.target.value })
                  }
                  required
                  inputProps={{ min: '0' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Stock Mínimo"
                  type="number"
                  value={formData.stock_minimo}
                  onChange={(e) =>
                    setFormData({ ...formData, stock_minimo: e.target.value })
                  }
                  required
                  inputProps={{ min: '0' }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.activo}
                      onChange={(e) =>
                        setFormData({ ...formData, activo: e.target.checked })
                      }
                    />
                  }
                  label="Producto Activo"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {createMutation.isLoading || updateMutation.isLoading ? (
                <CircularProgress size={24} />
              ) : editingProducto ? (
                'Actualizar'
              ) : (
                'Crear'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar para mensajes de éxito/error */}
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

      {/* Dialog de Ajuste de Stock */}
      <Dialog
        open={ajusteStockOpen}
        onClose={handleCloseAjusteStock}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleAjustarStock}>
          <DialogTitle>
            Ajustar Stock - {productoAjuste?.nombre}
          </DialogTitle>
          <DialogContent>
            {productoAjuste && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Stock Actual:</strong> {productoAjuste.stock_actual} {productoAjuste.unidad_medida || 'UN'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Stock Mínimo:</strong> {productoAjuste.stock_minimo} {productoAjuste.unidad_medida || 'UN'}
                  </Typography>
                </Alert>
                
                <TextField
                  fullWidth
                  label="Cantidad a Ajustar"
                  type="number"
                  value={ajusteStockData.cantidad}
                  onChange={(e) => setAjusteStockData({ ...ajusteStockData, cantidad: e.target.value })}
                  required
                  sx={{ mb: 2 }}
                  helperText={
                    ajusteStockData.cantidad
                      ? `Stock resultante: ${productoAjuste.stock_actual + parseInt(ajusteStockData.cantidad || 0)} ${productoAjuste.unidad_medida || 'UN'}`
                      : 'Ingrese cantidad positiva para aumentar o negativa para disminuir'
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {parseInt(ajusteStockData.cantidad || 0) >= 0 ? '+' : ''}
                      </InputAdornment>
                    ),
                  }}
                  error={!!(
                    ajusteStockData.cantidad &&
                    productoAjuste.stock_actual + parseInt(ajusteStockData.cantidad || 0) < 0
                  )}
                />
                
                <TextField
                  fullWidth
                  label="Motivo del Ajuste"
                  value={ajusteStockData.motivo}
                  onChange={(e) => setAjusteStockData({ ...ajusteStockData, motivo: e.target.value })}
                  multiline
                  rows={3}
                  placeholder="Ej: Inventario físico, Corrección de error, etc."
                  helperText="Opcional: Describa el motivo del ajuste de stock"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAjusteStock} disabled={ajustarStockMutation.isLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="warning"
              disabled={
                ajustarStockMutation.isLoading ||
                !ajusteStockData.cantidad ||
                ajusteStockData.cantidad === '0' ||
                (ajusteStockData.cantidad && productoAjuste && productoAjuste.stock_actual + parseInt(ajusteStockData.cantidad || 0) < 0)
              }
            >
              {ajustarStockMutation.isLoading ? (
                <CircularProgress size={24} />
              ) : (
                'Ajustar Stock'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog de Historial de Movimientos */}
      <Dialog
        open={historialOpen}
        onClose={handleCloseHistorial}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Historial de Movimientos - {productoHistorial?.nombre}
            </Typography>
            <Button
              startIcon={<FileDownloadIcon />}
              onClick={handleExportarHistorial}
              variant="outlined"
              size="small"
            >
              Exportar CSV
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {productoHistorial && (
            <HistorialMovimientos
              productoId={productoHistorial.id}
              filtros={filtrosHistorial}
              onFiltrosChange={setFiltrosHistorial}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistorial}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para administrar categorías */}
      <Dialog
        open={adminCategoriasOpen}
        onClose={() => {
          setAdminCategoriasOpen(false);
          setEditingCategoria(null);
          setNuevaCategoria({ nombre: '', descripcion: '' });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Administrar Categorías</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingCategoria(null);
                setNuevaCategoria({ nombre: '', descripcion: '' });
                setCategoriaDialogOpen(true);
              }}
              size="small"
            >
              Nueva Categoría
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoadingCategorias ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : categorias?.data?.results && categorias.data.results.length > 0 ? (
                  categorias.data.results.map((cat) => (
                    <TableRow key={cat.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {cat.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {cat.descripcion || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={cat.activa ? 'Activa' : 'Inactiva'}
                          color={cat.activa ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingCategoria(cat);
                                setNuevaCategoria({
                                  nombre: cat.nombre,
                                  descripcion: cat.descripcion || '',
                                });
                                setCategoriaDialogOpen(true);
                              }}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (window.confirm(`¿Está seguro de eliminar la categoría "${cat.nombre}"?`)) {
                                    setDeletingCategoriaId(cat.id);
                                    deleteCategoriaMutation.mutate(cat.id);
                                  }
                                }}
                                color="error"
                                disabled={deletingCategoriaId === cat.id || deleteCategoriaMutation.isLoading}
                              >
                                {deletingCategoriaId === cat.id ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <DeleteIcon />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No hay categorías registradas
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAdminCategoriasOpen(false);
            setEditingCategoria(null);
            setNuevaCategoria({ nombre: '', descripcion: '' });
          }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear/editar categoría */}
      <Dialog
        open={categoriaDialogOpen}
        onClose={() => {
          setCategoriaDialogOpen(false);
          setEditingCategoria(null);
          setNuevaCategoria({ nombre: '', descripcion: '' });
        }}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!nuevaCategoria.nombre.trim()) {
            setSnackbar({
              open: true,
              message: 'El nombre de la categoría es requerido',
              severity: 'error',
            });
            return;
          }
          if (editingCategoria) {
            updateCategoriaMutation.mutate({
              id: editingCategoria.id,
              data: {
                nombre: nuevaCategoria.nombre.trim(),
                descripcion: nuevaCategoria.descripcion.trim() || null,
                activa: editingCategoria.activa !== undefined ? editingCategoria.activa : true,
              },
            });
          } else {
            createCategoriaMutation.mutate({
              nombre: nuevaCategoria.nombre.trim(),
              descripcion: nuevaCategoria.descripcion.trim() || null,
              activa: true,
            });
          }
        }}>
          <DialogTitle>
            {editingCategoria ? 'Editar Categoría' : 'Crear Nueva Categoría'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre de la Categoría"
                  value={nuevaCategoria.nombre}
                  onChange={(e) =>
                    setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })
                  }
                  required
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={nuevaCategoria.descripcion}
                  onChange={(e) =>
                    setNuevaCategoria({ ...nuevaCategoria, descripcion: e.target.value })
                  }
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setCategoriaDialogOpen(false);
              setNuevaCategoria({ nombre: '', descripcion: '' });
            }}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                (createCategoriaMutation.isLoading || updateCategoriaMutation.isLoading) ||
                !nuevaCategoria.nombre.trim()
              }
            >
              {createCategoriaMutation.isLoading || updateCategoriaMutation.isLoading ? (
                <CircularProgress size={24} />
              ) : editingCategoria ? (
                'Actualizar Categoría'
              ) : (
                'Crear Categoría'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

// Componente de Historial de Movimientos
function HistorialMovimientos({ productoId, filtros, onFiltrosChange }) {
  const { data: movimientos, isLoading } = useQuery(
    ['movimientos', productoId, filtros],
    () => movimientosService.getByProducto(productoId, filtros),
    {
      enabled: !!productoId,
      staleTime: 1 * 60 * 1000,
    }
  );

  return (
    <Box>
      {/* Filtros */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filtros.tipo}
              label="Tipo"
              onChange={(e) => onFiltrosChange({ ...filtros, tipo: e.target.value })}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ENTRADA">Entrada</MenuItem>
              <MenuItem value="SALIDA">Salida</MenuItem>
              <MenuItem value="AJUSTE">Ajuste</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            size="small"
            label="Fecha Desde"
            type="date"
            value={filtros.fecha_desde}
            onChange={(e) => onFiltrosChange({ ...filtros, fecha_desde: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            size="small"
            label="Fecha Hasta"
            type="date"
            value={filtros.fecha_hasta}
            onChange={(e) => onFiltrosChange({ ...filtros, fecha_hasta: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            size="small"
            label="Usuario"
            value={filtros.usuario}
            onChange={(e) => onFiltrosChange({ ...filtros, usuario: e.target.value })}
            placeholder="Buscar por usuario..."
          />
        </Grid>
      </Grid>

      {/* Tabla de movimientos */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Stock Anterior</TableCell>
                <TableCell align="right">Stock Nuevo</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Usuario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimientos?.data?.results?.length > 0 || movimientos?.data?.length > 0 ? (
                (movimientos?.data?.results || movimientos?.data || []).map((movimiento) => (
                  <TableRow key={movimiento.id} hover>
                    <TableCell>
                      {new Date(movimiento.fecha).toLocaleString('es-CL')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={movimiento.tipo_display || movimiento.tipo}
                        size="small"
                        color={
                          movimiento.tipo === 'ENTRADA'
                            ? 'success'
                            : movimiento.tipo === 'SALIDA'
                            ? 'error'
                            : 'warning'
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            movimiento.tipo === 'ENTRADA'
                              ? 'success.main'
                              : movimiento.tipo === 'SALIDA'
                              ? 'error.main'
                              : 'warning.main',
                          fontWeight: 'bold',
                        }}
                      >
                        {movimiento.tipo === 'ENTRADA' ? '+' : movimiento.tipo === 'SALIDA' ? '-' : ''}
                        {Math.abs(movimiento.cantidad)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{movimiento.stock_anterior}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {movimiento.stock_nuevo}
                      </Typography>
                    </TableCell>
                    <TableCell>{movimiento.motivo}</TableCell>
                    <TableCell>{movimiento.usuario}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No hay movimientos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default Productos;
