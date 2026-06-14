import { useState } from 'react';
import {
  Box, Card, CardContent, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Typography, Checkbox, FormControlLabel, Divider, Alert, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../components/PageHeader';
import { statusColor } from '../utils/statusHelpers'; // ✅ CAMBIADO: de mockData a utils
import { brand } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { fetchInspecciones } from '../services/dashboardService';

// ✅ Checklist items estáticos (no son datos de demo, es configuración de la app)
const CHECKLIST_CATEGORIES = [
  { category: 'Seguridad', items: ['Frenos de emergencia', 'Paracaídas', 'Límite de velocidad', 'Puertas de cabina'] },
  { category: 'Mecánica', items: ['Cables de tracción', 'Poleas', 'Motor de tracción', 'Sistema de guías'] },
  { category: 'Eléctrica', items: ['Tablero de control', 'Botonera', 'Iluminación de cabina', 'Sistema de alarma'] },
  { category: 'Documentación', items: ['Manual de mantenimiento', 'Registro de revisiones', 'Placa de capacidad', 'Certificado vigente'] },
];

export default function Inspections() {
  const { hasAction } = useAuth();
  const { data: rows = [], loading, error } = useDashboardData(fetchInspecciones);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  return (
    <Box>
      <PageHeader
        title="Inspecciones"
        subtitle="Inspecciones registradas en LiftSafe"
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Inspecciones' }]}
      />
      {hasAction('createInspection') && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Nueva inspección</Button>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Edificio</strong></TableCell>
                    <TableCell><strong>Ascensor</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Inspector</strong></TableCell>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Próxima</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => { setSelected(row); setDetailOpen(true); }}>
                      <TableCell>{row.building}</TableCell>
                      <TableCell>{row.elevator}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>{row.inspector}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.nextDate}</TableCell>
                      <TableCell><Chip label={row.status} color={statusColor[row.status] || 'default'} size="small" /></TableCell>
                    </TableRow>
                  ))}
                  {!rows.length && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">No hay inspecciones registradas</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de nueva inspección - Los edificios y ascensores deben venir de la BD */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Nueva inspección</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* TODO: Estos selects deben cargar edificios y ascensores de la BD */}
            <TextField select label="Edificio" fullWidth defaultValue="">
              <MenuItem value=""><em>Seleccione un edificio</em></MenuItem>
              {/* Cargar dinámicamente desde fetchEdificios */}
            </TextField>
            <TextField select label="Ascensor" fullWidth defaultValue="">
              <MenuItem value=""><em>Seleccione un ascensor</em></MenuItem>
              {/* Cargar dinámicamente según edificio seleccionado */}
            </TextField>
            <TextField select label="Tipo de inspección" fullWidth defaultValue="Periódica">
              <MenuItem value="Anual">Anual</MenuItem>
              <MenuItem value="Periódica">Periódica</MenuItem>
              <MenuItem value="Extraordinaria">Extraordinaria</MenuItem>
            </TextField>
            <TextField label="Fecha programada" type="date" fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Observaciones iniciales" multiline rows={3} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => setOpen(false)}>Crear inspección</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de detalle */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography fontWeight={700}>{selected?.building}</Typography>
          <Typography variant="body2" color="text.secondary">{selected?.elevator} · {selected?.type} · {selected?.inspector}</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <Box><Typography variant="caption" color="text.secondary">Dirección</Typography><Typography variant="body2">{selected?.address}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Marca / Modelo</Typography><Typography variant="body2">{selected?.brand} {selected?.model}</Typography></Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary.dark">Lista de verificación técnica</Typography>
          {CHECKLIST_CATEGORIES.map((cat) => (
            <Box key={cat.category} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: brand.blueDark }}>{cat.category}</Typography>
              {cat.items.map((item) => (
                <FormControlLabel key={item} control={<Checkbox defaultChecked={selected?.status === 'Aprobada'} />} label={item} />
              ))}
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
          <Button variant="outlined">Generar reporte</Button>
          <Button variant="contained">Aprobar inspección</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}