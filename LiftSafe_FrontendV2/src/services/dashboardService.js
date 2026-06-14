import { apiGet } from './apiClient';

export const fetchStats = () => apiGet('/dashboard/stats');
export const fetchInspecciones = () => apiGet('/dashboard/inspecciones');
export const fetchAscensores = () => apiGet('/dashboard/ascensores');
export const fetchEdificios = () => apiGet('/dashboard/edificios');
export const fetchUsuarios = () => apiGet('/dashboard/usuarios');
export const fetchInformes = () => apiGet('/dashboard/informes');
export const fetchCharts = () => apiGet('/dashboard/charts');   