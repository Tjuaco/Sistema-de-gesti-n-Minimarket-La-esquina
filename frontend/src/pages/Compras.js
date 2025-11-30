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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Snackbar,
  Card,
  CardContent,
  Divider,
  Collapse,
  TableSortLabel,
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
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { comprasService } from '../services/compras';
import { productosService } from '../services/productos';
import { proveedoresService } from '../services/proveedores';
import { formatearPesosChilenos } from '../utils/formato';
import { debounce } from '../utils/debounce';

function Compras() {
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingCompra, setEditingCompra] = useState(null);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProveedor, setFilterProveedor] = useState('all');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [orderBy, setOrderBy] = useState('fecha');
  const [orderDirection, setOrderDirection] = useState('desc');
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    proveedor: '',
    fecha: new Date().toISOString().slice(0, 16), // Formato YYYY-MM-DDTHH:mm para datetime-local
    observaciones: '',
  });
  const [currentItem, setCurrentItem] = useState({
    producto: '',
    cantidad: '',
    costo_unitario: '',
  });
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const queryClient = useQueryClient();

  const { data: compras, isLoading } = useQuery('compras', () =>
    comprasService.getAll(),
    {
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    }
  );

  const { data: productos } = useQuery(
    ['productos', 'activos'],
    () => productosService.getAll({ activo: true }),
    {
      staleTime: 1 * 60 * 1000, // 1 minuto - datos más frescos
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true, // Refrescar cuando se enfoca la ventana
    }
  );

  const { data: proveedores } = useQuery('proveedores', () =>
    proveedoresService.getAll(),
    {
      staleTime: 10 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
    }
  );

  const createMutation = useMutation(
    (data) => comprasService.create(data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('compras');
        queryClient.invalidateQueries('productos');
        setSnackbar({
          open: true,
          message: 'Compra registrada exitosamente',
          severity: 'success',
        });
        handleClose();
      },
      onError: (err) => {
        let errorMessage = 'Error al registrar la compra';
        
        try {
          if (typeof err === 'string') {
            errorMessage = err;
          } else if (err?.message) {
            errorMessage = err.message;
          } else if (err?.response?.data) {
            const data = err.response.data;
            
            // Si es un string directo
            if (typeof data === 'string') {
              errorMessage = data;
            }
            // Errores 500 con detalles
            else if (data.error) {
              errorMessage = data.error;
              if (data.detail) {
                errorMessage += `\n\nDetalles: ${data.detail}`;
              }
            }
            // Errores de campos específicos
            else if (data.items) {
              // Error en items
              const itemsErrors = Array.isArray(data.items) ? data.items : [data.items];
              const itemsMessages = itemsErrors.map((itemError, index) => {
                if (typeof itemError === 'string') {
                  return `Item ${index + 1}: ${itemError}`;
                } else if (typeof itemError === 'object') {
                  const fieldErrors = Object.entries(itemError).map(([field, messages]) => {
                    const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
                    return `${field}: ${msg}`;
                  });
                  return `Item ${index + 1}: ${fieldErrors.join('; ')}`;
                }
                return `Item ${index + 1}: Error desconocido`;
              });
              errorMessage = itemsMessages.join('\n');
            }
            // Errores generales
            else if (data.non_field_errors) {
              errorMessage = Array.isArray(data.non_field_errors) 
                ? data.non_field_errors.join(', ') 
                : String(data.non_field_errors);
            }
            // Errores de otros campos
            else {
              const fieldErrors = Object.entries(data).map(([field, messages]) => {
                const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
                return `${field}: ${msg}`;
              });
              if (fieldErrors.length > 0) {
                errorMessage = fieldErrors.join('\n');
              } else {
                // Si no hay errores específicos, mostrar el objeto completo para debugging
                errorMessage = `Error de validación: ${JSON.stringify(data)}`;
              }
            }
          }
        } catch (e) {
          console.error('Error al procesar mensaje de error:', e);
          errorMessage = 'Error al procesar el mensaje de error. Por favor, verifique que todos los campos estén completos.';
        }
        
        setError(errorMessage);
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => comprasService.update(id, data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('compras');
        queryClient.invalidateQueries('productos');
        setSnackbar({
          open: true,
          message: 'Compra actualizada exitosamente',
          severity: 'success',
        });
        handleClose();
      },
      onError: (err) => {
        let errorMessage = 'Error al actualizar la compra';
        
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
        
        setError(errorMessage);
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => comprasService.delete(id),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('compras');
        queryClient.invalidateQueries('productos');
        const data = response?.data || {};
        setSnackbar({
          open: true,
          message: data.mensaje || 'Compra eliminada exitosamente',
          severity: 'success',
        });
        setDeletingId(null);
      },
      onError: (err) => {
        let errorMessage = 'Error al eliminar la compra';
        
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
    // Invalidar caché de productos para obtener datos actualizados
    queryClient.invalidateQueries(['productos', 'activos']);
    setOpen(true);
    setError(null);
    setItems([]);
    setFormData({
      proveedor: '',
      fecha: new Date().toISOString().slice(0, 16), // Formato YYYY-MM-DDTHH:mm para datetime-local
      observaciones: '',
    });
    setCurrentItem({
      producto: '',
      cantidad: '',
      costo_unitario: '',
    });
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCompra(null);
    setItems([]);
    setFormData({
      proveedor: '',
      fecha: new Date().toISOString().slice(0, 16),
      observaciones: '',
    });
    setCurrentItem({
      producto: '',
      cantidad: '',
      costo_unitario: '',
    });
    setError(null);
  };

  const handleEdit = (compra) => {
    setEditingCompra(compra);
    // Formatear fecha para el input datetime-local
    const fechaCompra = compra.fecha ? new Date(compra.fecha).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);
    setFormData({
      proveedor: compra.proveedor?.toString() || '',
      fecha: fechaCompra,
      observaciones: compra.observaciones || '',
    });
    
    // Cargar items de la compra
    const compraItems = compra.items?.map(item => ({
      producto: item.producto,
      producto_nombre: item.producto_nombre,
      producto_codigo: item.producto_codigo,
      cantidad: item.cantidad,
      costo_unitario: Math.round(parseFloat(item.costo_unitario)),
    })) || [];
    
    setItems(compraItems);
    setOpen(true);
    setError(null);
  };

  const handleDelete = (compra) => {
    if (window.confirm(
      `¿Está seguro de eliminar la compra #${compra.id}?\n\n` +
      `Esta acción revertirá los cambios de stock de los productos.\n` +
      `Esta acción no se puede deshacer.`
    )) {
      setDeletingId(compra.id);
      deleteMutation.mutate(compra.id);
    }
  };

  const handleViewDetails = (compra) => {
    setSelectedCompra(compra);
    setDetailOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailOpen(false);
    setSelectedCompra(null);
  };

  const handleToggleRow = (compraId) => {
    setExpandedRows(prev => ({
      ...prev,
      [compraId]: !prev[compraId]
    }));
  };

  const handleAddItem = () => {
    if (!currentItem.producto) {
      setError('Debe seleccionar un producto');
      return;
    }

    // Validar que haya un proveedor seleccionado
    if (!formData.proveedor) {
      setError('Debe seleccionar un proveedor antes de agregar productos');
      return;
    }

    // Validar que el producto pertenezca al proveedor seleccionado
    const producto = productos?.data?.results?.find(
      (p) => p.id === parseInt(currentItem.producto)
    );
    
    if (!producto) {
      setError('Producto no encontrado');
      return;
    }
    
    const proveedorId = parseInt(formData.proveedor);
    const prodProveedorId = producto.proveedor 
      ? (typeof producto.proveedor === 'object' ? producto.proveedor.id : parseInt(producto.proveedor))
      : null;
    
    if (prodProveedorId !== proveedorId) {
      setError('El producto seleccionado no pertenece al proveedor elegido');
      return;
    }

    // Verificar si el producto ya está en la lista
    const existe = items.find(item => item.producto === producto.id);
    if (existe) {
      setError('Este producto ya está en la lista. Puedes editar la cantidad o eliminarlo.');
      return;
    }

    // Usar cantidad por defecto de 1 si no se especifica
    const cantidad = currentItem.cantidad ? parseInt(currentItem.cantidad) : 1;
    // Usar costo unitario por defecto del producto si no se especifica
    const costoUnitario = currentItem.costo_unitario 
      ? Math.round(parseFloat(currentItem.costo_unitario))
      : Math.round(parseFloat(producto.costo || 0));

    setItems([
      ...items,
      {
        producto: parseInt(producto.id), // Asegurar que sea un número
        producto_nombre: producto.nombre,
        producto_codigo: producto.codigo,
        cantidad: cantidad > 0 ? cantidad : 1,
        costo_unitario: costoUnitario > 0 ? costoUnitario : 1,
      },
    ]);
    setCurrentItem({
      producto: '',
      cantidad: '',
      costo_unitario: '',
    });
    setError(null);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'cantidad' ? parseInt(value) || 0 : Math.round(parseFloat(value) || 0),
    };
    setItems(updatedItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    // Validar que haya un proveedor seleccionado
    if (!formData.proveedor || formData.proveedor === '') {
      setError('Debe seleccionar un proveedor para registrar la compra');
      return;
    }

    // Validar que haya al menos un producto
    if (items.length === 0) {
      setError('Debe agregar al menos un producto para registrar la compra');
      return;
    }

    // Validar que todos los items tengan un producto válido
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.producto || item.producto === '' || item.producto === null || item.producto === undefined) {
        setError(`El item ${i + 1} (${item.producto_nombre || 'sin nombre'}) no tiene un producto válido. Por favor, elimínelo y agréguelo nuevamente.`);
        return;
      }
      
      // Convertir producto a número si es necesario
      const productoId = parseInt(item.producto);
      if (isNaN(productoId)) {
        setError(`El producto en el item ${i + 1} (${item.producto_nombre || 'sin nombre'}) no es válido. Por favor, elimínelo y agréguelo nuevamente.`);
        return;
      }
    }

    // Calcular total de la compra
    const totalCompraCalculado = items.reduce(
      (sum, item) => sum + (item.cantidad || 0) * (item.costo_unitario || 0),
      0
    );

    // Mostrar confirmación antes de registrar
    const nombreProveedor = formData.proveedor && formData.proveedor !== ''
      ? proveedores?.data?.results?.find(p => p.id === parseInt(formData.proveedor))?.nombre || 'N/A'
      : 'Sin proveedor';
    
    const fechaMostrar = formData.fecha 
      ? new Date(formData.fecha).toLocaleString('es-CL')
      : 'Fecha actual (automática)';

    const confirmar = window.confirm(
      `¿Está seguro de ${editingCompra ? 'actualizar' : 'registrar'} esta compra?\n\n` +
      `Proveedor: ${nombreProveedor}\n` +
      `Fecha: ${fechaMostrar}\n` +
      `Productos: ${items.length}\n` +
      `Total: ${formatearPesosChilenos(totalCompraCalculado)}\n\n` +
      `Esta acción ${editingCompra ? 'actualizará' : 'registrará'} la compra y ${editingCompra ? 'actualizará' : 'aumentará'} el stock de los productos.`
    );

    if (!confirmar) {
      return;
    }

    // Formatear fecha para el backend (ISO 8601)
    let fechaFormateada = null;
    if (formData.fecha) {
      // Convertir de datetime-local (YYYY-MM-DDTHH:mm) a ISO 8601 completo
      fechaFormateada = new Date(formData.fecha).toISOString();
    }

    // Validar proveedor solo si se proporciona
    let proveedorId = null;
    if (formData.proveedor && formData.proveedor !== '') {
      proveedorId = parseInt(formData.proveedor);
      if (isNaN(proveedorId)) {
        setError('El proveedor seleccionado no es válido');
        return;
      }
    }

    // Validar y formatear items antes de enviar
    const itemsValidados = items.map((item) => {
      // Validar que el producto exista y sea un número válido
      const productoId = parseInt(item.producto);
      if (!productoId || isNaN(productoId)) {
        throw new Error(`El producto en el item "${item.producto_nombre || 'desconocido'}" no es válido`);
      }

      // Validar cantidad
      const cantidad = item.cantidad ? parseInt(item.cantidad) : 1;
      if (isNaN(cantidad) || cantidad <= 0) {
        throw new Error(`La cantidad en el item "${item.producto_nombre || 'desconocido'}" no es válida`);
      }

      // Validar costo unitario
      const costoUnitario = item.costo_unitario ? parseFloat(item.costo_unitario) : 1;
      if (isNaN(costoUnitario) || costoUnitario <= 0) {
        throw new Error(`El costo unitario en el item "${item.producto_nombre || 'desconocido'}" no es válido`);
      }

      return {
        producto: productoId,
        cantidad: cantidad,
        costo_unitario: Math.round(costoUnitario), // Redondear a entero
      };
    });

    const submitData = {
      // No enviar numero_factura, el backend lo generará automáticamente
      proveedor: proveedorId || null,
      fecha: fechaFormateada || null,
      observaciones: formData.observaciones && formData.observaciones.trim() !== '' ? formData.observaciones.trim() : null,
      items: itemsValidados,
    };

    if (editingCompra) {
      updateMutation.mutate({ id: editingCompra.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Filtrar compras
  const comprasList = compras?.data?.results || [];
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

  // Filtrar y ordenar compras con useMemo para optimización
  const filteredCompras = useMemo(() => {
    let filtered = comprasList.filter((compra) => {
      const matchesSearch =
        compra.numero_factura?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        compra.proveedor_nombre?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        compra.id?.toString().includes(debouncedSearchTerm);
      
      // Mejorar comparación de proveedor (puede ser objeto o número)
      const compraProveedorId = compra.proveedor 
        ? (typeof compra.proveedor === 'object' ? compra.proveedor.id : parseInt(compra.proveedor))
        : null;
      const matchesProveedor = filterProveedor === 'all' || 
        compraProveedorId === parseInt(filterProveedor);

      // Filtro por fecha
      const compraFecha = compra.fecha ? new Date(compra.fecha) : null;
      const matchesFechaDesde = !filterFechaDesde || !compraFecha || 
        compraFecha >= new Date(filterFechaDesde + 'T00:00:00');
      const matchesFechaHasta = !filterFechaHasta || !compraFecha || 
        compraFecha <= new Date(filterFechaHasta + 'T23:59:59');

      return matchesSearch && matchesProveedor && matchesFechaDesde && matchesFechaHasta;
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
        case 'proveedor':
          aValue = a.proveedor_nombre || '';
          bValue = b.proveedor_nombre || '';
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
  }, [comprasList, debouncedSearchTerm, filterProveedor, filterFechaDesde, filterFechaHasta, orderBy, orderDirection]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = filteredCompras.length;
    const montoTotal = filteredCompras.reduce((sum, c) => sum + (c.total || 0), 0);
    const totalItems = filteredCompras.reduce((sum, c) => sum + (c.items?.length || 0), 0);
    const promedioCompra = total > 0 ? montoTotal / total : 0;
    
    return { total, montoTotal, totalItems, promedioCompra };
  }, [filteredCompras]);

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
      if (filterProveedor && filterProveedor !== 'all') {
        params.proveedor = filterProveedor;
      }
      if (filterFechaDesde) {
        params.fecha_desde = filterFechaDesde;
      }
      if (filterFechaHasta) {
        params.fecha_hasta = filterFechaHasta;
      }
      
      const response = await comprasService.exportarCSV(params);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `compras_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbar({
        open: true,
        message: 'Compras exportadas exitosamente',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al exportar compras',
        severity: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const totalCompra = items.reduce(
    (sum, item) => sum + (item.cantidad || 0) * (item.costo_unitario || 0),
    0
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Compras</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Nueva Compra
        </Button>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ShoppingCartIcon color="primary" />
                <Typography variant="caption" color="text.secondary">Total Compras</Typography>
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
              <Typography variant="caption" color="text.secondary">Promedio por Compra</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {formatearPesosChilenos(estadisticas.promedioCompra)}
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
              placeholder="Buscar por número de factura, proveedor o ID..."
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
              <InputLabel>Proveedor</InputLabel>
              <Select
                value={filterProveedor}
                label="Proveedor"
                onChange={(e) => setFilterProveedor(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                {proveedores?.data?.results?.map((prov) => (
                  <MenuItem key={prov.id} value={prov.id}>
                    {prov.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportarCSV}
            >
              Exportar CSV
            </Button>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {filteredCompras.length} de {comprasList.length} compras
          </Typography>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'id'}
                  direction={orderBy === 'id' ? orderDirection : 'desc'}
                  onClick={() => handleSort('id')}
                >
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell>Número Factura</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'proveedor'}
                  direction={orderBy === 'proveedor' ? orderDirection : 'asc'}
                  onClick={() => handleSort('proveedor')}
                >
                  Proveedor
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
                  Items
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'total'}
                  direction={orderBy === 'total' ? orderDirection : 'desc'}
                  onClick={() => handleSort('total')}
                >
                  Total
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCompras.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No se encontraron compras
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCompras.map((compra) => (
                <React.Fragment key={compra.id}>
                  <TableRow hover>
                    <TableCell>{compra.id}</TableCell>
                    <TableCell>
                      {compra.numero_factura ? (
                        <Chip label={compra.numero_factura} size="small" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>{compra.proveedor_nombre}</TableCell>
                    <TableCell>
                      {new Date(compra.fecha).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${compra.items?.length || 0} producto(s)`} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatearPesosChilenos(compra.total)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(compra)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(compra)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(compra)}
                            color="error"
                            disabled={deletingId === compra.id || deleteMutation.isLoading}
                          >
                            {deletingId === compra.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <DeleteIcon />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleRow(compra.id)}
                        color="default"
                      >
                        {expandedRows[compra.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
                      <Collapse in={expandedRows[compra.id]} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Detalles de la Compra
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Producto</TableCell>
                                <TableCell align="right">Cantidad</TableCell>
                                <TableCell align="right">Costo Unitario</TableCell>
                                <TableCell align="right">Subtotal</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {compra.items?.map((item, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                      {item.producto_codigo} - {item.producto_nombre}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">{item.cantidad}</TableCell>
                                  <TableCell align="right">
                                    {formatearPesosChilenos(item.costo_unitario)}
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="medium">
                                      {formatearPesosChilenos(item.subtotal)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {compra.observaciones && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Observaciones: {compra.observaciones}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para nueva compra */}
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
            {editingCompra ? `Editar Compra #${editingCompra.id}` : 'Nueva Compra'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Proveedor *</InputLabel>
                  <Select
                    value={formData.proveedor}
                    label="Proveedor *"
                    onChange={(e) => {
                      const nuevoProveedor = e.target.value;
                      
                      // Si se cambia el proveedor, limpiar todos los items y el producto seleccionado
                      if (formData.proveedor && formData.proveedor !== nuevoProveedor && items.length > 0) {
                        const confirmar = window.confirm(
                          'Al cambiar el proveedor, se eliminarán todos los productos agregados a la compra. ¿Desea continuar?'
                        );
                        if (!confirmar) {
                          return; // No cambiar el proveedor
                        }
                        setItems([]); // Limpiar todos los items
                      }
                      
                      setFormData({ ...formData, proveedor: nuevoProveedor });
                      // Limpiar producto seleccionado
                      setCurrentItem({ ...currentItem, producto: '' });
                      setError(null);
                    }}
                  >
                    <MenuItem value="">Seleccionar proveedor</MenuItem>
                    {proveedores?.data?.results?.map((prov) => (
                      <MenuItem key={prov.id} value={prov.id}>
                        {prov.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                    {formData.proveedor 
                      ? 'Solo podrá seleccionar productos de este proveedor' 
                      : '⚠️ Debe seleccionar un proveedor para poder agregar productos a la compra'}
                  </Typography>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha de Compra"
                  type="datetime-local"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    max: new Date().toISOString().slice(0, 16), // No permitir fechas futuras
                  }}
                  helperText="Si no se especifica, se usará la fecha y hora actual"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  multiline
                  rows={2}
                  placeholder="Notas adicionales sobre la compra..."
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Productos
                </Typography>
              </Grid>

              <Grid item xs={12} sm={5}>
                <FormControl fullWidth>
                  <InputLabel>Producto</InputLabel>
                  <Select
                    value={currentItem.producto}
                    label="Producto"
                    onChange={(e) =>
                      setCurrentItem({ ...currentItem, producto: e.target.value })
                    }
                    disabled={!formData.proveedor}
                  >
                    <MenuItem value="">
                      {!formData.proveedor 
                        ? 'Primero seleccione un proveedor' 
                        : 'Seleccionar producto'}
                    </MenuItem>
                    {(() => {
                      // Si no hay proveedor seleccionado, no mostrar productos
                      if (!formData.proveedor) {
                        return (
                          <MenuItem value="" disabled>
                            Debe seleccionar un proveedor primero
                          </MenuItem>
                        );
                      }

                      // Filtrar productos SOLO del proveedor seleccionado (no productos sin proveedor)
                      const proveedorId = parseInt(formData.proveedor);
                      const productosFiltrados = productos?.data?.results?.filter(prod => {
                        // Solo productos que pertenezcan EXACTAMENTE a este proveedor
                        const prodProveedorId = prod.proveedor 
                          ? (typeof prod.proveedor === 'object' ? prod.proveedor.id : parseInt(prod.proveedor))
                          : null;
                        return prodProveedorId === proveedorId;
                      }) || [];
                      
                      // Si no hay productos para este proveedor
                      if (productosFiltrados.length === 0) {
                        return (
                          <MenuItem value="" disabled>
                            Este proveedor no tiene productos registrados
                          </MenuItem>
                        );
                      }
                      
                      // Mostrar productos del proveedor
                      return productosFiltrados.map((prod) => (
                        <MenuItem key={prod.id} value={prod.id}>
                          {prod.codigo} - {prod.nombre}
                        </MenuItem>
                      ));
                    })()}
                  </Select>
                  {formData.proveedor && (() => {
                    const proveedorId = parseInt(formData.proveedor);
                    const productosProveedor = productos?.data?.results?.filter(prod => {
                      const prodProveedorId = prod.proveedor 
                        ? (typeof prod.proveedor === 'object' ? prod.proveedor.id : parseInt(prod.proveedor))
                        : null;
                      return prodProveedorId === proveedorId;
                    }) || [];
                    
                    if (productosProveedor.length === 0) {
                      return (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75, display: 'block' }}>
                          ⚠️ Este proveedor no tiene productos registrados. Por favor, registre productos para este proveedor primero.
                        </Typography>
                      );
                    }
                    
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                        Mostrando {productosProveedor.length} producto(s) de este proveedor
                      </Typography>
                    );
                  })()}
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
                  inputProps={{ min: '1', step: '1' }}
                  helperText="Si no se especifica, se usará 1"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Costo Unitario"
                  type="number"
                  value={currentItem.costo_unitario}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      costo_unitario: e.target.value,
                    })
                  }
                  inputProps={{ step: '1', min: '1' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  helperText="Si no se especifica, se usará el costo del producto"
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAddItem}
                  sx={{ height: '56px' }}
                  disabled={!currentItem.producto}
                >
                  +
                </Button>
              </Grid>

              {items.length > 0 && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Producto</TableCell>
                              <TableCell align="right">Cantidad</TableCell>
                              <TableCell align="right">Costo Unitario</TableCell>
                              <TableCell align="right">Subtotal</TableCell>
                              <TableCell align="center">Acción</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {item.producto_codigo} - {item.producto_nombre}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={item.cantidad}
                                    onChange={(e) => handleUpdateItem(index, 'cantidad', e.target.value)}
                                    inputProps={{ min: '1', style: { textAlign: 'right', width: '60px' } }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={item.costo_unitario}
                                    onChange={(e) => handleUpdateItem(index, 'costo_unitario', e.target.value)}
                                    inputProps={{ step: '1', min: '1', style: { textAlign: 'right', width: '100px' } }}
                                    InputProps={{
                                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="medium">
                                    {formatearPesosChilenos(item.cantidad * item.costo_unitario)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveItem(index)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {items.length} producto(s)
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          Total: {formatearPesosChilenos(totalCompra)}
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
              disabled={!formData.proveedor || items.length === 0 || createMutation.isLoading || updateMutation.isLoading}
            >
              {createMutation.isLoading || updateMutation.isLoading ? (
                <CircularProgress size={24} />
              ) : editingCompra ? (
                'Actualizar Compra'
              ) : (
                'Registrar Compra'
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
          Detalles de la Compra #{selectedCompra?.id}
        </DialogTitle>
        <DialogContent>
          {selectedCompra && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Número de Factura
                  </Typography>
                  <Typography variant="body1">
                    {selectedCompra.numero_factura || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Proveedor
                  </Typography>
                  <Typography variant="body1">
                    {selectedCompra.proveedor_nombre}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Fecha
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedCompra.fecha).toLocaleString('es-CL')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatearPesosChilenos(selectedCompra.total)}
                  </Typography>
                </Grid>
                {selectedCompra.observaciones && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Observaciones
                    </Typography>
                    <Typography variant="body1">
                      {selectedCompra.observaciones}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Productos ({selectedCompra.items?.length || 0})
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Costo Unitario</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedCompra.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.producto_codigo} - {item.producto_nombre}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{item.cantidad}</TableCell>
                        <TableCell align="right">
                          {formatearPesosChilenos(item.costo_unitario)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatearPesosChilenos(item.subtotal)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
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

export default Compras;
