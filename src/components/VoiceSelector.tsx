import React, { useState, useEffect } from 'react';
import { VoiceInfo } from '../types/azure';
import { fetchVoiceList } from '../utils/voiceList';
import { listPersonalVoices, type PersonalVoiceClientConfig } from '../lib/personalVoice/personalVoiceClient';
import { PersonalVoice } from '../types/personalVoice';

export interface SelectedVoiceInfo {
  voiceName: string;
  isPersonalVoice: boolean;
  speakerProfileId?: string;
  locale?: string;
}

interface VoiceSelectorProps {
  apiKey: string;
  region: string;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  onVoiceInfoChange?: (info: SelectedVoiceInfo) => void;
  enableMAIVoices?: boolean;
}

export function VoiceSelector({
  apiKey,
  region,
  selectedVoice,
  onVoiceChange,
  onVoiceInfoChange,
  enableMAIVoices = false,
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [personalVoices, setPersonalVoices] = useState<PersonalVoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPreset, setFilterPreset] = useState<string>('');

  useEffect(() => {
    if (apiKey && region) {
      setLoading(true);
      setError('');
      fetchVoiceList(apiKey, region, enableMAIVoices)
        .then((fetchedVoices) => {
          setVoices(fetchedVoices);

          // Debug: Check for OpenAI and MAI voices
          const openAIVoices = fetchedVoices.filter(v => v.name.toLowerCase().includes('openai'));
          const maiVoices = fetchedVoices.filter(v =>
            v.name.toLowerCase().includes('mai-voice') ||
            v.name.toLowerCase().includes(':mai-')
          );
          console.log(`Found ${openAIVoices.length} OpenAI voices:`, openAIVoices.map(v => v.name));
          console.log(`Found ${maiVoices.length} MAI voices:`, maiVoices.map(v => v.name));

          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch voices:', err);
          setError('Failed to load voices from Azure.');
          setVoices([]);
          setLoading(false);
        });
    }
  }, [apiKey, region, enableMAIVoices]);

  // Fetch personal voices when MyVoices filter is selected
  useEffect(() => {
    if (filterPreset === 'MyVoices' && apiKey && region) {
      setLoading(true);
      const clientConfig: PersonalVoiceClientConfig = { apiKey, region };
      listPersonalVoices(clientConfig)
        .then((voices) => {
          // Only include succeeded voices
          const readyVoices = voices.filter(v => v.status === 'Succeeded');
          setPersonalVoices(readyVoices);
          console.log(`Found ${readyVoices.length} personal voices:`, readyVoices.map(v => v.id));
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch personal voices:', err);
          setPersonalVoices([]);
          setLoading(false);
        });
    }
  }, [filterPreset, apiKey, region]);

  // For MyVoices filter, we use personalVoices instead of regular voices
  const isMyVoicesFilter = filterPreset === 'MyVoices';

  const filteredVoices = isMyVoicesFilter ? [] : voices.filter((voice) => {
    // Exclude multi-talker voices (they belong in Multi Talker)
    if (voice.name.toLowerCase().includes('multitalker')) return false;

    // Apply preset filter first
    if (filterPreset) {
      switch (filterPreset) {
        case 'MAI':
          // Check name patterns AND VoiceTag.Source for MAI voices
          const hasMAIName = voice.name.toLowerCase().includes('mai-voice') ||
                             voice.name.toLowerCase().includes(':mai-');
          const hasMAISource = Array.isArray(voice.voiceTag?.Source) &&
                               voice.voiceTag.Source.some(s => s.toLowerCase() === 'mai');
          if (!hasMAIName && !hasMAISource) return false;
          break;
        case 'HD':
          if (!voice.isNeuralHD) return false;
          break;
        case 'NonHD':
          if (voice.isNeuralHD) return false;
          break;
        case 'OpenAI':
          // Check name pattern AND VoiceTag.Source for OpenAI voices
          const hasOpenAIName = voice.name.toLowerCase().includes('openai');
          const hasOpenAISource = Array.isArray(voice.voiceTag?.Source) &&
                                  voice.voiceTag.Source.some(s => s.toLowerCase() === 'openai');
          if (!hasOpenAIName && !hasOpenAISource) return false;
          break;
      }
    }

    // If no search term, return all voices that passed preset filter
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase().trim();

    // Helper function to check if search term is a whole word in text
    const matchesWord = (text: string) => {
      const words = text.toLowerCase().split(/\s+/);
      return words.some(word => word === searchLower);
    };

    return (
      // Partial match for name and description
      voice.name.toLowerCase().includes(searchLower) ||
      voice.description.toLowerCase().includes(searchLower) ||
      // Word match for other fields
      matchesWord(voice.locale) ||
      (voice.gender && matchesWord(voice.gender)) ||
      voice.styleList?.some(style => matchesWord(style)) ||
      voice.keywords?.some(keyword => matchesWord(String(keyword)))
    );
  });

  // Auto-select the first voice in filtered results when searching or filtering
  useEffect(() => {
    if (filteredVoices.length > 0) {
      const topVoice = filteredVoices[0];
      // Only auto-select if we're actively filtering (search term or preset filter is set)
      // and the current selection is not in the filtered list
      const isCurrentVoiceInFilteredList = filteredVoices.some(v => v.name === selectedVoice);

      if ((searchTerm || filterPreset) && !isCurrentVoiceInFilteredList) {
        console.log('Auto-selecting top voice from filtered list:', topVoice.name);
        onVoiceChange(topVoice.name);
        // Also call onVoiceInfoChange to ensure parent component gets full voice info
        onVoiceInfoChange?.({
          voiceName: topVoice.name,
          isPersonalVoice: false,
          locale: topVoice.locale,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filteredVoices.length, filterPreset]);

  return (
    <div className="h-full flex flex-col space-y-2">
      <label className="block text-sm font-medium text-gray-700">Voice</label>

      {error && (
        <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Preset filter buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterPreset('')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            filterPreset === ''
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterPreset(filterPreset === 'HD' ? '' : 'HD')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            filterPreset === 'HD'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          HD
        </button>
        <button
          onClick={() => setFilterPreset(filterPreset === 'MAI' ? '' : 'MAI')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            filterPreset === 'MAI'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          MAI
        </button>
        <button
          onClick={() => setFilterPreset(filterPreset === 'OpenAI' ? '' : 'OpenAI')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            filterPreset === 'OpenAI'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          OpenAI
        </button>
        <button
          onClick={() => setFilterPreset(filterPreset === 'NonHD' ? '' : 'NonHD')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            filterPreset === 'NonHD'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Non-HD
        </button>
        <button
          onClick={() => setFilterPreset(filterPreset === 'MyVoices' ? '' : 'MyVoices')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            filterPreset === 'MyVoices'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          }`}
        >
          My Voices
        </button>
      </div>

      <input
        type="text"
        placeholder="Search voices..."
        value={searchTerm}
        onChange={(e) => {
          console.log('Search term changed to:', e.target.value);
          setSearchTerm(e.target.value);
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Selected voice display */}
      {selectedVoice && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md flex-shrink-0">
          <div className="text-xs text-blue-600 font-medium">Selected:</div>
          <div className="text-sm text-blue-800 truncate">{selectedVoice}</div>
        </div>
      )}

      {/* Voice list */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md min-h-0">
        {loading && (
          <div className="p-4 text-center text-gray-500 text-sm">Loading voices...</div>
        )}

        {/* Regular voices */}
        {!loading && !isMyVoicesFilter && filteredVoices.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">No voices found</div>
        )}

        {!loading && !isMyVoicesFilter &&
          filteredVoices.map((voice) => {
            // Combine ContentCategories and VoicePersonalities from VoiceTag
            const tags: string[] = [];
            if (voice.voiceTag?.ContentCategories) {
              tags.push(...voice.voiceTag.ContentCategories);
            }
            if (voice.voiceTag?.VoicePersonalities) {
              tags.push(...voice.voiceTag.VoicePersonalities);
            }
            const tagsText = tags.length > 0 ? ` [${tags.join(', ')}]` : '';

            return (
              <button
                key={voice.name}
                onClick={() => {
                  console.log('Voice changed to:', voice.name);
                  onVoiceChange(voice.name);
                  onVoiceInfoChange?.({
                    voiceName: voice.name,
                    isPersonalVoice: false,
                    locale: voice.locale,
                  });
                }}
                className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                  selectedVoice === voice.name
                    ? 'bg-blue-50 border-l-4 border-l-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-800 text-sm">
                  {voice.isFeatured ? '⭐ ' : ''}
                  {voice.name}
                </div>
                {tagsText && (
                  <div className="text-xs text-gray-500 mt-0.5">{tagsText}</div>
                )}
              </button>
            );
          })}

        {/* Personal voices */}
        {!loading && isMyVoicesFilter && personalVoices.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p>No personal voices found</p>
            <p className="text-xs mt-1">Create voices in Voice Creation playground</p>
          </div>
        )}

        {!loading && isMyVoicesFilter &&
          personalVoices.map((voice) => (
            <button
              key={voice.id}
              onClick={() => {
                console.log('Personal voice selected:', voice.id, 'speakerProfileId:', voice.speakerProfileId);
                // Use a special identifier for personal voices
                const voiceIdentifier = `personal:${voice.id}`;
                onVoiceChange(voiceIdentifier);
                onVoiceInfoChange?.({
                  voiceName: voice.id,
                  isPersonalVoice: true,
                  speakerProfileId: voice.speakerProfileId,
                });
              }}
              className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                selectedVoice === `personal:${voice.id}`
                  ? 'bg-emerald-50 border-l-4 border-l-emerald-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-800 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {voice.id}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Personal Voice</div>
            </button>
          ))}
      </div>

      <div className="text-xs text-gray-500 flex-shrink-0 pt-2">
        {isMyVoicesFilter
          ? `${personalVoices.length} personal voice${personalVoices.length !== 1 ? 's' : ''}`
          : `${filteredVoices.length} voice${filteredVoices.length !== 1 ? 's' : ''} available${searchTerm ? ` (filtered from ${voices.length})` : ''}`
        }
      </div>
    </div>
  );
}
