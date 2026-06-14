import { useEffect, useState } from 'react';

export function useDashboardData(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await fetcher();
        if (active) setData(result);
      } catch (err) {
        if (active) setError(err.message || 'No se pudieron cargar los datos');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
