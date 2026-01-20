// STT Model Selector Component

import React from 'react';
import { STTModel } from '../types/stt';

interface STTModelSelectorProps {
  selectedModel: STTModel;
  onModelChange: (model: STTModel) => void;
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
    features: ['Streaming results', 'Word-level timestamps', 'Low latency']
  },
  {
    id: 'fast-transcription',
    name: 'Fast Transcription API',
    description: 'REST API optimized for speed',
    icon: '🚀',
    useCases: 'Quick audio file transcription',
    features: ['Fast processing', 'Batch transcription', 'Up to 25 MB files']
  },
  {
    id: 'whisper',
    name: 'Whisper Model',
    description: 'OpenAI Whisper via Batch ASR',
    icon: '🎯',
    useCases: 'High-accuracy batch processing',
    features: ['Highest accuracy', 'Multi-language support', 'Robust to noise']
  }
];

export function STTModelSelector({ selectedModel, onModelChange }: STTModelSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Recognition Model
      </label>
      <div className="grid grid-cols-1 gap-3">
        {MODELS.map((model) => (
          <button
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className={`
              p-4 rounded-lg border-2 text-left transition-all
              ${selectedModel === model.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{model.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{model.name}</h3>
                  {selectedModel === model.id && (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {model.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
