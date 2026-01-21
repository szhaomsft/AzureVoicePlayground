import React, { useState, useEffect, useMemo } from 'react';
import { VoiceInfo } from '../types/azure';
import { MultiTalkerVoice, toMultiTalkerVoice } from '../types/multiTalker';
import { fetchVoiceList } from '../utils/voiceList';

interface MultiTalkerVoiceSelectorProps {
  apiKey: string;
  region: string;
  selectedVoice: MultiTalkerVoice | null;
  onVoiceChange: (voice: MultiTalkerVoice) => void;
  enableMAIVoices?: boolean;
}

export function MultiTalkerVoiceSelector({
  apiKey,
  region,
  selectedVoice,
  onVoiceChange,
  enableMAIVoices = false,
}: MultiTalkerVoiceSelectorProps) {
  const [allVoices, setAllVoices] = useState<VoiceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (apiKey && region) {
      setLoading(true);
      setError('');
      fetchVoiceList(apiKey, region, enableMAIVoices)
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
  }, [apiKey, region, enableMAIVoices]);

  // Filter to only multi-talker voices and convert to MultiTalkerVoice
  const multiTalkerVoices = useMemo(() => {
    return allVoices
      .filter(voice => voice.name.toLowerCase().includes('multitalker'))
      .map(voice => toMultiTalkerVoice(voice))
      .filter((v): v is MultiTalkerVoice => v !== null);
  }, [allVoices]);

  // Apply search filter
  const filteredVoices = useMemo(() => {
    if (!searchTerm) return multiTalkerVoices;

    const searchLower = searchTerm.toLowerCase().trim();
    return multiTalkerVoices.filter(voice =>
      voice.displayName.toLowerCase().includes(searchLower) ||
      voice.name.toLowerCase().includes(searchLower) ||
      voice.speakers.some(s => s.toLowerCase().includes(searchLower)) ||
      voice.locale.toLowerCase().includes(searchLower)
    );
  }, [multiTalkerVoices, searchTerm]);

  // Auto-select first voice when list loads
  useEffect(() => {
    if (!selectedVoice && filteredVoices.length > 0) {
      onVoiceChange(filteredVoices[0]);
    }
  }, [filteredVoices, selectedVoice, onVoiceChange]);

  return (
    <div className="h-full flex flex-col space-y-2">
      <label className="block text-sm font-medium text-gray-700">Multi-Talker Voice</label>

      {error && (
        <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Search voices..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Selected voice display */}
      {selectedVoice && (
        <div className="p-2 bg-purple-50 border border-purple-200 rounded-md flex-shrink-0">
          <div className="text-xs text-purple-600 font-medium">Selected:</div>
          <div className="text-sm text-purple-800 truncate">{selectedVoice.displayName}</div>
          <div className="text-xs text-purple-600 mt-1">
            Speakers: {selectedVoice.speakers.join(', ')}
          </div>
        </div>
      )}

      {/* Voice list */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md min-h-0">
        {loading && (
          <div className="p-4 text-center text-gray-500 text-sm">Loading voices...</div>
        )}

        {!loading && filteredVoices.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            {multiTalkerVoices.length === 0
              ? 'No multi-talker voices available in this region'
              : 'No voices found'}
          </div>
        )}

        {!loading &&
          filteredVoices.map((voice) => (
            <button
              key={voice.name}
              onClick={() => onVoiceChange(voice)}
              className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                selectedVoice?.name === voice.name
                  ? 'bg-purple-50 border-l-4 border-l-purple-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-800 text-sm">{voice.displayName}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                <span className="inline-block px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded mr-2">
                  {voice.locale}
                </span>
                {voice.speakers.map((speaker, idx) => (
                  <span
                    key={speaker}
                    className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded mr-1"
                  >
                    {speaker}
                  </span>
                ))}
              </div>
            </button>
          ))}
      </div>

      <div className="text-xs text-gray-500 flex-shrink-0 pt-2">
        {filteredVoices.length} multi-talker voice{filteredVoices.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
}
