import React, { useState, useEffect } from 'react';
import { VoiceInfo } from '../types/azure';
import { fetchVoiceList } from '../utils/voiceList';

interface VoiceSelectorProps {
  apiKey: string;
  region: string;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
}

export function VoiceSelector({
  apiKey,
  region,
  selectedVoice,
  onVoiceChange,
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPreset, setFilterPreset] = useState<string>('');

  useEffect(() => {
    if (apiKey && region) {
      setLoading(true);
      setError('');
      fetchVoiceList(apiKey, region)
        .then((fetchedVoices) => {
          setVoices(fetchedVoices);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch voices:', err);
          setError('Failed to load voices from Azure.');
          setVoices([]);
          setLoading(false);
        });
    }
  }, [apiKey, region]);

  const filteredVoices = voices.filter((voice) => {
    // Apply preset filter first
    if (filterPreset) {
      switch (filterPreset) {
        case 'MAI':
          if (!voice.name.toLowerCase().includes('mai-voice')) return false;
          break;
        case 'HD':
          if (!voice.isNeuralHD) return false;
          break;
        case 'NonHD':
          if (voice.isNeuralHD) return false;
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
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filteredVoices.length, filterPreset]);

  return (
    <div className="space-y-2">
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
          onClick={() => setFilterPreset(filterPreset === 'NonHD' ? '' : 'NonHD')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            filterPreset === 'NonHD'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Non-HD
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

      <select
        value={selectedVoice}
        onChange={(e) => {
          console.log('Voice changed to:', e.target.value);
          onVoiceChange(e.target.value);
        }}
        disabled={loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
      >
        {loading && <option>Loading voices...</option>}

        {!loading && filteredVoices.length === 0 && (
          <option>No voices found</option>
        )}

        {!loading &&
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
              <option key={voice.name} value={voice.name}>
                {voice.isFeatured ? '⭐ ' : ''}
                {voice.name} - {voice.description}{tagsText}
              </option>
            );
          })}
      </select>

      <div className="text-xs text-gray-500">
        {filteredVoices.length} voice{filteredVoices.length !== 1 ? 's' : ''} available
        {searchTerm && ` (filtered from ${voices.length})`}
      </div>
    </div>
  );
}
