import { Box, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, CircularProgress } from '@mui/material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
import ChartCard from '../../components/dashboard/ChartCard';
import { SalesPipelineChart } from '../../components/dashboard/DashboardCharts';
import { salesPipeline } from '../../data/dashboardData';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { fetchEdificios, fetchInspecciones } from '../../services/dashboardService';

export default function AsesorDashboard() {
  const { user } = useAuth();
  const { data: edificios = [], loading: loadingEdificios, error: edificiosError } = useDashboardData(fetchEdificios);
  const { data: inspecciones = [], loading: loadingInspecciones, error: inspeccionesError } = useDashboardData(fetchInspecciones);

  const loading = loadingEdificios || loadingInspecciones;
  const error = edificiosError || inspeccionesError;

  const clientes = edificios.map((edificio) => {
    const pendientes = inspecciones.filter(
      (item) => item.building === edificio.name && item.status === 'Pendiente'
    ).length;
    return {
      id: edificio.id,
      nombre: edificio.name,
      ciudad: edificio.address?.split(',').pop()?.trim() || '-',
      inspeccionesPendientes: pendientes,
      estado: pendientes >= 2 ? 'Urgente' : pendientes === 1 ? 'Seguimiento' : 'Activo',
    };
  });

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard title="Clientes activos" value={String(clientes.length)} subtitle="En cartera comercial" icon={<BusinessOutlinedIcon />} accent="#E65100" trend={6} />
        <StatCard title="Contratos renovados" value={String(inspecciones.filter((i) => i.status === 'Aprobada').length)} subtitle="Inspecciones aprobadas" icon={<TrendingUpIcon />} accent="#0E7C4A" trend={25} />
        <StatCard title="Pendientes" value={String(inspecciones.filter((i) => i.status === 'Pendiente').length)} subtitle="Requieren seguimiento" icon={<EventOutlinedIcon />} accent="#C97B1A" trend={-3} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.4fr' }, gap: 2.5 }}>
        <ChartCard title="Pipeline comercial" subtitle="Clientes por etapa del proceso">
          <SalesPipelineChart data={salesPipeline} />
        </ChartCard>

        <Box sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#fff', overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Box component="span" sx={{ fontWeight: 700, fontSize: 15, color: '#0B1929', display: 'block' }}>Seguimiento a clientes</Box>
              <Box component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>Estado de inspecciones pendientes</Box>
            </Box>
            <Button size="small" variant="outlined">Exportar</Button>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Ciudad</strong></TableCell>
                    <TableCell align="center"><strong>Pendientes</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientes.map((cli) => (
                    <TableRow key={cli.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{cli.nombre}</TableCell>
                      <TableCell>{cli.ciudad}</TableCell>
                      <TableCell align="center">{cli.inspeccionesPendientes}</TableCell>
                      <TableCell>
                        <Chip
                          label={cli.estado}
                          size="small"
                          color={cli.estado === 'Urgente' ? 'error' : cli.estado === 'Seguimiento' ? 'warning' : 'success'}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </Box>
  );
}
