import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton, Button, useTheme } from '@mui/material';
import { Brightness7, Brightness4, Home, Map, Settings, Download } from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSettingsStore, useAuthStore } from '@/store';
import { useState } from 'react';
import LoginDialog from './LoginDialog';

const Navigation = () => {
  const theme = useTheme();
  const location = useLocation();
  const { theme: currentTheme, toggleTheme } = useSettingsStore();
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  const navItems = [
    { label: 'Карта', path: '/', icon: <Map /> },
    { label: 'Парсер', path: '/parser', icon: <Download /> },
    { label: 'Настройки', path: '/settings', icon: <Settings /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ gap: 2 }}>
        <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <Home sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            Hata
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {navItems.map((item) => (
          <Button
            key={item.path}
            color="inherit"
            component={Link}
            to={item.path}
            startIcon={item.icon}
            sx={{
              opacity: location.pathname === item.path ? 1 : 0.7,
              borderBottom: location.pathname === item.path ? '2px solid currentColor' : 'none',
              borderRadius: 0,
            }}
          >
            {item.label}
          </Button>
        ))}

        <IconButton onClick={toggleTheme} color="inherit">
          {currentTheme === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>

        {isAuthenticated ? (
          <>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {user?.email}
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Выйти
            </Button>
          </>
        ) : (
          <Button color="inherit" onClick={() => setLoginOpen(true)}>
            Войти
          </Button>
        )}
      </Toolbar>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </AppBar>
  );
};

const Layout = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
