import React, { useState } from 'react';
import { AzureSettings, PlaygroundMode } from '../types/azure';

interface NavigationSidebarProps {
  activeMode: PlaygroundMode;
  onModeChange: (mode: PlaygroundMode) => void;
  settings: AzureSettings;
  onSettingsChange: (settings: Partial<AzureSettings>) => void;
  showPodcastGenerator?: boolean;
}

const ALL_TTS_REGIONS = [
  // Americas
  { value: 'brazilsouth', label: 'Brazil South' },
  { value: 'canadacentral', label: 'Canada Central' },
  { value: 'canadaeast', label: 'Canada East' },
  { value: 'centralus', label: 'Central US' },
  { value: 'eastus', label: 'East US' },
  { value: 'eastus2', label: 'East US 2' },
  { value: 'northcentralus', label: 'North Central US' },
  { value: 'southcentralus', label: 'South Central US' },
  { value: 'westcentralus', label: 'West Central US' },
  { value: 'westus', label: 'West US' },
  { value: 'westus2', label: 'West US 2' },
  { value: 'westus3', label: 'West US 3' },

  // Europe
  { value: 'francecentral', label: 'France Central' },
  { value: 'germanywestcentral', label: 'Germany West Central' },
  { value: 'italynorth', label: 'Italy North' },
  { value: 'northeurope', label: 'North Europe' },
  { value: 'norwayeast', label: 'Norway East' },
  { value: 'swedencentral', label: 'Sweden Central' },
  { value: 'switzerlandnorth', label: 'Switzerland North' },
  { value: 'switzerlandwest', label: 'Switzerland West' },
  { value: 'uksouth', label: 'UK South' },
  { value: 'ukwest', label: 'UK West' },
  { value: 'westeurope', label: 'West Europe' },

  // Asia Pacific
  { value: 'australiaeast', label: 'Australia East' },
  { value: 'centralindia', label: 'Central India' },
  { value: 'eastasia', label: 'East Asia' },
  { value: 'japaneast', label: 'Japan East' },
  { value: 'japanwest', label: 'Japan West' },
  { value: 'koreacentral', label: 'Korea Central' },
  { value: 'southeastasia', label: 'Southeast Asia' },

  // Middle East & Africa
  { value: 'qatarcentral', label: 'Qatar Central' },
  { value: 'southafricanorth', label: 'South Africa North' },
  { value: 'uaenorth', label: 'UAE North' },
];

const playgroundModes: { mode: PlaygroundMode; label: string; icon: React.ReactNode }[] = [
  {
    mode: 'text-to-speech',
    label: 'Text to Speech',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    mode: 'multi-talker',
    label: 'Podcast Generator',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    mode: 'voice-changer',
    label: 'Voice Changer',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
];

export function NavigationSidebar({
  activeMode,
  onModeChange,
  settings,
  onSettingsChange,
  showPodcastGenerator = false,
}: NavigationSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter playground modes based on feature flags
  const visibleModes = playgroundModes.filter(({ mode }) => {
    if (mode === 'multi-talker' && !showPodcastGenerator) return false;
    return true;
  });

  return (
    <div
      className={`h-full bg-gray-900 text-white flex flex-col flex-shrink-0 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo / Title with Toggle */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h1 className="text-lg font-bold text-white">Azure Voice</h1>
            <p className="text-xs text-gray-400">Playground</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg hover:bg-gray-800 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Playground Navigation */}
      <div className="p-3">
        {!isCollapsed && (
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">Playground</p>
        )}
        <nav className="space-y-1">
          {visibleModes.map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              title={isCollapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              {icon}
              {!isCollapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700 mx-3 my-2" />

      {/* Azure Configuration */}
      <div className={`flex-1 overflow-y-auto p-3 ${isCollapsed ? 'hidden' : ''}`}>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-2">Azure Config</p>

        {/* API Key */}
        <div className="space-y-2 px-2 mb-4">
          <label className="block text-xs font-medium text-gray-400">API Key</label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue !== settings.apiKey) {
                onSettingsChange({ apiKey: newValue });
              }
            }}
            placeholder="Enter API key"
            autoComplete="new-password"
            data-lpignore="true"
            data-form-type="other"
            className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <a
            href="https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/SpeechServices"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Get API key
          </a>
        </div>

        {/* Region */}
        <div className="space-y-2 px-2">
          <label className="block text-xs font-medium text-gray-400">Region</label>
          <select
            value={settings.region}
            onChange={(e) => onSettingsChange({ region: e.target.value })}
            className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {ALL_TTS_REGIONS.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        </div>

        {/* Security Warning */}
        <div className="mt-6 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md">
          <h3 className="text-xs font-semibold text-yellow-400 mb-1">
            Security Notice
          </h3>
          <p className="text-xs text-yellow-200/70">
            Your API key is stored in browser localStorage. Never share your key or use on untrusted devices.
          </p>
        </div>

        {/* Help Section */}
        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-md">
          <h3 className="text-xs font-semibold text-blue-400 mb-2">
            Getting Started
          </h3>
          <ol className="text-xs text-blue-200/70 space-y-1 list-decimal list-inside">
            <li>
              <a
                href="https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/SpeechServices"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Get API key from Azure
              </a>
            </li>
            <li>Select your Azure region</li>
            <li>Choose a voice</li>
            <li>Enter text and click Play</li>
          </ol>
        </div>
      </div>

      {/* Collapsed state: show config icon */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center pt-2">
          <div
            className="p-2 text-gray-500"
            title="Expand to configure Azure settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-gray-700">
        {!isCollapsed && (
          <p className="text-xs text-gray-500 text-center">
            API key stored locally
          </p>
        )}
      </div>
    </div>
  );
}
