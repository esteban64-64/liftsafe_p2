import { Box, Card, CardContent, Typography, Button, Alert, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ElevatorOutlinedIcon from '@mui/icons-material/ElevatorOutlined';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import { brand } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { fetchEdificios } from '../services/dashboardService';

export default function Buildings() {
  const { hasAction } = useAuth();
  const { data: buildings, loading, error } = useDashboardData(fetchEdificios);
  const edificios = buildings || [];
  const { search, setSearch, page, setPage, paginated, totalCount } = usePaginatedSearch(
    edificios,
    ['name', 'address', 'manager', 'phone', 'status']
  );

  return (
    <Box>
      <PageHeader 
        title="Edificios" 
        subtitle="Edificios registrados en el sistema" 
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Edificios' }]} 
      />
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar edificio..." />
        {hasAction('createBuilding') && (
          <Button variant="contained" startIcon={<AddIcon />}>Agregar edificio</Button>
        )}
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {paginated.length > 0 ? (
              paginated.map((b) => (
                <Card key={b.id || b.name} sx={{ '&:hover': { borderColor: brand.accent } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {b.name || 'Sin nombre'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOnOutlinedIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {b.address || 'Sin dirección'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ElevatorOutlinedIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {b.elevators || 0} ascensores
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <PhoneOutlinedIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {b.manager || 'Sin gestor'} — {b.phone || 'Sin teléfono'}
                      </Typography>
                    </Box>
                    <Button size="small" variant="outlined" fullWidth>
                      Ver detalle
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography color="text.secondary" sx={{ gridColumn: '1 / -1' }}>
                No hay edificios registrados
              </Typography>
            )}
          </Box>
          <ListPagination count={totalCount} page={page} onPageChange={setPage} />
        </>
      )}
    </Box>
  );
}
