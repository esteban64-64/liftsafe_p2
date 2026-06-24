import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Typography, Checkbox, FormControlLabel, Divider, Alert, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import { statusColor } from '../utils/statusHelpers';
import { brand } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { fetchInspecciones, fetchEdificios, fetchAscensores, crearInspeccion } from '../services/dashboardService';

const CHECKLIST_CATEGORIES = [
  { category: 'Seguridad', items: ['Frenos de emergencia', 'Paracaídas', 'Límite de velocidad', 'Puertas de cabina'] },
  { category: 'Mecánica', items: ['Cables de tracción', 'Poleas', 'Motor de tracción', 'Sistema de guías'] },
  { category: 'Eléctrica', items: ['Tablero de control', 'Botonera', 'Iluminación de cabina', 'Sistema de alarma'] },
  { category: 'Documentación', items: ['Manual de mantenimiento', 'Registro de revisiones', 'Placa de capacidad', 'Certificado vigente'] },
];

export default function Inspections() {
  const { hasAction } = useAuth();
  const { data: rows = [], loading, error, refetch } = useDashboardData(fetchInspecciones);
  const { search, setSearch, page, setPage, paginated, totalCount } = usePaginatedSearch(
    rows,
    ['building', 'elevator', 'brand', 'model', 'type', 'inspector', 'status', 'date']
  );
  
  // Estados para el modal de nueva inspección
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  
  // ✅ Estados para edificios y ascensores
  const [edificios, setEdificios] = useState([]);
  const [ascensores, setAscensores] = useState([]);
  const [edificioSeleccionado, setEdificioSeleccionado] = useState('');
  const [ascensorSeleccionado, setAscensorSeleccionado] = useState('');
  const [tipoInspeccion, setTipoInspeccion] = useState('Periódica');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loadingModal, setLoadingModal] = useState(false);

  // ✅ Cargar edificios al abrir el modal
  useEffect(() => {
    if (open) {
      cargarEdificios();
    }
  }, [open]);

  const cargarEdificios = async () => {
    setLoadingModal(true);
    try {
      const data = await fetchEdificios();
      setEdificios(data || []);
    } catch (err) {
      console.error('Error cargando edificios:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  // ✅ Cargar ascensores cuando se selecciona un edificio
  const handleEdificioChange = async (edificioId) => {
    setEdificioSeleccionado(edificioId);
    setAscensorSeleccionado('');
    if (!edificioId) {
      setAscensores([]);
      return;
    }
    
    setLoadingModal(true);
    try {
      const todosAscensores = await fetchAscensores();
      const ascensoresFiltrados = todosAscensores.filter(a => a.building === edificioId);
      setAscensores(ascensoresFiltrados);
    } catch (err) {
      console.error('Error cargando ascensores:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  // ✅ LIMPIAR FORMULARIO - definida ANTES de handleCrearInspeccion
  const limpiarFormulario = () => {
    setEdificioSeleccionado('');
    setAscensorSeleccionado('');
    setTipoInspeccion('Periódica');
    setFechaProgramada('');
    setObservaciones('');
    setAscensores([]);
  };

  // ✅ Crear inspección
  const handleCrearInspeccion = async () => {
    if (!edificioSeleccionado || !ascensorSeleccionado || !fechaProgramada) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }
    
    const ascensor = ascensores.find(a => a.id === ascensorSeleccionado);
    if (!ascensor) {
      alert('Ascensor no válido');
      return;
    }
    
    const data = {
      id_ascensor: parseInt(ascensorSeleccionado),
      id_inspector: 1,
      fecha_programada: fechaProgramada,
      tipo_servicio: tipoInspeccion,
      observaciones: observaciones
    };
    
    try {
      setLoadingModal(true);
      const result = await crearInspeccion(data);
      console.log('Inspección creada:', result);
      
      setOpen(false);
      limpiarFormulario();
      
      // Recargar lista de inspecciones
      if (refetch) refetch();
      
      alert('Inspección creada exitosamente');
    } catch (err) {
      console.error('Error creando inspección:', err);
      alert(err.message || 'Error al crear inspección');
    } finally {
      setLoadingModal(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Inspecciones"
        subtitle="Inspecciones registradas en LiftSafe"
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Inspecciones' }]}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar inspección..." />
        {hasAction('createInspection') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Nueva inspección</Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                    {paginated.map((row) => (
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
                    {!paginated.length && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No hay inspecciones registradas</TableCell>
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

      {/* ✅ MODAL DE NUEVA INSPECCIÓN CON DATOS REALES */}
      <Dialog open={open} onClose={() => { setOpen(false); limpiarFormulario(); }} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Nueva inspección</DialogTitle>
        <DialogContent>
          {loadingModal && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* ✅ Dropdown de Edificios reales */}
            <TextField 
              select 
              label="Edificio" 
              fullWidth 
              value={edificioSeleccionado}
              onChange={(e) => handleEdificioChange(e.target.value)}
              disabled={loadingModal}
            >
              <MenuItem value=""><em>Seleccione un edificio</em></MenuItem>
              {edificios.map((ed) => (
                <MenuItem key={ed.id} value={ed.id}>
                  {ed.name} - {ed.address}
                </MenuItem>
              ))}
            </TextField>

            {/* ✅ Dropdown de Ascensores filtrados por edificio */}
            <TextField 
              select 
              label="Ascensor" 
              fullWidth 
              value={ascensorSeleccionado}
              onChange={(e) => setAscensorSeleccionado(e.target.value)}
              disabled={!edificioSeleccionado || loadingModal}
            >
              <MenuItem value=""><em>Seleccione un ascensor</em></MenuItem>
              {ascensores.map((asc) => (
                <MenuItem key={asc.id} value={asc.id}>
                  {asc.brand} {asc.model} - {asc.type} ({asc.capacity}kg)
                </MenuItem>
              ))}
            </TextField>

            <TextField 
              select 
              label="Tipo de inspección" 
              fullWidth 
              value={tipoInspeccion}
              onChange={(e) => setTipoInspeccion(e.target.value)}
            >
              <MenuItem value="Anual">Anual</MenuItem>
              <MenuItem value="Periódica">Periódica</MenuItem>
              <MenuItem value="Extraordinaria">Extraordinaria</MenuItem>
            </TextField>

            <TextField 
              label="Fecha programada" 
              type="date" 
              fullWidth 
              InputLabelProps={{ shrink: true }}
              value={fechaProgramada}
              onChange={(e) => setFechaProgramada(e.target.value)}
            />

            <TextField 
              label="Observaciones iniciales" 
              multiline 
              rows={3} 
              fullWidth 
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setOpen(false); limpiarFormulario(); }}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleCrearInspeccion}
            disabled={!edificioSeleccionado || !ascensorSeleccionado || !fechaProgramada}
          >
            Crear inspección
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography fontWeight={700}>{selected?.building}</Typography>
          <Typography variant="body2" color="text.secondary">{selected?.elevator} · {selected?.type} · {selected?.inspector}</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <Box><Typography variant="caption" color="text.secondary">Dirección</Typography><Typography variant="body2">{selected?.building}</Typography></Box>
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