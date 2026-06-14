import { useMemo, useState } from 'react';
import { Box, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, InputAdornment, Alert, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PageHeader from '../components/PageHeader';
import { statusColor } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { fetchAscensores } from '../services/dashboardService';

export default function Elevators() {
  const { hasAction } = useAuth();
  const { data: elevators = [], loading, error } = useDashboardData(fetchAscensores);
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    if (!search.trim()) return elevators;
    const term = search.toLowerCase();
    return elevators.filter((row) =>
      [row.id, row.building, row.brand, row.model, row.city].some((value) =>
        String(value || '').toLowerCase().includes(term)
      )
    );
  }, [elevators, search]);

  return (
    <Box>
      <PageHeader
        title="Ascensores"
        subtitle="Inventario y estado operativo desde la base de datos"
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Ascensores' }]}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar ascensor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: 280 }}
        />
        {hasAction('createElevator') && <Button variant="contained" startIcon={<AddIcon />}>Registrar ascensor</Button>}
      </Box>
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Código</strong></TableCell>
                    <TableCell><strong>Edificio</strong></TableCell>
                    <TableCell><strong>Marca / Modelo</strong></TableCell>
                    <TableCell><strong>Pisos</strong></TableCell>
                    <TableCell><strong>Capacidad</strong></TableCell>
                    <TableCell><strong>Última inspección</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Certificado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover sx={{ cursor: 'pointer' }}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.building}</TableCell>
                      <TableCell>{row.brand} {row.model}</TableCell>
                      <TableCell>{row.floors}</TableCell>
                      <TableCell>{row.capacity}</TableCell>
                      <TableCell>{row.lastInspection}</TableCell>
                      <TableCell><Chip label={row.status} color={statusColor[row.status] || 'default'} size="small" /></TableCell>
                      <TableCell>{row.certificate}</TableCell>
                    </TableRow>
                  ))}
                  {!rows.length && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">No hay ascensores registrados</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
