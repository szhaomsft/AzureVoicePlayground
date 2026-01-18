import { useState, useEffect } from 'react';
import { AzureSettings } from '../types/azure';

const STORAGE_KEY = 'azure-tts-settings';

const DEFAULT_SETTINGS: AzureSettings = {
  apiKey: '',
  region: 'eastus',
  selectedVoice: 'en-US-JennyNeural',
};

export function useSettings() {
  const [settings, setSettings] = useState<AzureSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  const updateSettings = (partial: Partial<AzureSettings>) => {
    console.log('useSettings: Updating settings with:', partial);
    setSettings((prev) => {
      const newSettings = { ...prev, ...partial };
      console.log('useSettings: New settings will be:', newSettings);
      return newSettings;
    });
  };

  const isConfigured = settings.apiKey.length > 0 && settings.region.length > 0;

  return {
    settings,
    updateSettings,
    isConfigured,
  };
}
