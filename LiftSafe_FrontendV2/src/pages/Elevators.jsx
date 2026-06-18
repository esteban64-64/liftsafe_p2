import { Box, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Alert, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import { statusColor } from '../utils/statusHelpers';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { fetchAscensores } from '../services/dashboardService';

export default function Elevators() {
  const { hasAction } = useAuth();
  const { data: elevators = [], loading, error } = useDashboardData(fetchAscensores);
  const { search, setSearch, page, setPage, paginated, totalCount } = usePaginatedSearch(
    elevators,
    ['building', 'brand', 'model', 'city', 'location', 'status']
  );

  return (
    <Box>
      <PageHeader
        title="Ascensores"
        subtitle="Inventario y estado operativo desde la base de datos"
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Ascensores' }]}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar ascensor..." />
        {hasAction('createElevator') && <Button variant="contained" startIcon={<AddIcon />}>Registrar ascensor</Button>}
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
                      <TableCell><strong>Edificio</strong></TableCell>
                      <TableCell><strong>Marca / Modelo</strong></TableCell>
                      <TableCell><strong>Ubicación</strong></TableCell>
                      <TableCell><strong>Pisos</strong></TableCell>
                      <TableCell><strong>Capacidad</strong></TableCell>
                      <TableCell><strong>Última inspección</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.map((row) => (
                      <TableRow key={row.id} hover sx={{ cursor: 'pointer' }}>
                        <TableCell>{row.building}</TableCell>
                        <TableCell>{row.brand} {row.model}</TableCell>
                        <TableCell>{row.location || row.city}</TableCell>
                        <TableCell>{row.floors}</TableCell>
                        <TableCell>{row.capacity ? `${row.capacity} kg` : '—'}</TableCell>
                        <TableCell>{row.lastInspection}</TableCell>
                        <TableCell><Chip label={row.status} color={statusColor[row.status] || 'default'} size="small" /></TableCell>
                      </TableRow>
                    ))}
                    {!paginated.length && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No hay ascensores registrados</TableCell>
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
    </Box>
  );
}
