import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  MenuItem,
  Grid,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useThemeSettings } from '../context/ThemeContext';
import api from '../services/api';

function Registro() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    rol: 'CAJERO',
    telefono: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { settings } = useThemeSettings();

  // Obtener token CSRF al cargar el componente
  useEffect(() => {
    const getCsrfToken = async () => {
      try {
        await api.get('/usuarios/csrf-token/');
      } catch (err) {
        console.error('Error obteniendo CSRF token:', err);
      }
    };
    getCsrfToken();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validación básica
    if (formData.password !== formData.password_confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      // Enviar todos los datos incluyendo password_confirm (el backend lo requiere)
      const response = await api.post('/usuarios/registro/', formData);

      // Si el registro es exitoso, hacer login automático
      if (response.data.user) {
        await login(formData.username, formData.password);
        navigate('/');
      }
    } catch (err) {
      const errorData = err.response?.data;
      
      // Manejar errores de validación
      if (errorData) {
        if (errorData.username) {
          setError(Array.isArray(errorData.username) ? errorData.username[0] : errorData.username);
        } else if (errorData.email) {
          setError(Array.isArray(errorData.email) ? errorData.email[0] : errorData.email);
        } else if (errorData.password) {
          setError(Array.isArray(errorData.password) ? errorData.password[0] : errorData.password);
        } else if (errorData.password_confirm) {
          setError(Array.isArray(errorData.password_confirm) ? errorData.password_confirm[0] : errorData.password_confirm);
        } else if (errorData.non_field_errors) {
          setError(Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors);
        } else if (errorData.detail) {
          setError(errorData.detail);
        } else {
          setError('Error al registrar usuario. Por favor, verifica los datos.');
        }
      } else {
        setError(err.message || 'Error al registrar usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {settings.nombreNegocio || 'Minimarket La Esquina'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Crear Nueva Cuenta
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Usuario"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Apellido"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Rol"
                    name="rol"
                    value={formData.rol}
                    onChange={handleChange}
                    required
                  >
                    <MenuItem value="CAJERO">Cajero</MenuItem>
                    <MenuItem value="BODEGUERO">Bodeguero</MenuItem>
                    <MenuItem value="ADMINISTRADOR">Administrador</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contraseña"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    helperText="Mínimo 8 caracteres"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirmar Contraseña"
                    name="password_confirm"
                    type="password"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    required
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${settings.colorPrimario} 0%, #ff6f00 100%)`,
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Registrarse'}
              </Button>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    to="/login"
                    style={{
                      color: settings.colorPrimario || '#1976d2',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                    }}
                  >
                    Iniciar Sesión
                  </Link>
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default Registro;

