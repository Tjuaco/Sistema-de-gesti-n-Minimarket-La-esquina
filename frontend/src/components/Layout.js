import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Divider,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import BusinessIcon from '@mui/icons-material/Business';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import StoreIcon from '@mui/icons-material/Store';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { useThemeSettings } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AlertasNotificacion from './AlertasNotificacion';

const drawerWidth = 260;

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useThemeSettings();
  const { user, logout, puedeVentas, puedeCompras, puedeProductos, puedeReportes } = useAuth();

  // Construir menú según permisos
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', permission: null },
    { text: 'Productos', icon: <InventoryIcon />, path: '/productos', permission: 'productos' },
    { text: 'Compras', icon: <ShoppingCartIcon />, path: '/compras', permission: 'compras' },
    { text: 'Ventas', icon: <PointOfSaleIcon />, path: '/ventas', permission: 'ventas' },
    { text: 'Proveedores', icon: <BusinessIcon />, path: '/proveedores', permission: null },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/reportes', permission: 'reportes' },
    { text: 'Configuración', icon: <SettingsIcon />, path: '/configuracion', permission: 'productos' },
  ].filter(item => {
    if (!item.permission) return true;
    const permissions = {
      ventas: puedeVentas,
      compras: puedeCompras,
      productos: puedeProductos,
      reportes: puedeReportes,
    };
    return permissions[item.permission];
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    handleMenuClose();
  };

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          background: `linear-gradient(135deg, ${settings.colorPrimario} 0%, #ff6f00 100%)`,
          minHeight: '80px !important',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {settings.logoUrl ? (
            <Avatar
              src={settings.logoUrl}
              sx={{
                width: 56,
                height: 56,
                mb: 1,
                border: '2px solid white',
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 56,
                height: 56,
                mb: 1,
                bgcolor: 'rgba(255,255,255,0.2)',
                border: '2px solid white',
              }}
            >
              <StoreIcon sx={{ fontSize: 32, color: 'white' }} />
            </Avatar>
          )}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              color: 'white',
              fontWeight: 600,
              fontSize: '1rem',
              textAlign: 'center',
            }}
          >
            {settings.nombreNegocio}
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5, px: 1 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            {settings.logoUrl && (
              <Avatar
                src={settings.logoUrl}
                sx={{ width: 32, height: 32 }}
              />
            )}
            <Typography variant="h6" noWrap component="div">
              {settings.nombreNegocio}
            </Typography>
          </Box>
          <AlertasNotificacion />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.username} ({user?.rol_display})
            </Typography>
            <IconButton
              onClick={handleMenuOpen}
              color="inherit"
              size="small"
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">
                  {user?.username} - {user?.rol_display}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default Layout;

