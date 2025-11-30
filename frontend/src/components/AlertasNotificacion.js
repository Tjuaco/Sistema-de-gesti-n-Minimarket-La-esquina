import React, { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Badge,
  IconButton,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Button,
  Chip,
  Divider,
  Paper,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { alertasService } from '../services/alertas';

function AlertasNotificacion() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', cantidad: 0 });
  const cantidadAnteriorRef = useRef(0);
  const queryClient = useQueryClient();

  const { data: alertasNoLeidas } = useQuery(
    'alertas-no-leidas',
    () => alertasService.noLeidas(),
    {
      refetchInterval: 15000, // Refrescar cada 15 segundos (más frecuente)
      staleTime: 30 * 1000, // 30 segundos
      retry: 2,
      retryDelay: 1000,
      onError: (error) => {
        console.warn('Error al cargar alertas:', error);
      },
    }
  );

  const { data: cantidadNoLeidas } = useQuery(
    'cantidad-alertas',
    () => alertasService.contarNoLeidas(),
    {
      refetchInterval: 15000, // Refrescar cada 15 segundos
      staleTime: 30 * 1000,
      retry: 2,
      retryDelay: 1000,
      onError: (error) => {
        console.warn('Error al contar alertas:', error);
      },
    }
  );

  // Detectar nuevas alertas y mostrar notificación
  useEffect(() => {
    const cantidadActual = cantidadNoLeidas?.data?.cantidad || 0;
    const cantidadAnterior = cantidadAnteriorRef.current;

    // Si hay nuevas alertas (cantidad aumentó)
    if (cantidadActual > cantidadAnterior && cantidadAnterior > 0) {
      const nuevasAlertas = cantidadActual - cantidadAnterior;
      setSnackbar({
        open: true,
        message: nuevasAlertas === 1 
          ? 'Nueva alerta de stock bajo' 
          : `${nuevasAlertas} nuevas alertas de stock bajo`,
        cantidad: nuevasAlertas,
      });
    }

    // Actualizar referencia
    cantidadAnteriorRef.current = cantidadActual;
  }, [cantidadNoLeidas]);

  const marcarLeidaMutation = useMutation(
    (id) => alertasService.marcarLeida(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('alertas-no-leidas');
        queryClient.invalidateQueries('cantidad-alertas');
      },
    }
  );

  const marcarTodasLeidasMutation = useMutation(
    () => alertasService.marcarTodasLeidas(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('alertas-no-leidas');
        queryClient.invalidateQueries('cantidad-alertas');
      },
    }
  );

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarcarLeida = (id) => {
    marcarLeidaMutation.mutate(id);
  };

  const handleMarcarTodasLeidas = () => {
    marcarTodasLeidasMutation.mutate();
    handleClose();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const open = Boolean(anchorEl);
  const cantidad = cantidadNoLeidas?.data?.cantidad || 0;

  return (
    <>
      <Tooltip title={cantidad > 0 ? `${cantidad} alerta${cantidad > 1 ? 's' : ''} de stock bajo` : 'No hay alertas'}>
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{
            position: 'relative',
            ...(cantidad > 0 && {
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)',
                },
                '70%': {
                  boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)',
                },
                '100%': {
                  boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)',
                },
              },
            }),
          }}
        >
          <Badge 
            badgeContent={cantidad} 
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                height: '20px',
                minWidth: '20px',
                ...(cantidad > 0 && {
                  animation: 'bounce 1s infinite',
                  '@keyframes bounce': {
                    '0%, 100%': {
                      transform: 'translateY(0)',
                    },
                    '50%': {
                      transform: 'translateY(-4px)',
                    },
                  },
                }),
              },
            }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ width: 400, maxHeight: 500, overflow: 'auto' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Alertas de Stock</Typography>
            {cantidad > 0 && (
              <Button size="small" onClick={handleMarcarTodasLeidas}>
                Marcar todas como leídas
              </Button>
            )}
          </Box>
          <Divider />
          {alertasNoLeidas?.data && alertasNoLeidas.data.length > 0 ? (
            <List>
              {alertasNoLeidas.data.map((alerta) => (
                <ListItem
                  key={alerta.id}
                  disablePadding
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleMarcarLeida(alerta.id)}
                      size="small"
                    >
                      ✕
                    </IconButton>
                  }
                >
                  <ListItemButton>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WarningIcon color="warning" fontSize="small" />
                          <Typography variant="body2" fontWeight="bold">
                            {alerta.producto_nombre}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Código: {alerta.producto_codigo}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={`Stock: ${alerta.stock_actual}`}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                            <Chip
                              label={`Mínimo: ${alerta.stock_minimo}`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay alertas pendientes
              </Typography>
            </Box>
          )}
        </Paper>
      </Popover>

      {/* Snackbar para notificaciones de nuevas alertas */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="warning"
          icon={<WarningIcon />}
          sx={{ width: '100%' }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                handleCloseSnackbar();
                // Buscar el botón de notificaciones y abrir el popover
                const notificationButton = document.querySelector('[aria-label*="notificaciones"], [aria-label*="alertas"]');
                if (notificationButton) {
                  handleClick({ currentTarget: notificationButton });
                }
              }}
            >
              Ver
            </Button>
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default AlertasNotificacion;

