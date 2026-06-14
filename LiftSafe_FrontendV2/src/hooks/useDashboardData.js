import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useDashboardData(fetchFunction) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFunction();
        
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error en useDashboardData:', err);
          
          // 🔴 Si el token expiró (401), cerrar sesión y redirigir al login
          if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err.message?.includes('expired')) {
            localStorage.removeItem('liftsafe_token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login', { replace: true });
            return;
          }
          
          setError(err.message || 'Error al cargar datos');
          setData([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [fetchFunction, navigate]);

  return { data, loading, error };
}