import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Grid,
  Tabs,
  Tab,
  MenuItem,
  CircularProgress,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Store,
  ShoppingCart,
  Inventory,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useThemeSettings } from '../context/ThemeContext';
import api from '../services/api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function Inicio() {
  const [tabValue, setTabValue] = useState(0);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
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
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const { settings } = useThemeSettings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Obtener token CSRF al cargar el componente (solo si es necesario)
  // Se obtendrá automáticamente cuando se haga una petición POST/PUT/DELETE
  // No es necesario obtenerlo aquí, evitando errores de conexión innecesarios
  // useEffect(() => {
  //   const getCsrfToken = async () => {
  //     try {
  //       await api.get('/usuarios/csrf-token/');
  //     } catch (err) {
  //       // Silenciar errores de conexión - son esperados si el backend no está disponible
  //     }
  //   };
  //   getCsrfToken();
  // }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError(null);
  };

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoginLoading(true);

    try {
      await login(loginData.username, loginData.password);
      navigate('/');
    } catch (err) {
      // Detectar errores de conexión y mostrar mensaje más claro
      if (err?.code === 'ERR_NETWORK' || err?.code === 'ERR_CONNECTION_REFUSED' || err?.message === 'Network Error') {
        setError('No se puede conectar con el servidor. Por favor, verifica que el backend esté corriendo en http://localhost:8000');
      } else if (err?.response?.status === 401) {
        setError('Usuario o contraseña incorrectos');
      } else if (err?.response?.status === 400) {
        const errorData = err.response.data;
        if (errorData.non_field_errors) {
          setError(Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors);
        } else {
          setError(err.message || 'Error al iniciar sesión. Por favor, verifica tus credenciales.');
        }
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    // Validación básica
    if (registerData.password !== registerData.password_confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (registerData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setRegisterLoading(true);
    try {
      const response = await api.post('/usuarios/registro/', registerData);

      if (response.data.user) {
        await login(registerData.username, registerData.password);
        navigate('/');
      }
    } catch (err) {
      // Detectar errores de conexión y mostrar mensaje más claro
      if (err?.code === 'ERR_NETWORK' || err?.code === 'ERR_CONNECTION_REFUSED' || err?.message === 'Network Error') {
        setError('No se puede conectar con el servidor. Por favor, verifica que el backend esté corriendo en http://localhost:8000');
        setRegisterLoading(false);
        return;
      }
      
      const errorData = err.response?.data;
      
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
        // Si no hay errorData, puede ser un error de conexión
        if (err?.code === 'ERR_NETWORK' || err?.code === 'ERR_CONNECTION_REFUSED' || err?.message === 'Network Error') {
          setError('No se puede conectar con el servidor. Por favor, verifica que el backend esté corriendo en http://localhost:8000');
        } else {
          setError(err.message || 'Error al registrar usuario');
        }
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${settings.colorPrimario}15 0%, #ff6f0015 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Patrón de fondo decorativo */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          backgroundImage: `radial-gradient(circle at 2px 2px, ${settings.colorPrimario} 1px, transparent 0)`,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center">
          {/* Columna izquierda - Información y galería */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                textAlign: isMobile ? 'center' : 'left',
                mb: 4,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', mb: 3 }}>
                <Store
                  sx={{
                    fontSize: 48,
                    color: settings.colorPrimario,
                    mr: 2,
                  }}
                />
                <Typography
                  variant="h3"
                  fontWeight="bold"
                  sx={{
                    background: `linear-gradient(135deg, ${settings.colorPrimario} 0%, #ff6f00 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {settings.nombreNegocio || 'Minimarket La Esquina'}
                </Typography>
              </Box>

              <Typography variant="h5" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Sistema de Gestión Integral
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '500px', mx: isMobile ? 'auto' : 0 }}>
                Administra tu negocio de manera eficiente. Control de inventario, ventas, compras y reportes en un solo lugar.
              </Typography>

              {/* Características */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                    }}
                  >
                    <ShoppingCart sx={{ color: settings.colorPrimario, mb: 1 }} />
                    <Typography variant="caption" fontWeight="bold">
                      Ventas
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                    }}
                  >
                    <Inventory sx={{ color: settings.colorPrimario, mb: 1 }} />
                    <Typography variant="caption" fontWeight="bold">
                      Inventario
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                    }}
                  >
                    <Store sx={{ color: settings.colorPrimario, mb: 1 }} />
                    <Typography variant="caption" fontWeight="bold">
                      Compras
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                    }}
                  >
                    <TrendingUp sx={{ color: settings.colorPrimario, mb: 1 }} />
                    <Typography variant="caption" fontWeight="bold">
                      Reportes
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Galería de imágenes del minimarket */}
              <Box
                sx={{
                  mt: 4,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 2,
                  maxWidth: '500px',
                  mx: isMobile ? 'auto' : 0,
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    aspectRatio: '1',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'rgba(255, 255, 255, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: imageErrors['minimarket-1'] ? 'none' : 'url(/images/minimarket-1.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: imageErrors['minimarket-1'] ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  <img
                    src="/images/minimarket-1.jpg"
                    alt="Minimarket"
                    style={{ display: 'none' }}
                    onError={() => setImageErrors(prev => ({ ...prev, 'minimarket-1': true }))}
                    onLoad={() => setImageErrors(prev => ({ ...prev, 'minimarket-1': false }))}
                  />
                  {imageErrors['minimarket-1'] && (
                    <Store sx={{ fontSize: 48, color: settings.colorPrimario, opacity: 0.3, position: 'relative', zIndex: 1 }} />
                  )}
                </Paper>
                <Paper
                  elevation={0}
                  sx={{
                    aspectRatio: '1',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'rgba(255, 255, 255, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: imageErrors['minimarket-2'] ? 'none' : 'url(/images/minimarket-2.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: imageErrors['minimarket-2'] ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  <img
                    src="/images/minimarket-2.jpg"
                    alt="Minimarket"
                    style={{ display: 'none' }}
                    onError={() => setImageErrors(prev => ({ ...prev, 'minimarket-2': true }))}
                    onLoad={() => setImageErrors(prev => ({ ...prev, 'minimarket-2': false }))}
                  />
                  {imageErrors['minimarket-2'] && (
                    <Store sx={{ fontSize: 48, color: settings.colorPrimario, opacity: 0.3, position: 'relative', zIndex: 1 }} />
                  )}
                </Paper>
                <Paper
                  elevation={0}
                  sx={{
                    gridColumn: 'span 2',
                    aspectRatio: '2/1',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'rgba(255, 255, 255, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: imageErrors['minimarket-3'] ? 'none' : 'url(/images/minimarket-3.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: imageErrors['minimarket-3'] ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  <img
                    src="/images/minimarket-3.jpg"
                    alt="Minimarket"
                    style={{ display: 'none' }}
                    onError={() => setImageErrors(prev => ({ ...prev, 'minimarket-3': true }))}
                    onLoad={() => setImageErrors(prev => ({ ...prev, 'minimarket-3': false }))}
                  />
                  {imageErrors['minimarket-3'] && (
                    <Store sx={{ fontSize: 48, color: settings.colorPrimario, opacity: 0.3, position: 'relative', zIndex: 1 }} />
                  )}
                </Paper>
              </Box>
            </Box>
          </Grid>

          {/* Columna derecha - Formularios */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                maxWidth: 500,
                mx: 'auto',
                boxShadow: '0px 8px 32px rgba(0,0,0,0.12)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  bgcolor: settings.colorPrimario,
                  color: 'white',
                  p: 2,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h5" fontWeight="bold">
                  Bienvenido
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Inicia sesión o crea una cuenta
                </Typography>
              </Box>

              <CardContent sx={{ p: 0 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                      },
                      '& .Mui-selected': {
                        color: settings.colorPrimario,
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: settings.colorPrimario,
                        height: 3,
                      },
                    }}
                  >
                    <Tab label="Iniciar Sesión" />
                    <Tab label="Registrarse" />
                  </Tabs>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ m: 3, mb: 0 }}>
                    {error}
                  </Alert>
                )}

                {/* Panel de Login */}
                <TabPanel value={tabValue} index={0}>
                  <Box sx={{ p: 3 }}>
                    <form onSubmit={handleLogin}>
                      <TextField
                        fullWidth
                        label="Usuario"
                        name="username"
                        value={loginData.username}
                        onChange={handleLoginChange}
                        margin="normal"
                        required
                        autoFocus
                        disabled={loginLoading}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Contraseña"
                        name="password"
                        type="password"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        margin="normal"
                        required
                        disabled={loginLoading}
                        sx={{ mb: 2 }}
                      />
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loginLoading}
                        sx={{
                          mt: 2,
                          mb: 2,
                          py: 1.5,
                          background: `linear-gradient(135deg, ${settings.colorPrimario} 0%, #ff6f00 100%)`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${settings.colorPrimario}dd 0%, #ff6f00dd 100%)`,
                          },
                        }}
                      >
                        {loginLoading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          'Iniciar Sesión'
                        )}
                      </Button>
                    </form>
                  </Box>
                </TabPanel>

                {/* Panel de Registro */}
                <TabPanel value={tabValue} index={1}>
                  <Box sx={{ p: 3 }}>
                    <form onSubmit={handleRegister}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Usuario"
                            name="username"
                            value={registerData.username}
                            onChange={handleRegisterChange}
                            required
                            autoFocus
                            disabled={registerLoading}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={registerData.email}
                            onChange={handleRegisterChange}
                            required
                            disabled={registerLoading}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Nombre"
                            name="first_name"
                            value={registerData.first_name}
                            onChange={handleRegisterChange}
                            disabled={registerLoading}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Apellido"
                            name="last_name"
                            value={registerData.last_name}
                            onChange={handleRegisterChange}
                            disabled={registerLoading}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Teléfono"
                            name="telefono"
                            value={registerData.telefono}
                            onChange={handleRegisterChange}
                            disabled={registerLoading}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            select
                            label="Rol"
                            name="rol"
                            value={registerData.rol}
                            onChange={handleRegisterChange}
                            required
                            disabled={registerLoading}
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
                            value={registerData.password}
                            onChange={handleRegisterChange}
                            required
                            disabled={registerLoading}
                            helperText="Mínimo 8 caracteres"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Confirmar Contraseña"
                            name="password_confirm"
                            type="password"
                            value={registerData.password_confirm}
                            onChange={handleRegisterChange}
                            required
                            disabled={registerLoading}
                          />
                        </Grid>
                      </Grid>

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={registerLoading}
                        sx={{
                          mt: 3,
                          mb: 2,
                          py: 1.5,
                          background: `linear-gradient(135deg, ${settings.colorPrimario} 0%, #ff6f00 100%)`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${settings.colorPrimario}dd 0%, #ff6f00dd 100%)`,
                          },
                        }}
                      >
                        {registerLoading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          'Registrarse'
                        )}
                      </Button>
                    </form>
                  </Box>
                </TabPanel>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Inicio;

