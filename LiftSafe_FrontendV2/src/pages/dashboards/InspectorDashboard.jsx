import { Box, Button, Chip, LinearProgress, Typography, Alert, CircularProgress } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
import { statusColor } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { fetchInspecciones } from '../../services/dashboardService';

export default function InspectorDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(fetchInspecciones);
  const myList = Array.isArray(data) ? data : [];

  const completed = myList.filter((i) => i.estado === 'Finalizada' || i.estado === 'Aprobada').length;
  const pending = myList.filter((i) => i.estado === 'Borrador' || i.estado === 'En Proceso').length;

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>No se pudieron cargar los datos del servidor</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard title="Mis inspecciones" value={String(myList.length)} subtitle="Asignadas a ti" icon={<AssignmentIcon />} accent="#0066CC" />
        <StatCard title="Completadas" value={String(completed)} subtitle="Finalizadas" icon={<CheckCircleIcon />} accent="#0E7C4A" />
        <StatCard title="Pendientes" value={String(pending)} subtitle="Por finalizar" icon={<ScheduleIcon />} accent="#C97B1A" />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2.5 }}>
        <Button component={Link} to="/dashboard/inspecciones" variant="contained" startIcon={<AddIcon />}>
          Ver inspecciones
        </Button>
      </Box>

      <Box sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid #0E7C4A', bgcolor: '#fff', p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>Mis inspecciones asignadas</Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : myList.length === 0 ? (
          <Typography color="text.secondary">No tienes inspecciones asignadas</Typography>
        ) : (
          myList.map((row) => (
            <Box key={row.id_inspeccion} sx={{ py: 1.75, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { border: 0 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" fontWeight={600}>
                  Inspección #{row.id_inspeccion} — Ascensor #{row.id_ascensor}
                </Typography>
                <Chip label={row.estado} color={statusColor[row.estado] || 'default'} size="small" />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {row.fecha_inicio ? new Date(row.fecha_inicio).toLocaleDateString('es-CO') : 'Sin fecha'} · {row.observaciones_generales || 'Sin observaciones'}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={row.estado === 'Finalizada' || row.estado === 'Aprobada' ? 100 : 50}
                sx={{ mt: 1.25, height: 6, borderRadius: 3, bgcolor: '#E8EDF2', '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: '#0E7C4A' } }}
              />
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}