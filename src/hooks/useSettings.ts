import { useState, useEffect } from 'react';
import { AzureSettings } from '../types/azure';

const STORAGE_KEY = 'azure-tts-settings';
const API_KEYS_STORAGE_KEY = 'azure-tts-api-keys';

const DEFAULT_SETTINGS: AzureSettings = {
  apiKey: '',
  region: 'eastus',
  selectedVoice: 'en-US-JennyNeural',
};

// Load API keys from localStorage
function loadApiKeys(): Record<string, string> {
  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load API keys from localStorage:', error);
  }
  return {};
}

// Save API keys to localStorage
function saveApiKeys(apiKeys: Record<string, string>) {
  try {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(apiKeys));
  } catch (error) {
    console.error('Failed to save API keys to localStorage:', error);
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AzureSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const apiKeys = loadApiKeys();

      if (stored) {
        const parsedSettings = JSON.parse(stored);
        const region = parsedSettings.region || DEFAULT_SETTINGS.region;
        const apiKey = apiKeys[region] || parsedSettings.apiKey || '';

        return {
          ...DEFAULT_SETTINGS,
          ...parsedSettings,
          apiKey
        };
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      // Save settings without API key
      const { apiKey, ...settingsWithoutKey } = settings;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsWithoutKey));

      // Save API key by region
      if (apiKey) {
        const apiKeys = loadApiKeys();
        apiKeys[settings.region] = apiKey;
        saveApiKeys(apiKeys);
      }
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  const updateSettings = (partial: Partial<AzureSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...partial };

      // If region is changing, load the API key for the new region
      if (partial.region && partial.region !== prev.region) {
        const apiKeys = loadApiKeys();
        newSettings.apiKey = apiKeys[partial.region] || '';
      }

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
