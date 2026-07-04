import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { authApi } from '@/api';
import { useAuthStore } from '@/store';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

const LoginDialog = ({ open, onClose }: LoginDialogProps) => {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { setUser, setToken } = useAuthStore();

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await authApi.login({ email, password });
      setToken(token);
      const user = await authApi.getMe();
      setUser(user);
      onClose();
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      await authApi.register({ email, password, username, full_name: fullName });
      // Auto login after registration
      const token = await authApi.login({ email, password });
      setToken(token);
      const user = await authApi.getMe();
      setUser(user);
      onClose();
    } catch {
      setError('Ошибка регистрации. Возможно, email уже занят.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setFullName('');
    setError(null);
    setTab(0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Вход" />
          <Tab label="Регистрация" />
        </Tabs>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
          />

          {tab === 1 && (
            <>
              <TextField
                label="Имя пользователя (опционально)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
              />
              <TextField
                label="Полное имя (опционально)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                fullWidth
              />
            </>
          )}

          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            helperText={tab === 1 ? 'Минимум 8 символов' : undefined}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Отмена</Button>
        <Button
          variant="contained"
          onClick={tab === 0 ? handleLogin : handleRegister}
          disabled={loading || !email || !password}
        >
          {tab === 0 ? 'Войти' : 'Зарегистрироваться'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginDialog;
