import { Box, Button, Alert, CircularProgress } from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ElevatorOutlinedIcon from '@mui/icons-material/ElevatorOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
import ChartCard from '../../components/dashboard/ChartCard';
import ActivityPanel from '../../components/dashboard/ActivityPanel';
import { ComplianceLineChart } from '../../components/dashboard/DashboardCharts';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { fetchAscensores, fetchInformes } from '../../services/dashboardService';

export default function ClientDashboard() {
  const { user } = useAuth();
  const { data: ascensores = [], loading: loadingAsc, error: ascError } = useDashboardData(fetchAscensores);
  const { data: informes = [], loading: loadingInf, error: infError } = useDashboardData(fetchInformes);

  const loading = loadingAsc || loadingInf;
  const error = ascError || infError;

  const certItems = informes.map((c) => ({
    id: c.id,
    title: `${c.elevator} — ${c.building}`,
    subtitle: `${c.id} · ${c.date}`,
    chip: c.status,
    chipColor: 'success',
    type: 'success',
  }));

  const timeline = informes.slice(0, 6).map((item, index) => ({
    month: `Cert ${index + 1}`,
    cumplimiento: 100,
  }));

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard title="Mis ascensores" value={String(ascensores.length)} subtitle="Equipos registrados" icon={<ElevatorOutlinedIcon />} accent="#7C5CBF" />
        <StatCard title="Certificados vigentes" value={String(informes.length)} subtitle="Informes aprobados" icon={<CheckCircleIcon />} accent="#0E7C4A" trend={0} />
        <StatCard title="Reportes disponibles" value={String(informes.length)} subtitle="Listos para consulta" icon={<DescriptionOutlinedIcon />} accent="#0066CC" />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 2.5 }}>
          <ChartCard
            title="Estado de certificaciones"
            subtitle="Certificados aprobados en tu cuenta"
            action={
              <Button component={Link} to="/dashboard/reportes" size="small" variant="contained" startIcon={<VerifiedOutlinedIcon />}>
                Ver reportes
              </Button>
            }
          >
            <ComplianceLineChart data={timeline.length ? timeline : [{ month: 'Sin datos', cumplimiento: 0 }]} />
          </ChartCard>
          <ActivityPanel
            title="Mis certificados"
            subtitle="Documentos vigentes"
            items={certItems}
            accent="#7C5CBF"
            action={<Button component={Link} to="/dashboard/reportes" size="small" variant="outlined">Descargar</Button>}
          />
        </Box>
      )}
    </Box>
  );
}
