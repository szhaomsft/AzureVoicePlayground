// STT Model Selector Component

import React from 'react';
import { STTModel } from '../types/stt';
import { FAST_TRANSCRIPTION_LANGUAGES, REALTIME_LANGUAGES } from '../utils/sttLanguages';
import { LLM_SPEECH_LANGUAGES } from '../hooks/useLLMSpeech';

// Regions supporting Fast Transcription
// https://learn.microsoft.com/en-us/azure/ai-services/speech-service/regions?tabs=stt
const FAST_TRANSCRIPTION_REGIONS = [
  'australiaeast',
  'centralindia',
  'eastus',
  'eastus2',
  'northeurope',
  'southcentralus',
  'southeastasia',
  'swedencentral',
  'westeurope',
];

// All regions support Realtime STT, so no need for a separate list

interface STTModelSelectorProps {
  selectedModel: STTModel;
  onModelChange: (model: STTModel) => void;
  region?: string; // Current Azure region
}

interface ModelInfo {
  id: STTModel;
  name: string;
  description: string;
  icon: string;
  useCases: string;
  features: string[];
}

const MODELS: ModelInfo[] = [
  {
    id: 'realtime',
    name: 'Realtime API',
    description: 'WebSocket streaming, low-latency recognition',
    icon: '⚡',
    useCases: 'Live transcription, real-time captions',
    features: ['Streaming results', 'Word-level timestamps', 'Low latency', 'Any file size', `${REALTIME_LANGUAGES.length} locales`]
  },
  {
    id: 'fast-transcription',
    name: 'Fast Transcription API',
    description: 'REST API optimized for speed',
    icon: '🚀',
    useCases: 'Quick audio file transcription',
    features: ['Fast processing', 'Batch transcription', 'Max 25 MB', `${FAST_TRANSCRIPTION_LANGUAGES.length} locales`]
  },
  {
    id: 'llm-speech',
    name: 'LLM Speech (Preview)',
    description: 'LLM-enhanced with deep contextual understanding',
    icon: '🧠',
    useCases: 'High-accuracy transcription & translation',
    features: ['LLM-enhanced', 'Prompt tuning', 'Translation', 'Diarization', `${LLM_SPEECH_LANGUAGES.length} languages`]
  },
  // Whisper temporarily hidden - requires Azure Blob Storage for audio URLs
  // {
  //   id: 'whisper',
  //   name: 'Whisper Model',
  //   description: 'OpenAI Whisper via Batch ASR',
  //   icon: '🎯',
  //   useCases: 'High-accuracy batch processing',
  //   features: ['Highest accuracy', 'Multi-language support', 'Max 10 MB']
  // }
];

function isModelSupportedInRegion(modelId: STTModel, region: string): boolean {
  const regionLower = region.toLowerCase();

  switch (modelId) {
    case 'realtime':
      // All regions support realtime STT
      return true;
    case 'fast-transcription':
      return FAST_TRANSCRIPTION_REGIONS.includes(regionLower);
    case 'llm-speech':
      // LLM Speech uses same endpoint as fast transcription
      return FAST_TRANSCRIPTION_REGIONS.includes(regionLower);
    case 'whisper':
      return true; // Whisper has its own region handling
    default:
      return true;
  }
}

export function STTModelSelector({ selectedModel, onModelChange, region = '' }: STTModelSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Recognition Model
      </label>
      <div className="grid grid-cols-1 gap-3">
        {MODELS.map((model) => {
          const isSupported = isModelSupportedInRegion(model.id, region);

          return (
            <button
              key={model.id}
              onClick={() => isSupported && onModelChange(model.id)}
              disabled={!isSupported}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${!isSupported
                  ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                  : selectedModel === model.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <span className={`text-2xl flex-shrink-0 ${!isSupported ? 'opacity-50' : ''}`}>{model.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${!isSupported ? 'text-gray-500' : 'text-gray-900'}`}>{model.name}</h3>
                    {!isSupported && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        Not in region
                      </span>
                    )}
                    {isSupported && selectedModel === model.id && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${!isSupported ? 'text-gray-400' : 'text-gray-600'}`}>{model.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {model.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className={`inline-block px-2 py-0.5 text-xs rounded ${!isSupported ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
