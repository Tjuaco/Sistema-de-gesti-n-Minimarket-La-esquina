import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';

const ThemeContext = createContext();

const defaultSettings = {
  nombreNegocio: 'La Esquina',
  colorPrimario: '#2e7d32', // Verde para minimarket
  logoUrl: '',
};

export const useThemeSettings = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeSettings debe usarse dentro de ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    const savedSettings = localStorage.getItem('minimarket-theme-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Eliminar colorSecundario si existe en la configuración guardada
        if (parsed.colorSecundario) {
          delete parsed.colorSecundario;
        }
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      }
    }
  }, []);

  // Guardar configuración cuando cambia
  useEffect(() => {
    localStorage.setItem('minimarket-theme-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings) => {
    // Asegurar que colorSecundario siempre sea naranja
    const updatedSettings = { ...newSettings };
    if (updatedSettings.colorSecundario) {
      delete updatedSettings.colorSecundario; // Eliminar si se intenta cambiar
    }
    setSettings((prev) => ({ ...prev, ...updatedSettings }));
  };

  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: settings.colorPrimario,
        light: lightenColor(settings.colorPrimario, 20),
        dark: darkenColor(settings.colorPrimario, 20),
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#ff6f00', // Naranja fijo como secundario
        light: lightenColor('#ff6f00', 20),
        dark: darkenColor('#ff6f00', 20),
        contrastText: '#ffffff',
      },
      background: {
        default: '#f8f9fa',
        paper: '#ffffff',
      },
      text: {
        primary: 'rgba(0, 0, 0, 0.87)',
        secondary: 'rgba(0, 0, 0, 0.6)',
      },
    },
    typography: {
      fontFamily: [
        'Roboto',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Arial',
        'sans-serif',
      ].join(','),
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none', // 0
      '0px 2px 4px rgba(0,0,0,0.08)', // 1
      '0px 4px 8px rgba(0,0,0,0.12)', // 2
      '0px 8px 16px rgba(0,0,0,0.16)', // 3
      '0px 12px 24px rgba(0,0,0,0.20)', // 4
      '0px 16px 32px rgba(0,0,0,0.24)', // 5
      '0px 20px 40px rgba(0,0,0,0.28)', // 6
      '0px 24px 48px rgba(0,0,0,0.32)', // 7
      '0px 28px 56px rgba(0,0,0,0.36)', // 8
      '0px 32px 64px rgba(0,0,0,0.40)', // 9
      '0px 36px 72px rgba(0,0,0,0.44)', // 10
      '0px 40px 80px rgba(0,0,0,0.48)', // 11
      '0px 44px 88px rgba(0,0,0,0.52)', // 12
      '0px 48px 96px rgba(0,0,0,0.56)', // 13
      '0px 52px 104px rgba(0,0,0,0.60)', // 14
      '0px 56px 112px rgba(0,0,0,0.64)', // 15
      '0px 60px 120px rgba(0,0,0,0.68)', // 16
      '0px 64px 128px rgba(0,0,0,0.72)', // 17
      '0px 68px 136px rgba(0,0,0,0.76)', // 18
      '0px 72px 144px rgba(0,0,0,0.80)', // 19
      '0px 76px 152px rgba(0,0,0,0.84)', // 20
      '0px 80px 160px rgba(0,0,0,0.88)', // 21
      '0px 84px 168px rgba(0,0,0,0.92)', // 22
      '0px 88px 176px rgba(0,0,0,0.96)', // 23
      '0px 92px 184px rgba(0,0,0,1.00)', // 24
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontWeight: 500,
            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0px 4px 8px rgba(0,0,0,0.15)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
          },
          elevation1: {
            boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
          },
          elevation2: {
            boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0px 8px 16px rgba(0,0,0,0.15)',
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Funciones auxiliares para aclarar/oscurecer colores
function lightenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(255 * percent / 100);
  const R = Math.min(255, ((num >> 16) & 0xff) + amt);
  const G = Math.min(255, ((num >> 8) & 0xff) + amt);
  const B = Math.min(255, (num & 0xff) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function darkenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(255 * percent / 100);
  const R = Math.max(0, ((num >> 16) & 0xff) - amt);
  const G = Math.max(0, ((num >> 8) & 0xff) - amt);
  const B = Math.max(0, (num & 0xff) - amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

