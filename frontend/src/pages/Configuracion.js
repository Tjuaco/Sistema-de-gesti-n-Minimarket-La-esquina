import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Palette,
  Store,
  Image as ImageIcon,
  Save,
  Refresh,
  LocationOn,
} from '@mui/icons-material';
import { useThemeSettings } from '../context/ThemeContext';
import { configuracionesService } from '../services/configuraciones';

const coloresPredefinidos = [
  // Tonos Verdes
  { nombre: 'Verde Natural', color: '#2e7d32' },
  { nombre: 'Verde Bosque', color: '#1b5e20' },
  { nombre: 'Verde Esmeralda', color: '#388e3c' },
  { nombre: 'Verde Lima', color: '#66bb6a' },
  { nombre: 'Verde Menta', color: '#4caf50' },
  { nombre: 'Verde Oliva', color: '#558b2f' },
  // Tonos Naranjos
  { nombre: 'Naranja Energía', color: '#ff6f00' },
  { nombre: 'Naranja Intenso', color: '#e65100' },
  { nombre: 'Naranja Suave', color: '#ff9800' },
  { nombre: 'Naranja Coral', color: '#ff7043' },
  { nombre: 'Naranja Melocotón', color: '#ffab40' },
  { nombre: 'Naranja Óxido', color: '#f57c00' },
];

function Configuracion() {
  const { settings, updateSettings } = useThemeSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [success, setSuccess] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const queryClient = useQueryClient();

  // Obtener dirección del minimarket
  const { data: direccionData, isLoading: loadingDireccion } = useQuery(
    'direccion-minimarket',
    () => configuracionesService.obtenerDireccion(),
    {
      staleTime: 5 * 60 * 1000,
      onSuccess: (response) => {
        setDireccion(response.data.direccion || '');
      },
    }
  );

  // Mutación para guardar dirección
  const guardarDireccionMutation = useMutation(
    (direccion) => configuracionesService.establecerDireccion(direccion),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('direccion-minimarket');
        setSnackbar({
          open: true,
          message: 'Dirección guardada exitosamente',
          severity: 'success',
        });
      },
      onError: (err) => {
        const errorMessage = err.response?.data?.error || err.message || 'Error al guardar la dirección';
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      },
    }
  );

  const handleChange = (field, value) => {
    setLocalSettings({ ...localSettings, [field]: value });
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleReset = () => {
    const defaultSettings = {
      nombreNegocio: 'La Esquina',
      colorPrimario: '#2e7d32',
      logoUrl: '',
    };
    setLocalSettings(defaultSettings);
    updateSettings(defaultSettings);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('logoUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Configuración y Personalización
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ¡Configuración guardada exitosamente!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Información del Negocio */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Store sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Información del Negocio
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <TextField
              fullWidth
              label="Nombre del Negocio"
              value={localSettings.nombreNegocio}
              onChange={(e) => handleChange('nombreNegocio', e.target.value)}
              sx={{ mb: 3 }}
              variant="outlined"
            />

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Logo del Negocio (Opcional)
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                {localSettings.logoUrl ? (
                  <Avatar
                    src={localSettings.logoUrl}
                    sx={{ width: 80, height: 80 }}
                  />
                ) : (
                  <Avatar sx={{ width: 80, height: 80, bgcolor: 'grey.200' }}>
                    <ImageIcon />
                  </Avatar>
                )}
                <Box>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="logo-upload"
                    type="file"
                    onChange={handleLogoUpload}
                  />
                  <label htmlFor="logo-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<ImageIcon />}
                    >
                      Subir Logo
                    </Button>
                  </label>
                  {localSettings.logoUrl && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => handleChange('logoUrl', '')}
                      sx={{ ml: 1 }}
                    >
                      Eliminar
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Dirección del Minimarket */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Dirección del Minimarket
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Esta dirección se incluirá automáticamente en los correos enviados a proveedores
              </Typography>
              <TextField
                fullWidth
                label="Dirección"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                multiline
                rows={4}
                placeholder="Ej: Calle Principal 123, Comuna, Ciudad, Región"
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={() => guardarDireccionMutation.mutate(direccion)}
                disabled={guardarDireccionMutation.isLoading || loadingDireccion}
              >
                {guardarDireccionMutation.isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  'Guardar Dirección'
                )}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Color Primario */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Palette sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Color Primario del Sistema
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Selecciona un color primario para personalizar el tema del sistema. 
              El color secundario se establecerá automáticamente en tonos naranjos para mantener una apariencia coherente.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="medium" sx={{ mb: 2 }}>
                Colores Predefinidos
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {coloresPredefinidos.map((color) => (
                  <Chip
                    key={color.color}
                    label={color.nombre}
                    onClick={() => handleChange('colorPrimario', color.color)}
                    sx={{
                      bgcolor: color.color,
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 500,
                      '&:hover': {
                        opacity: 0.8,
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s',
                      ...(localSettings.colorPrimario === color.color && {
                        border: '3px solid',
                        borderColor: 'primary.main',
                        transform: 'scale(1.1)',
                      }),
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="medium" sx={{ mb: 2 }}>
                Color Personalizado
              </Typography>
              <TextField
                fullWidth
                type="color"
                label="Seleccionar Color Primario"
                value={localSettings.colorPrimario}
                onChange={(e) => handleChange('colorPrimario', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="El color secundario se ajustará automáticamente a tonos naranjos"
              />
            </Box>

            {/* Vista Previa */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'grey.100',
                mt: 2,
              }}
            >
              <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                Vista Previa:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip
                  label="Color Primario Seleccionado"
                  sx={{
                    bgcolor: localSettings.colorPrimario,
                    color: '#fff',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  El color secundario será naranja automáticamente
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Acciones */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleReset}
              >
                Restaurar Valores por Defecto
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                size="large"
              >
                Guardar Configuración
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

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

export default Configuracion;

