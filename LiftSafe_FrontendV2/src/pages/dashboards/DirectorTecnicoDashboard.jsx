import { Box, Button, Chip, Typography, Alert, CircularProgress } from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
import ChartCard from '../../components/dashboard/ChartCard';
import ActivityPanel from '../../components/dashboard/ActivityPanel';
import { ComplianceLineChart, StatusDonutChart } from '../../components/dashboard/DashboardCharts';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { fetchInspecciones, fetchCharts } from '../../services/dashboardService';

export default function DirectorTecnicoDashboard() {
  const { user } = useAuth();
  const { data: inspecciones = [], loading, error } = useDashboardData(fetchInspecciones);
  const { data: charts } = useDashboardData(fetchCharts);

  const pendingReports = inspecciones.filter((item) => item.status === 'Pendiente');
  const critical = inspecciones.filter((item) => item.status === 'Observaciones');
  const approved = inspecciones.filter((item) => item.status === 'Aprobada');
  const inspectionStatusData = charts?.inspectionStatusData || [];
  const totalReports = inspectionStatusData.reduce((sum, i) => sum + i.value, 0);
  const compliance = totalReports ? Math.round((approved.length / inspecciones.length) * 100) : 0;

  const reportItems = pendingReports.slice(0, 5).map((inf) => ({
    id: inf.id,
    title: `${inf.elevator} — ${inf.building}`,
    subtitle: `Fecha: ${inf.date}`,
    chip: inf.type,
    chipColor: inf.type?.toLowerCase().includes('extra') ? 'error' : 'warning',
    actionBtn: <Button size="small" variant="contained" sx={{ flexShrink: 0 }}>Revisar</Button>,
    type: inf.type?.toLowerCase().includes('extra') ? 'error' : 'warning',
  }));

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard title="Informes pendientes" value={String(pendingReports.length)} subtitle="Requieren revisión" icon={<DescriptionOutlinedIcon />} accent="#7C5CBF" />
        <StatCard title="Observaciones críticas" value={String(critical.length)} subtitle="Sin resolver" icon={<WarningAmberOutlinedIcon />} accent="#C0392B" trend={-8} />
        <StatCard title="Aprobadas" value={String(approved.length)} subtitle="Inspecciones validadas" icon={<VerifiedOutlinedIcon />} accent="#0E7C4A" trend={12} />
        <StatCard title="Cumplimiento normativo" value={`${compliance || 0}%`} subtitle="Indicador de calidad" icon={<RuleOutlinedIcon />} accent="#0066CC" trend={4} />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 2.5, mb: 2.5 }}>
            <ChartCard title="Tendencia de cumplimiento" subtitle="Basado en inspecciones aprobadas">
              <ComplianceLineChart data={(charts?.monthlyInspections || []).map((item) => ({
                month: item.month,
                cumplimiento: item.total ? Math.round((item.aprobadas / item.total) * 100) : 0,
              }))} />
            </ChartCard>
            <ChartCard title="Resultado de inspecciones" subtitle="Distribución actual">
              <StatusDonutChart data={inspectionStatusData} height={220} centerValue={totalReports} centerLabel="Total" />
            </ChartCard>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
            <ActivityPanel
              title="Informes pendientes de aprobación"
              subtitle="Requieren revisión técnica"
              items={reportItems}
              accent="#7C5CBF"
            />

            <Box sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid #C0392B', bgcolor: '#fff', p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Observaciones críticas sin resolver
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Riesgos que requieren atención inmediata
              </Typography>
              {critical.slice(0, 5).map((obs) => (
                <Box key={obs.id} sx={{ mb: 1.5, p: 2, borderRadius: 2, bgcolor: '#C0392B08', border: '1px solid #C0392B22' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{obs.building}</Typography>
                    <Chip label="Alto" color="error" size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">{obs.elevator} · {obs.type} · {obs.inspector}</Typography>
                </Box>
              ))}
              {!critical.length && (
                <Typography color="text.secondary">No hay observaciones críticas pendientes</Typography>
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
