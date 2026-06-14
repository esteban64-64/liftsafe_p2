import { useState } from 'react';
import {
  Box, Card, CardContent, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Typography, Checkbox, FormControlLabel, Divider, Alert, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../components/PageHeader';
import { checklistItems, statusColor } from '../data/mockData';
import { brand } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { fetchInspecciones } from '../services/dashboardService';

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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Nueva inspección</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField select label="Edificio" fullWidth defaultValue="">
              <MenuItem value="Torre Central">Torre Central</MenuItem>
              <MenuItem value="Edificio Norte">Edificio Norte</MenuItem>
              <MenuItem value="Plaza Comercial">Plaza Comercial</MenuItem>
            </TextField>
            <TextField select label="Ascensor" fullWidth defaultValue="">
              <MenuItem value="ASC-01">ASC-01</MenuItem>
              <MenuItem value="ASC-02">ASC-02</MenuItem>
              <MenuItem value="ASC-03">ASC-03</MenuItem>
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
          {checklistItems.map((cat) => (
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
