import { Box, Button, Alert, Skeleton } from '@mui/material';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import ElevatorOutlinedIcon from '@mui/icons-material/ElevatorOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
import ChartCard from '../../components/dashboard/ChartCard';
import ActivityPanel from '../../components/dashboard/ActivityPanel';
import { InspectionTrendChart } from '../../components/dashboard/DashboardCharts';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { fetchStats, fetchCharts, fetchUsuarios, fetchInspecciones } from '../../services/dashboardService';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: stats, loading: statsLoading, error } = useDashboardData(fetchStats);
  const { data: charts } = useDashboardData(fetchCharts);
  const { data: usuarios = [] } = useDashboardData(fetchUsuarios);
  const { data: inspecciones = [] } = useDashboardData(fetchInspecciones);

  const recentUsers = usuarios.slice(0, 5).map((u) => ({
    id: u.id,
    title: u.name,
    subtitle: u.email,
    chip: u.role,
    chipColor: u.role === 'Administrador' ? 'error' : u.role === 'Cliente' ? 'info' : 'default',
    type: 'info',
  }));

  const recentInspections = inspecciones.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.building,
    subtitle: `${item.elevator} · Inspector: ${item.inspector}`,
    chip: item.status,
    chipColor: item.status === 'Aprobada' ? 'success' : item.status === 'Finalizada' ? 'success' : 'warning',
    type: item.status === 'Aprobada' ? 'success' : 'warning',
  }));

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard title="Usuarios activos" value={String(stats?.usuarios_activos || 0)} subtitle="Registrados" icon={<PeopleOutlinedIcon />} accent="#0066CC" />
        <StatCard title="Ascensores" value={String(stats?.ascensores_registrados || 0)} subtitle="En sistema" icon={<ElevatorOutlinedIcon />} accent="#7C5CBF" />
        <StatCard title="Inspecciones mes" value={String(stats?.inspecciones_mes || 0)} subtitle="Este mes" icon={<AssignmentOutlinedIcon />} accent="#C97B1A" />
        <StatCard title="Informes" value={String(stats?.informes_emitidos || 0)} subtitle="Emitidos" icon={<DescriptionOutlinedIcon />} accent="#0E7C4A" />
      </Box>

      {statsLoading ? (
        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, mb: 2.5 }} />
      ) : (
        <ChartCard title="Tendencia de inspecciones" subtitle="Datos reales del sistema">
          <InspectionTrendChart data={charts?.monthlyInspections || []} />
        </ChartCard>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mt: 2.5 }}>
        <ActivityPanel title="Usuarios recientes" subtitle="Últimos registrados" items={recentUsers} accent="#0066CC" />
        <ActivityPanel title="Inspecciones recientes" subtitle="Actividad del sistema" items={recentInspections} accent="#C97B1A" />
      </Box>
    </Box>
  );
}