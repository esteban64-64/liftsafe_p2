import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextField, Button, Box, Alert, InputAdornment } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import AuthLayout from '../layouts/AuthLayout';
import { brand } from '../theme/colors';
import { recoverPasswordRequest } from '../services/authService';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    bgcolor: 'rgba(255,255,255,0.05)',
    '& fieldset': { borderColor: 'rgba(43,124,184,0.3)' },
    '&:hover fieldset': { borderColor: brand.accent },
    '&.Mui-focused fieldset': { borderColor: brand.accent },
  },
  '& .MuiInputLabel-root': { color: brand.silverDark },
  '& .MuiInputLabel-root.Mui-focused': { color: brand.accent },
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await recoverPasswordRequest(email);
      setMessage(data.message || 'Si el correo existe, recibirás un enlace de recuperación');
    } catch (err) {
      setError(err.message || 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para restablecer tu acceso"
    >
      <Box component="form" onSubmit={handleSubmit}>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 1.5 }}>{message}</Alert>}
        <TextField
          fullWidth size="small" label="Correo electrónico" type="email"
          value={email} onChange={(e) => setEmail(e.target.value)} required
          sx={fieldSx}
          InputProps={{
            startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ color: brand.accent, fontSize: 20 }} /></InputAdornment>
          }}
        />
        <Button
          type="submit" fullWidth variant="contained" size="medium" disabled={loading}
          sx={{
            py: 1.2, mt: 2, mb: 1.5,
            bgcolor: brand.accent, '&:hover': { bgcolor: brand.accentHover || brand.accent },
            boxShadow: '0 4px 20px rgba(43,124,184,0.4)',
          }}
        >
          {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </Button>
        <Box textAlign="center">
          <Link to="/login" style={{ color: brand.accent, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            Volver al inicio de sesión
          </Link>
        </Box>
      </Box>
    </AuthLayout>
  );
}
