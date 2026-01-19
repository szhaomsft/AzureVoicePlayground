import React, { useState, useMemo } from 'react';
import { VoiceConversionVoice, VOICE_CONVERSION_VOICES } from '../types/voiceConversion';

interface VoiceConversionSelectorProps {
  selectedVoice: VoiceConversionVoice | null;
  onVoiceChange: (voice: VoiceConversionVoice) => void;
}

type GenderFilter = 'All' | 'Female' | 'Male' | 'Neutral';

export function VoiceConversionSelector({
  selectedVoice,
  onVoiceChange,
}: VoiceConversionSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('All');

  const filteredVoices = useMemo(() => {
    return VOICE_CONVERSION_VOICES.filter((voice) => {
      // Apply gender filter
      if (genderFilter !== 'All' && voice.gender !== genderFilter) {
        return false;
      }

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          voice.displayName.toLowerCase().includes(searchLower) ||
          voice.name.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [searchTerm, genderFilter]);

  const genderFilters: GenderFilter[] = ['All', 'Female', 'Male', 'Neutral'];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Target Voice</h3>

      {/* Gender filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {genderFilters.map((gender) => (
          <button
            key={gender}
            onClick={() => setGenderFilter(gender)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              genderFilter === gender
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {gender}
          </button>
        ))}
      </div>

      {/* Search input */}
      <input
        type="text"
        placeholder="Search voices..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Voice list */}
      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
        {filteredVoices.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No voices found</div>
        ) : (
          filteredVoices.map((voice) => (
            <button
              key={voice.name}
              onClick={() => onVoiceChange(voice)}
              className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                selectedVoice?.name === voice.name
                  ? 'bg-blue-50 border-l-4 border-l-blue-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-800">{voice.displayName}</div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                    voice.gender === 'Female'
                      ? 'bg-pink-100 text-pink-700'
                      : voice.gender === 'Male'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {voice.gender}
                </span>
                <span className="text-gray-400">en-US</span>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="text-xs text-gray-500">
        {filteredVoices.length} voice{filteredVoices.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
}
