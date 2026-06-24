import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ElevatorOutlinedIcon from '@mui/icons-material/ElevatorOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import { brand } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { fetchEdificios } from '../services/dashboardService';

/**
 * Devuelve la URL de la imagen de comprobante según la dirección del edificio.
 * Agrega aquí las reglas que necesites: puedes usar palabras clave de la dirección,
 * zonas, ciudades, etc.
 *
 * Para agregar nuevas imágenes:
 *   1. Pon el archivo en /public/comprobantes/
 *   2. Agrega una entrada aquí con la palabra clave que aparece en la dirección
 */
function getComprobante(address = '') {
  const addr = address.toLowerCase();

  const rules = [
    { keywords: ['calle 100', 'usaquén', 'cedritos'], image: '/comprobantes/norte.jpg' },
    { keywords: ['chapinero', 'calle 67', 'calle 72'], image: '/comprobantes/chapinero.jpg' },
    { keywords: ['kennedy', 'bosa', 'calle 13'], image: '/comprobantes/suroccidente.jpg' },
    { keywords: ['suba', 'calle 145', 'calle 170'], image: '/comprobantes/suba.jpg' },
    { keywords: ['candelaria', 'cra 7', 'cra 10'], image: '/comprobantes/centro.jpg' },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => addr.includes(kw))) {
      return rule.image;
    }
  }

  // Imagen por defecto si no coincide ninguna dirección
  return '/comprobantes/default.jpg';
}

export default function Buildings() {
  const { hasAction } = useAuth();
  const { data: buildings, loading, error } = useDashboardData(fetchEdificios);
  const edificios = buildings || [];
  const { search, setSearch, page, setPage, paginated, totalCount } = usePaginatedSearch(
    edificios,
    ['name', 'address', 'manager', 'phone', 'status']
  );

  const [comprobanteBuilding, setComprobanteBuilding] = useState(null);

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

                    {/* Botones de acción */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined" fullWidth>
                        Ver detalle
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        startIcon={<ReceiptLongOutlinedIcon />}
                        onClick={() => setComprobanteBuilding(b)}
                        sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                      >
                        Comprobante
                      </Button>
                    </Box>
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

      {/* Modal de comprobante */}
      <Dialog
        open={!!comprobanteBuilding}
        onClose={() => setComprobanteBuilding(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Comprobante — {comprobanteBuilding?.name}
          <IconButton onClick={() => setComprobanteBuilding(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {comprobanteBuilding?.address}
          </Typography>
          <Box
            component="img"
            src={getComprobante(comprobanteBuilding?.address)}
            alt={`Comprobante ${comprobanteBuilding?.name}`}
            onError={(e) => {
              // Si la imagen no existe, muestra un placeholder
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
            sx={{ width: '100%', borderRadius: 2, display: 'block' }}
          />
          {/* Placeholder si la imagen no carga */}
          <Box
            sx={{
              display: 'none',
              width: '100%',
              height: 240,
              borderRadius: 2,
              bgcolor: 'action.hover',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 1,
              color: 'text.secondary',
            }}
          >
            <ReceiptLongOutlinedIcon sx={{ fontSize: 48 }} />
            <Typography variant="body2">
              Imagen de comprobante no disponible para esta dirección
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComprobanteBuilding(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
