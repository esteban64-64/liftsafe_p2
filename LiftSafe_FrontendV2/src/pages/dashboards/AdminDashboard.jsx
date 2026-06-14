import { Box, Button, Skeleton, Alert } from '@mui/material';
import { People, Elevator, Assignment, Assessment } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
import ChartCard from '../../components/dashboard/ChartCard';
import ActivityPanel from '../../components/dashboard/ActivityPanel';
import { InspectionTrendChart, StatusDonutChart, BuildingBarChart } from '../../components/dashboard/DashboardCharts';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { fetchStats, fetchCharts } from '../../services/dashboardService';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: stats, loading: statsLoading, error: statsError } = useDashboardData(fetchStats);
  const { data: charts, loading: chartsLoading, error: chartsError } = useDashboardData(fetchCharts);

  const loading = statsLoading || chartsLoading;
  const error = statsError || chartsError;

  const statItems = [
    { title: 'Usuarios activos', value: stats?.usuarios ?? 0, icon: <People />, accent: '#0066CC', trend: 8, trendLabel: 'vs. mes anterior' },
    { title: 'Ascensores registrados', value: stats?.ascensores ?? 0, icon: <Elevator />, accent: '#0E7C4A', trend: 4 },
    { title: 'Inspecciones del mes', value: stats?.inspecciones ?? 0, icon: <Assignment />, accent: '#C97B1A', trend: 12 },
    { title: 'Informes emitidos', value: stats?.informes ?? 0, icon: <Assessment />, accent: '#7C5CBF', trend: 6 },
  ];

  const inspectionStatusData = charts?.inspectionStatusData || [];
  const totalStatus = inspectionStatusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={140} sx={{ borderRadius: 3 }} />)
          : statItems.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2.5, mb: 2.5 }}>
        <ChartCard title="Tendencia de inspecciones" subtitle="Histórico desde la base de datos">
          <InspectionTrendChart data={charts?.monthlyInspections || []} />
        </ChartCard>
        <ChartCard title="Estado de inspecciones" subtitle="Distribución actual">
          <StatusDonutChart data={inspectionStatusData} height={240} centerValue={totalStatus} centerLabel="Total" />
        </ChartCard>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
        <ChartCard
          title="Inspecciones por edificio"
          subtitle="Top edificios con mayor actividad"
          action={<Button component={Link} to="/dashboard/edificios" size="small" variant="outlined">Ver edificios</Button>}
        >
          <BuildingBarChart data={charts?.inspectionsByBuilding || []} />
        </ChartCard>
        <ActivityPanel
          title="Actividad reciente"
          subtitle="Últimas acciones en el sistema"
          items={charts?.recentActivity || []}
          accent="#0066CC"
          action={<Button component={Link} to="/dashboard/inspecciones" size="small" variant="outlined">Ver todo</Button>}
        />
      </Box>
    </Box>
  );
}
