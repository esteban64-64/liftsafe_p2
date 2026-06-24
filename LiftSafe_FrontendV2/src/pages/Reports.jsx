import { Box, Card, CardContent, Typography, Button, Chip, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Alert, CircularProgress } from '@mui/material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { fetchInformes, fetchInspecciones } from '../services/dashboardService';

export default function Reports() {
  const { user } = useAuth();
  const isClient = user?.role === 'Cliente';
  
  // Datos de informes (certificados)
  const { data: docs = [], loading: loadingDocs, error: errorDocs } = useDashboardData(fetchInformes);
  
  // Datos de inspecciones (para pendientes y por vencer)
  const { data: inspecciones = [], loading: loadingInsp, error: errorInsp } = useDashboardData(fetchInspecciones);
  
  const { search, setSearch, page, setPage, paginated, totalCount } = usePaginatedSearch(
    docs,
    ['building', 'elevator', 'inspector', 'status', 'date']
  );

  const loading = loadingDocs || loadingInsp;
  const error = errorDocs || errorInsp;

  // ✅ DATOS REALES calculados desde el frontend
  const certificados = docs.filter(d => d.status === 'Aprobada' || d.status === 'Finalizada').length;
  const pendientes = inspecciones.filter(i => 
    i.status === 'Borrador' || i.status === 'En Proceso' || i.status === 'Programada'
  ).length;
  
  // Por vencer: inspecciones con fecha próxima (dentro de 30 días)
  const hoy = new Date();
  const treintaDias = new Date(hoy.getTime() + (30 * 24 * 60 * 60 * 1000));
  const porVencer = inspecciones.filter(i => {
    if (!i.nextDate) return false;
    const nextDate = new Date(i.nextDate);
    return nextDate <= treintaDias && nextDate >= hoy;
  }).length;

  const summary = {
    certificados: certificados || 0,
    pendientes: pendientes || 0,
    por_vencer: porVencer || 0,
  };

  return (
    <Box>
      <PageHeader
        title={isClient ? 'Mis certificados' : 'Reportes y Certificados'}
        subtitle={isClient ? 'Consulta y descarga los certificados de tus ascensores' : 'Informes técnicos de inspección y certificados emitidos'}
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Reportes' }]}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ mb: 2 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar reporte o certificado..." />
      </Box>

      {/* ✅ RESUMEN HORIZONTAL CON DATOS REALES */}
      {!isClient && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, 
          gap: 2, 
          mb: 3 
        }}>
          {[
            { label: 'Certificados emitidos', value: summary.certificados },
            { label: 'Reportes pendientes', value: summary.pendientes },
            { label: 'Por vencer (30 días)', value: summary.por_vencer },
          ].map((s) => (
            <Box key={s.label} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">{s.value}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* ✅ DOCUMENTOS RECIENTES - ANCHO COMPLETO */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {isClient ? 'Mis certificados' : 'Documentos recientes'}
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              <List>
                {paginated.map((doc) => (
                  <ListItem key={doc.id} divider sx={{ px: 0, flexWrap: 'wrap', gap: 1 }}>
                    <ListItemIcon><PictureAsPdfOutlinedIcon color="error" /></ListItemIcon>
                    <ListItemText
                      primary={`Certificado — ${doc.building}`}
                      secondary={`${doc.elevator} — ${doc.inspector} — ${doc.date}`}
                    />
                    <ListItemSecondaryAction sx={{ position: 'relative', transform: 'none', display: 'flex', gap: 0.5 }}>
                      <Chip label={doc.status} color="success" size="small" />
                      <Button size="small" startIcon={<VisibilityOutlinedIcon />}>Ver</Button>
                      <Button size="small" startIcon={<DownloadOutlinedIcon />}>PDF</Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {!paginated.length && (
                  <Typography color="text.secondary">No hay certificados disponibles</Typography>
                )}
              </List>
              <ListPagination count={totalCount} page={page} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}