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
  TableSortLabel,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InventoryIcon from '@mui/icons-material/Inventory';
import {
  FileDownload as FileDownloadIcon,
  LocalShipping as ShippingIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { proveedoresService } from '../services/proveedores';
import { productosService } from '../services/productos';
import { debounce } from '../utils/debounce';

function Proveedores() {
  const [open, setOpen] = useState(false);
  const [pedidoOpen, setPedidoOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [proveedorPedido, setProveedorPedido] = useState(null);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('nombre');
  const [orderDirection, setOrderDirection] = useState('asc');
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
  });
  const [pedidoData, setPedidoData] = useState({
    items: [],
    notas: '',
    fecha_estimada: '',
  });
  const [currentPedidoItem, setCurrentPedidoItem] = useState({
    producto: '',
    cantidad: '',
  });
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('proveedores', () =>
    proveedoresService.getAll(),
    {
      staleTime: 10 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
    }
  );

  // Query para historial de pedidos
  const { data: historialData, isLoading: isLoadingHistorial, error: historialError } = useQuery(
    ['historial-pedidos', filtroProveedor, filtroEstado],
    () => proveedoresService.getHistorialPedidos({
      proveedor: filtroProveedor || undefined,
      estado: filtroEstado || undefined,
    }),
    {
      enabled: historialOpen,
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      onSuccess: (data) => {
        console.log('Historial cargado - estructura completa:', data);
        console.log('Historial data.data:', data?.data);
        console.log('Historial data.data.results:', data?.data?.results);
      },
      onError: (error) => {
        console.error('Error al cargar historial:', error);
      },
    }
  );

  const { data: productos } = useQuery(
    ['productos', 'activos'],
    () => productosService.getAll({ activo: true }),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );

  const createMutation = useMutation(
    (data) => proveedoresService.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('proveedores');
        setSnackbar({
          open: true,
          message: 'Proveedor creado exitosamente',
          severity: 'success',
        });
        handleClose();
      },
      onError: (err) => {
        const errorMessage = err.response?.data?.error || err.message || 'Error al crear el proveedor';
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
    ({ id, data }) => proveedoresService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('proveedores');
        setSnackbar({
          open: true,
          message: 'Proveedor actualizado exitosamente',
          severity: 'success',
        });
        handleClose();
      },
      onError: (err) => {
        const errorMessage = err.response?.data?.error || err.message || 'Error al actualizar el proveedor';
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
    (id) => proveedoresService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('proveedores');
        setSnackbar({
          open: true,
          message: 'Proveedor eliminado exitosamente',
          severity: 'success',
        });
        setDeletingId(null);
      },
      onError: (err) => {
        const errorMessage = err.response?.data?.error || err.message || 'Error al eliminar el proveedor';
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
        setDeletingId(null);
      },
    }
  );

  const [pedidoError, setPedidoError] = useState(null);

  const enviarPedidoMutation = useMutation(
    ({ id, data }) => proveedoresService.enviarPedido(id, data),
    {
      onSuccess: (response) => {
        setSnackbar({
          open: true,
          message: response.data.mensaje || 'Correo enviado exitosamente',
          severity: 'success',
        });
        setPedidoError(null);
        handleClosePedido();
        // Invalidar cache del historial para que se actualice
        queryClient.invalidateQueries('historial-pedidos');
      },
      onError: (err) => {
        const errorMessage = err.response?.data?.error || err.message || 'Error al enviar el correo';
        setPedidoError(errorMessage);
        // Si el error contiene múltiples líneas (como instrucciones), mostrar un mensaje resumido en snackbar
        const firstLine = errorMessage.split('\n')[0];
        const isAuthError = errorMessage.includes('autenticación') || errorMessage.includes('App Password') || errorMessage.includes('contraseña de aplicación');
        setSnackbar({
          open: true,
          message: isAuthError 
            ? 'Error de configuración de correo. Ver detalles en el formulario.' 
            : firstLine,
          severity: 'error',
        });
      },
    }
  );

  const handleOpen = () => {
    setOpen(true);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProveedor(null);
    setFormData({
      nombre: '',
      rut: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
    });
    setError(null);
  };

  const handleEdit = (proveedor) => {
    setEditingProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      rut: proveedor.rut || '',
      contacto: proveedor.contacto || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      direccion: proveedor.direccion || '',
    });
    handleOpen();
  };

  const handleDelete = (proveedor) => {
    if (window.confirm(`¿Está seguro de eliminar el proveedor "${proveedor.nombre}"?`)) {
      setDeletingId(proveedor.id);
      deleteMutation.mutate(proveedor.id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (editingProveedor) {
      updateMutation.mutate({ id: editingProveedor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleOpenPedido = (proveedor) => {
    setProveedorPedido(proveedor);
    setPedidoData({
      items: [],
      notas: '',
      fecha_estimada: '',
    });
    setCurrentPedidoItem({
      producto: '',
      cantidad: '',
    });
    setPedidoOpen(true);
  };

  const handleClosePedido = () => {
    setPedidoOpen(false);
    setProveedorPedido(null);
    setPedidoData({
      items: [],
      notas: '',
      fecha_estimada: '',
    });
    setCurrentPedidoItem({
      producto: '',
      cantidad: '',
    });
    setPedidoError(null);
  };

  const handleAddPedidoItem = () => {
    if (!currentPedidoItem.producto) {
      setSnackbar({
        open: true,
        message: 'Debe seleccionar un producto',
        severity: 'error',
      });
      return;
    }

    const producto = productos?.data?.results?.find(
      (p) => p.id === parseInt(currentPedidoItem.producto)
    );

    if (!producto) {
      setSnackbar({
        open: true,
        message: 'Producto no encontrado',
        severity: 'error',
      });
      return;
    }

    const cantidad = parseInt(currentPedidoItem.cantidad) || 1;

    // Verificar si el producto ya está en la lista
    const existe = pedidoData.items.find(item => item.producto === producto.id);
    if (existe) {
      setSnackbar({
        open: true,
        message: 'Este producto ya está en la lista. Puede editar la cantidad o eliminarlo.',
        severity: 'warning',
      });
      return;
    }

    setPedidoData({
      ...pedidoData,
      items: [
        ...pedidoData.items,
        {
          producto: producto.id,
          producto_nombre: producto.nombre,
          producto_codigo: producto.codigo,
          cantidad: cantidad,
        },
      ],
    });

    setCurrentPedidoItem({
      producto: '',
      cantidad: '',
    });
  };

  const handleRemovePedidoItem = (index) => {
    setPedidoData({
      ...pedidoData,
      items: pedidoData.items.filter((_, i) => i !== index),
    });
  };

  const handleUpdatePedidoItem = (index, cantidad) => {
    const updatedItems = [...pedidoData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      cantidad: parseInt(cantidad) || 1,
    };
    setPedidoData({
      ...pedidoData,
      items: updatedItems,
    });
  };

  const handleEnviarPedido = () => {
    if (!proveedorPedido) return;

    if (!proveedorPedido.email) {
      setSnackbar({
        open: true,
        message: 'El proveedor no tiene un correo electrónico registrado',
        severity: 'error',
      });
      return;
    }

    if (pedidoData.items.length === 0) {
      setSnackbar({
        open: true,
        message: 'Debe agregar al menos un producto al pedido',
        severity: 'error',
      });
      return;
    }

    const confirmar = window.confirm(
      `¿Está seguro de enviar el pedido a ${proveedorPedido.email}?\n\n` +
      `Productos: ${pedidoData.items.length}\n` +
      `Total items: ${pedidoData.items.reduce((sum, item) => sum + item.cantidad, 0)}`
    );

    if (!confirmar) return;

    enviarPedidoMutation.mutate({
      id: proveedorPedido.id,
      data: {
        items: pedidoData.items.map(item => ({
          producto: item.producto,
          cantidad: item.cantidad,
        })),
        notas: pedidoData.notas || '',
        fecha_estimada: pedidoData.fecha_estimada || '',
      },
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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

  // Filtrar y ordenar proveedores
  const proveedoresList = data?.data?.results || [];
  const filteredProveedores = useMemo(() => {
    let filtered = proveedoresList.filter((proveedor) => {
      const matchesSearch =
        proveedor.nombre?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        proveedor.rut?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        proveedor.contacto?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        proveedor.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        proveedor.telefono?.includes(debouncedSearchTerm);

      return matchesSearch;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (orderBy) {
        case 'nombre':
          aValue = a.nombre || '';
          bValue = b.nombre || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'telefono':
          aValue = a.telefono || '';
          bValue = b.telefono || '';
          break;
        default:
          aValue = a.nombre || '';
          bValue = b.nombre || '';
      }

      return orderDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    return filtered;
  }, [proveedoresList, debouncedSearchTerm, orderBy, orderDirection]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = filteredProveedores.length;
    const conEmail = filteredProveedores.filter(p => p.email).length;
    const conTelefono = filteredProveedores.filter(p => p.telefono).length;
    
    return { total, conEmail, conTelefono };
  }, [filteredProveedores]);

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
      
      const response = await proveedoresService.exportarCSV(params);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `proveedores_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbar({
        open: true,
        message: 'Proveedores exportados exitosamente',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al exportar proveedores',
        severity: 'error',
      });
    }
  };

  // Obtener productos del proveedor seleccionado
  const productosProveedor = useMemo(() => {
    if (!proveedorPedido) return [];
    const proveedorId = proveedorPedido.id;
    return productos?.data?.results?.filter(prod => {
      const prodProveedorId = prod.proveedor 
        ? (typeof prod.proveedor === 'object' ? prod.proveedor.id : parseInt(prod.proveedor))
        : null;
      return prodProveedorId === proveedorId;
    }) || [];
  }, [productos, proveedorPedido]);

  // Calcular cantidad de productos por proveedor
  const cantidadProductosPorProveedor = useMemo(() => {
    const cantidad = {};
    proveedoresList.forEach(proveedor => {
      const proveedorId = proveedor.id;
      const cantidadProductos = productos?.data?.results?.filter(prod => {
        const prodProveedorId = prod.proveedor 
          ? (typeof prod.proveedor === 'object' ? prod.proveedor.id : parseInt(prod.proveedor))
          : null;
        return prodProveedorId === proveedorId;
      }).length || 0;
      cantidad[proveedorId] = cantidadProductos;
    });
    return cantidad;
  }, [proveedoresList, productos]);

  const handleViewDetails = (proveedor) => {
    setSelectedProveedor(proveedor);
    setDetailOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailOpen(false);
    setSelectedProveedor(null);
  };

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
        <Typography variant="h4">Proveedores</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={() => setHistorialOpen(true)}
          >
            Historial de Pedidos
          </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Nuevo Proveedor
        </Button>
        </Box>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BusinessIcon color="primary" />
                <Typography variant="caption" color="text.secondary">Total Proveedores</Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold">{estadisticas.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EmailIcon color="success" />
                <Typography variant="caption" color="text.secondary">Con Email</Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {estadisticas.conEmail}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PhoneIcon color="info" />
                <Typography variant="caption" color="text.secondary">Con Teléfono</Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold" color="info.main">
                {estadisticas.conTelefono}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros y búsqueda */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, RUT, contacto, email o teléfono..."
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
            Mostrando {filteredProveedores.length} de {proveedoresList.length} proveedores
          </Typography>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'nombre'}
                  direction={orderBy === 'nombre' ? orderDirection : 'asc'}
                  onClick={() => handleSort('nombre')}
                >
                  Nombre
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'telefono'}
                  direction={orderBy === 'telefono' ? orderDirection : 'asc'}
                  onClick={() => handleSort('telefono')}
                >
                  Teléfono
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'email'}
                  direction={orderBy === 'email' ? orderDirection : 'asc'}
                  onClick={() => handleSort('email')}
                >
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Cantidad de Productos</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProveedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No se encontraron proveedores
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredProveedores.map((proveedor) => (
                <TableRow key={proveedor.id} hover>
                <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {proveedor.nombre}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {proveedor.telefono ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{proveedor.telefono}</Typography>
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {proveedor.email ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {proveedor.email}
                        </Typography>
                      </Box>
                    ) : (
                      <Chip label="Sin email" size="small" color="warning" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <InventoryIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight="medium">
                        {cantidadProductosPorProveedor[proveedor.id] || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Ver Información Completa">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(proveedor)}
                          color="info"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {proveedor.email && (
                        <Tooltip title="Enviar Pedido">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenPedido(proveedor)}
                            color="primary"
                          >
                            <ShippingIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Editar">
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(proveedor)}
                          color="primary"
                  >
                          <EditIcon fontSize="small" />
                  </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(proveedor)}
                            color="error"
                            disabled={deletingId === proveedor.id || deleteMutation.isLoading}
                          >
                            {deletingId === proveedor.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <DeleteIcon fontSize="small" />
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

      {/* Dialog para crear/editar proveedor */}
      <Dialog 
        open={open} 
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="RUT"
                  value={formData.rut}
                  onChange={(e) =>
                    setFormData({ ...formData, rut: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contacto"
                  value={formData.contacto}
                  onChange={(e) =>
                    setFormData({ ...formData, contacto: e.target.value })
                  }
                  placeholder="Nombre de la persona de contacto"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  type="tel"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  helperText="Necesario para enviar pedidos por correo"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                  multiline
                  rows={2}
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
              ) : editingProveedor ? (
                'Actualizar'
              ) : (
                'Crear'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog para enviar pedido por correo */}
      <Dialog
        open={pedidoOpen}
        onClose={handleClosePedido}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Enviar Pedido a {proveedorPedido?.nombre}
        </DialogTitle>
        <DialogContent>
          {proveedorPedido && !proveedorPedido.email && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Este proveedor no tiene un correo electrónico registrado. Por favor, edite el proveedor y agregue un email.
            </Alert>
          )}
          
          {proveedorPedido && proveedorPedido.email && (
            <Alert severity="info" sx={{ mb: 2 }}>
              El correo se enviará a: <strong>{proveedorPedido.email}</strong>
            </Alert>
          )}

          {pedidoError && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              onClose={() => setPedidoError(null)}
            >
              <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-line' }}>
                {pedidoError}
              </Typography>
              {pedidoError.includes('autenticación') || pedidoError.includes('App Password') || pedidoError.includes('contraseña de aplicación') ? (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" component="div">
                    <strong>Nota:</strong> Consulta el archivo <code>CONFIGURACION_EMAIL.md</code> en la carpeta backend para más detalles.
                  </Typography>
    </Box>
              ) : null}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Productos del Pedido
              </Typography>
            </Grid>

            <Grid item xs={12} sm={7}>
              <FormControl fullWidth size="small">
                <InputLabel>Producto</InputLabel>
                <Select
                  value={currentPedidoItem.producto}
                  label="Producto"
                  onChange={(e) =>
                    setCurrentPedidoItem({ ...currentPedidoItem, producto: e.target.value })
                  }
                  disabled={!proveedorPedido?.email}
                >
                  <MenuItem value="">Seleccionar producto</MenuItem>
                  {productosProveedor.length > 0 ? (
                    productosProveedor.map((prod) => (
                      <MenuItem key={prod.id} value={prod.id}>
                        {prod.codigo} - {prod.nombre}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      {proveedorPedido 
                        ? 'No hay productos asociados a este proveedor'
                        : 'Seleccione un proveedor'}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Cantidad"
                type="number"
                value={currentPedidoItem.cantidad}
                onChange={(e) =>
                  setCurrentPedidoItem({ ...currentPedidoItem, cantidad: e.target.value })
                }
                inputProps={{ min: '1' }}
                disabled={!proveedorPedido?.email}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleAddPedidoItem}
                disabled={!currentPedidoItem.producto || !proveedorPedido?.email}
                sx={{ height: '40px' }}
              >
                Agregar
              </Button>
            </Grid>

            {pedidoData.items.length > 0 && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Productos en el Pedido:
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell align="right">Cantidad</TableCell>
                        <TableCell align="center" width="50px">Acción</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pedidoData.items.map((item, index) => (
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
                              onChange={(e) => handleUpdatePedidoItem(index, e.target.value)}
                              inputProps={{ min: '1', style: { textAlign: 'right', width: '60px' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleRemovePedidoItem(index)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha Estimada de Entrega"
                type="date"
                value={pedidoData.fecha_estimada}
                onChange={(e) =>
                  setPedidoData({ ...pedidoData, fecha_estimada: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                disabled={!proveedorPedido?.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas Adicionales"
                value={pedidoData.notas}
                onChange={(e) =>
                  setPedidoData({ ...pedidoData, notas: e.target.value })
                }
                multiline
                rows={3}
                placeholder="Información adicional sobre el pedido..."
                disabled={!proveedorPedido?.email}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePedido}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleEnviarPedido}
            disabled={
              !proveedorPedido?.email ||
              pedidoData.items.length === 0 ||
              enviarPedidoMutation.isLoading
            }
            startIcon={<EmailIcon />}
          >
            {enviarPedidoMutation.isLoading ? (
              <CircularProgress size={24} />
            ) : (
              'Enviar Pedido por Correo'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver información completa del proveedor */}
      <Dialog
        open={detailOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Información Completa del Proveedor
        </DialogTitle>
        <DialogContent>
          {selectedProveedor && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedProveedor.nombre}
                </Typography>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  RUT
                </Typography>
                <Typography variant="body1">
                  {selectedProveedor.rut || '-'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Contacto
                </Typography>
                <Typography variant="body1">
                  {selectedProveedor.contacto || '-'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneIcon fontSize="small" />
                    Teléfono
                  </Box>
                </Typography>
                <Typography variant="body1">
                  {selectedProveedor.telefono || '-'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailIcon fontSize="small" />
                    Email
                  </Box>
                </Typography>
                <Typography variant="body1">
                  {selectedProveedor.email || (
                    <Chip label="Sin email" size="small" color="warning" variant="outlined" />
                  )}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <BusinessIcon fontSize="small" />
                    Dirección
                  </Box>
                </Typography>
                <Typography variant="body1">
                  {selectedProveedor.direccion || '-'}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <InventoryIcon fontSize="small" />
                    Cantidad de Productos
                  </Box>
                </Typography>
                <Typography variant="h6" color="primary">
                  {cantidadProductosPorProveedor[selectedProveedor.id] || 0} producto(s)
                </Typography>
              </Grid>
              
              {cantidadProductosPorProveedor[selectedProveedor.id] > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Productos Asociados:
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Código</TableCell>
                        <TableCell>Nombre</TableCell>
                        <TableCell align="right">Stock</TableCell>
                        <TableCell align="right">Precio</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productos?.data?.results
                        ?.filter(prod => {
                          const prodProveedorId = prod.proveedor 
                            ? (typeof prod.proveedor === 'object' ? prod.proveedor.id : parseInt(prod.proveedor))
                            : null;
                          return prodProveedorId === selectedProveedor.id;
                        })
                        .map((prod) => (
                          <TableRow key={prod.id}>
                            <TableCell>{prod.codigo}</TableCell>
                            <TableCell>{prod.nombre}</TableCell>
                            <TableCell align="right">{prod.stock_actual || 0}</TableCell>
                            <TableCell align="right">
                              ${prod.precio_venta ? Math.round(prod.precio_venta).toLocaleString('es-CL') : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Historial de Pedidos */}
      <Dialog
        open={historialOpen}
        onClose={() => setHistorialOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Historial de Pedidos a Proveedores</Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<FileDownloadIcon />}
              onClick={async () => {
                try {
                  const response = await proveedoresService.exportarHistorialExcel({
                    proveedor: filtroProveedor || undefined,
                    estado: filtroEstado || undefined,
                  });
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `historial_pedidos_${new Date().toISOString().split('T')[0]}.xlsx`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  setSnackbar({
                    open: true,
                    message: 'Historial exportado exitosamente',
                    severity: 'success',
                  });
                } catch (error) {
                  setSnackbar({
                    open: true,
                    message: 'Error al exportar el historial',
                    severity: 'error',
                  });
                }
              }}
            >
              Exportar Excel
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Filtros */}
          <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Filtrar por Proveedor</InputLabel>
                <Select
                  value={filtroProveedor}
                  label="Filtrar por Proveedor"
                  onChange={(e) => setFiltroProveedor(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {proveedoresList.map((prov) => (
                    <MenuItem key={prov.id} value={prov.id}>
                      {prov.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Filtrar por Estado</InputLabel>
                <Select
                  value={filtroEstado}
                  label="Filtrar por Estado"
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="ENVIADO">Enviado</MenuItem>
                  <MenuItem value="CONFIRMADO">Confirmado</MenuItem>
                  <MenuItem value="EN_TRANSITO">En Tránsito</MenuItem>
                  <MenuItem value="RECIBIDO">Recibido</MenuItem>
                  <MenuItem value="CANCELADO">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Tabla de Historial */}
          {isLoadingHistorial ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : historialError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error al cargar el historial: {historialError.message || 'Error desconocido'}
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Fecha Envío</TableCell>
                    <TableCell>Proveedor</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Cant. Productos</TableCell>
                    <TableCell align="center">Total Items</TableCell>
                    <TableCell>Fecha Estimada</TableCell>
                    <TableCell>Usuario</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    // Obtener los resultados - Django REST Framework devuelve {count, next, previous, results}
                    // Axios envuelve la respuesta en .data, así que la estructura es: response.data.results
                    const results = historialData?.data?.results;
                    const pedidos = Array.isArray(results) ? results : [];
                    
                    // Debug temporal
                    if (process.env.NODE_ENV === 'development' && historialData) {
                      console.log('🔍 Debug Historial:');
                      console.log('  historialData:', historialData);
                      console.log('  historialData.data:', historialData?.data);
                      console.log('  historialData.data.results:', historialData?.data?.results);
                      console.log('  pedidos array:', pedidos);
                    }
                    
                    if (pedidos.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={9} align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                              No se encontraron pedidos en el historial
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    
                    return pedidos.map((pedido) => (
                      <TableRow key={pedido.id} hover>
                        <TableCell>{pedido.id}</TableCell>
                        <TableCell>
                          {new Date(pedido.fecha_envio).toLocaleString('es-CL', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>{pedido.proveedor_nombre}</TableCell>
                        <TableCell>{pedido.email_enviado}</TableCell>
                        <TableCell>
                          <Chip
                            label={pedido.estado_display}
                            size="small"
                            color={
                              pedido.estado === 'RECIBIDO' ? 'success' :
                              pedido.estado === 'CONFIRMADO' ? 'info' :
                              pedido.estado === 'EN_TRANSITO' ? 'warning' :
                              pedido.estado === 'CANCELADO' ? 'error' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell align="center">{pedido.cantidad_productos}</TableCell>
                        <TableCell align="center">{pedido.total_items}</TableCell>
                        <TableCell>
                          {pedido.fecha_estimada_entrega
                            ? new Date(pedido.fecha_estimada_entrega).toLocaleDateString('es-CL')
                            : '-'}
                        </TableCell>
                        <TableCell>{pedido.usuario}</TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistorialOpen(false)}>Cerrar</Button>
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

export default Proveedores;
