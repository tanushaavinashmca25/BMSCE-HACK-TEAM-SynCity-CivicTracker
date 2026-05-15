import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { AppConfig } from '../services/types';

let cached: AppConfig | null = null;
const listeners = new Set<(c: AppConfig | null) => void>();

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(cached);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let mounted = true;
    if (!cached) {
      api.config()
        .then((c) => {
          cached = c;
          if (mounted) setConfig(c);
          listeners.forEach((fn) => fn(c));
        })
        .catch((e: any) => mounted && setError(e?.message || 'Failed to load config'))
        .finally(() => mounted && setLoading(false));
    }
    const sub = (c: AppConfig | null) => mounted && setConfig(c);
    listeners.add(sub);
    return () => { mounted = false; listeners.delete(sub); };
  }, []);

  return { config, error, loading };
}
