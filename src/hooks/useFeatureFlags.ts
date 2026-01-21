import { useMemo } from 'react';

export interface FeatureFlags {
  enableMAIVoices: boolean;
}

/**
 * Hook to parse and manage feature flags from URL parameters
 * Usage: Add ?maivoice=true to the URL to enable MAI voices
 */
export function useFeatureFlags(): FeatureFlags {
  const flags = useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    return {
      enableMAIVoices: params.get('maivoice') === 'true',
    };
  }, []);

  return flags;
}
