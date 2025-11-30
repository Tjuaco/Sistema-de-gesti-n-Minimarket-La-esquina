import React, { useState } from 'react';
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
  Divider,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useThemeSettings } from '../context/ThemeContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login, loginLoading } = useAuth();
  const navigate = useNavigate();
  const { settings } = useThemeSettings();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
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
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {settings.nombreNegocio || 'Minimarket La Esquina'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Iniciar Sesión
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
                autoFocus
                disabled={loginLoading}
              />
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                disabled={loginLoading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${settings.colorPrimario} 0%, #ff6f00 100%)`,
                }}
                disabled={loginLoading}
              >
                {loginLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  ¿No tienes una cuenta?
                </Typography>
                <Button
                  component={Link}
                  to="/registro"
                  fullWidth
                  variant="outlined"
                  sx={{
                    mt: 1,
                    py: 1.5,
                    borderColor: settings.colorPrimario || '#1976d2',
                    color: settings.colorPrimario || '#1976d2',
                    '&:hover': {
                      borderColor: '#ff6f00',
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    },
                  }}
                >
                  Crear Nueva Cuenta
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default Login;

