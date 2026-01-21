import React, { useState, useEffect, useMemo } from 'react';
import { VoiceInfo } from '../types/azure';
import { MultiTalkerVoice, toMultiTalkerVoice } from '../types/multiTalker';
import { fetchVoiceList } from '../utils/voiceList';

interface PodcastVoiceSelectorProps {
  apiKey: string;
  region: string;
  locale: string;
  selectedVoice: MultiTalkerVoice | null;
  onVoiceChange: (voice: MultiTalkerVoice | null) => void;
  disabled?: boolean;
}

export function PodcastVoiceSelector({
  apiKey,
  region,
  locale,
  selectedVoice,
  onVoiceChange,
  disabled = false,
}: PodcastVoiceSelectorProps) {
  const [allVoices, setAllVoices] = useState<VoiceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (apiKey && region) {
      setLoading(true);
      setError('');
      fetchVoiceList(apiKey, region, false) // Don't use MAI voices feature flag here
        .then((fetchedVoices) => {
          setAllVoices(fetchedVoices);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch voices:', err);
          setError('Failed to load voices from Azure.');
          setAllVoices([]);
          setLoading(false);
        });
    }
  }, [apiKey, region]);

  // Filter to only multitalker voices
  const multiTalkerVoices = useMemo(() => {
    return allVoices
      .filter(voice => voice.name.toLowerCase().includes('multitalker'))
      .map(voice => toMultiTalkerVoice(voice))
      .filter((v): v is MultiTalkerVoice => v !== null);
  }, [allVoices]);

  // Filter by locale
  const localeFilteredVoices = useMemo(() => {
    return multiTalkerVoices.filter(v => v.locale === locale);
  }, [multiTalkerVoices, locale]);

  // Apply search filter
  const filteredVoices = useMemo(() => {
    if (!searchTerm) return localeFilteredVoices;

    const searchLower = searchTerm.toLowerCase();
    return localeFilteredVoices.filter(voice =>
      voice.name.toLowerCase().includes(searchLower) ||
      voice.displayName.toLowerCase().includes(searchLower) ||
      voice.speakers.some(speaker => speaker.toLowerCase().includes(searchLower))
    );
  }, [localeFilteredVoices, searchTerm]);

  // Auto-select first voice when locale changes
  useEffect(() => {
    if (filteredVoices.length > 0 && !selectedVoice) {
      onVoiceChange(filteredVoices[0]);
    } else if (selectedVoice && !filteredVoices.find(v => v.name === selectedVoice.name)) {
      // Clear selection if current voice is not in filtered list
      onVoiceChange(filteredVoices.length > 0 ? filteredVoices[0] : null);
    }
  }, [filteredVoices, locale]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Voice Pair</label>

      {error && (
        <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search voices..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled={disabled || loading}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />

      {/* Selected Voice Display */}
      {selectedVoice && (
        <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-md">
          <div className="text-xs text-indigo-600 font-medium">Selected:</div>
          <div className="text-sm text-indigo-800">
            {selectedVoice.displayName}
          </div>
          <div className="text-xs text-indigo-600 mt-0.5">
            Speakers: {selectedVoice.speakers.join(', ')}
          </div>
        </div>
      )}

      {/* Voice List */}
      <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-gray-500 text-sm">Loading voices...</div>
        )}

        {!loading && filteredVoices.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            {localeFilteredVoices.length === 0
              ? `No multitalker voices available for ${locale}`
              : 'No voices found matching search'}
          </div>
        )}

        {!loading &&
          filteredVoices.map((voice) => (
            <button
              key={voice.name}
              onClick={() => onVoiceChange(voice)}
              disabled={disabled}
              className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                selectedVoice?.name === voice.name
                  ? 'bg-indigo-50 border-l-4 border-l-indigo-600'
                  : 'hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      {voice.locale}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {voice.displayName}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Speakers: {voice.speakers.join(', ')}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    {voice.name}
                  </div>
                </div>
                {selectedVoice?.name === voice.name && (
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
      </div>

      <div className="text-xs text-gray-500">
        {filteredVoices.length} voice{filteredVoices.length !== 1 ? 's' : ''} available
        {searchTerm && ` (filtered from ${localeFilteredVoices.length})`}
      </div>
    </div>
  );
}
