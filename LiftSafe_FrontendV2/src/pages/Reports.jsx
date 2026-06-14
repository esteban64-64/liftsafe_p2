import { Box, Card, CardContent, Typography, Button, Chip, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Alert, CircularProgress } from '@mui/material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { fetchInformes, fetchCharts } from '../services/dashboardService';

export default function Reports() {
  const { user } = useAuth();
  const isClient = user?.role === 'Cliente';
  const { data: docs = [], loading, error } = useDashboardData(fetchInformes);
  const { data: charts } = useDashboardData(fetchCharts, [isClient]);

  const summary = charts?.reportsSummary || { certificados: 0, pendientes: 0, por_vencer: 0 };

  return (
    <Box>
      <PageHeader
        title={isClient ? 'Mis certificados' : 'Reportes y Certificados'}
        subtitle={isClient ? 'Consulta y descarga los certificados de tus ascensores' : 'Informes técnicos de inspección y certificados emitidos'}
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Reportes' }]}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: isClient ? '1fr' : '1fr 2fr' }, gap: 3 }}>
        {!isClient && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Resumen</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
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
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {isClient ? 'Mis certificados' : 'Documentos recientes'}
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
              <List>
                {docs.map((doc) => (
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
                {!docs.length && (
                  <Typography color="text.secondary">No hay certificados disponibles</Typography>
                )}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
