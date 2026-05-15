import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { AppConfig } from '../services/types';
import { APP_NAME } from '../constants/branding';

function withBranding(config: AppConfig): AppConfig {
  return { ...config, app_name: APP_NAME };
}

let cached: AppConfig | null = null;
const listeners = new Set<(c: AppConfig | null) => void>();

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(cached);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let mounted = true;
    if (cached && cached.app_name !== APP_NAME) {
      cached = withBranding(cached);
      if (mounted) setConfig(cached);
    }
    if (!cached) {
      api.config()
        .then((c) => {
          const branded = withBranding(c);
          cached = branded;
          if (mounted) setConfig(branded);
          listeners.forEach((fn) => fn(branded));
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
