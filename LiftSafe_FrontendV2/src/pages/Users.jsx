import { useState } from 'react';
import {
  Box, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Avatar, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import PasswordRequirements from '../components/PasswordRequirements';
import { statusColor } from '../utils/statusHelpers';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { useDashboardData } from '../hooks/useDashboardData';
import { fetchUsuarios } from '../services/dashboardService';
import { createUserRequest } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { ADMIN_CREATABLE_ROLES, DOCUMENT_TYPES } from '../config/api';
import { isPasswordValid } from '../utils/passwordValidation';

const emptyForm = {
  name: '',
  email: '',
  role: 'Inspector',
  documentType: 'CC',
  document: '',
  businessName: '',
  phone: '',
  password: '',
  confirm: '',
};

export default function UsersPage() {
  const { user, hasAction } = useAuth();
  const { data: users = [], loading, error, refetch } = useDashboardData(fetchUsuarios);
  const { search, setSearch, page, setPage, paginated, totalCount } = usePaginatedSearch(
    users,
    ['name', 'email', 'role', 'document', 'status', 'phone']
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.document || !form.password) {
      setFormError('Completa los campos obligatorios');
      return;
    }
    if (!isPasswordValid(form.password)) {
      setFormError('La contraseña no cumple los requisitos de seguridad');
      return;
    }
    if (form.password !== form.confirm) {
      setFormError('Las contraseñas no coinciden');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await createUserRequest(form, user.token);
      setDialogOpen(false);
      setForm(emptyForm);
      refetch();
    } catch (err) {
      setFormError(err.message || 'No se pudo crear el usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Usuarios" subtitle="Gestión de usuarios del sistema (solo administrador)" breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Usuarios' }]} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar usuario..." />
        {hasAction('createUser') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>Nuevo usuario</Button>
        )}
      </Box>
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Usuario</strong></TableCell>
                      <TableCell><strong>Correo</strong></TableCell>
                      <TableCell><strong>Documento</strong></TableCell>
                      <TableCell><strong>Rol</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.map((u) => (
                      <TableRow key={u.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{u.name?.charAt(0) || '?'}</Avatar>
                            {u.name || 'Sin nombre'}
                          </Box>
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.document || '—'}</TableCell>
                        <TableCell><Chip label={u.role} size="small" color={u.role === 'Administrador' ? 'primary' : 'default'} variant="outlined" /></TableCell>
                        <TableCell><Chip label={u.status} color={statusColor[u.status] || 'default'} size="small" /></TableCell>
                      </TableRow>
                    ))}
                    {!paginated.length && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No hay usuarios registrados</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <ListPagination count={totalCount} page={page} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Crear usuario</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Nombre completo" name="name" value={form.name} onChange={handleChange} fullWidth />
            <TextField label="Correo electrónico" name="email" type="email" value={form.email} onChange={handleChange} fullWidth />
            <TextField select label="Rol" name="role" value={form.role} onChange={handleChange} fullWidth>
              {ADMIN_CREATABLE_ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
            <TextField select label="Tipo de documento" name="documentType" value={form.documentType} onChange={handleChange} fullWidth>
              {DOCUMENT_TYPES.map((doc) => <MenuItem key={doc.value} value={doc.value}>{doc.label}</MenuItem>)}
            </TextField>
            <TextField label={form.documentType === 'NIT' ? 'Número de NIT' : 'Número de documento'} name="document" value={form.document} onChange={handleChange} fullWidth />
            {form.documentType === 'NIT' && (
              <TextField label="Razón social" name="businessName" value={form.businessName} onChange={handleChange} fullWidth />
            )}
            <TextField label="Teléfono" name="phone" value={form.phone} onChange={handleChange} fullWidth />
            <TextField label="Contraseña" name="password" type="password" value={form.password} onChange={handleChange} fullWidth />
            <PasswordRequirements password={form.password} />
            <TextField label="Confirmar contraseña" name="confirm" type="password" value={form.confirm} onChange={handleChange} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creando...' : 'Crear usuario'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
