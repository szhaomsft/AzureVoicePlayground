import React from 'react';
import { AzureSettings } from '../types/azure';
import { VoiceSelector } from './VoiceSelector';

interface SettingsPanelProps {
  settings: AzureSettings;
  onSettingsChange: (settings: Partial<AzureSettings>) => void;
}

const COMMON_REGIONS = [
  { value: 'eastus', label: 'East US' },
  { value: 'westus', label: 'West US' },
  { value: 'westus2', label: 'West US 2' },
  { value: 'eastus2', label: 'East US 2' },
  { value: 'centralus', label: 'Central US' },
  { value: 'northeurope', label: 'North Europe' },
  { value: 'westeurope', label: 'West Europe' },
  { value: 'southeastasia', label: 'Southeast Asia' },
  { value: 'eastasia', label: 'East Asia' },
  { value: 'japaneast', label: 'Japan East' },
  { value: 'australiaeast', label: 'Australia East' },
];

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  return (
    <div className="h-full bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

      <div className="space-y-6">
        {/* API Key */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Azure API Key
          </label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => onSettingsChange({ apiKey: e.target.value })}
            placeholder="Enter your Azure Speech API key"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500">
            Your API key is stored locally in your browser
          </p>
        </div>

        {/* Region */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Azure Region
          </label>
          <select
            value={settings.region}
            onChange={(e) => onSettingsChange({ region: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {COMMON_REGIONS.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        </div>

        {/* Voice Selector */}
        <VoiceSelector
          apiKey={settings.apiKey}
          region={settings.region}
          selectedVoice={settings.selectedVoice}
          onVoiceChange={(voice) => {
            console.log('SettingsPanel: Voice changed to:', voice);
            onSettingsChange({ selectedVoice: voice });
          }}
        />

        {/* Security Warning */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">
            Security Notice
          </h3>
          <p className="text-xs text-yellow-700">
            This app stores your API key in browser localStorage. Never share your
            API key or use this app on untrusted devices. Consider using Azure's
            authentication tokens for production applications.
          </p>
        </div>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            Getting Started
          </h3>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Get your API key from Azure Portal</li>
            <li>Select your Azure region</li>
            <li>Choose a voice from the list</li>
            <li>Enter text and click Play</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
