import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

export interface AzureSettings {
  apiKey: string;
  region: string;
  selectedVoice: string;
}

export interface VoiceInfo {
  name: string;
  locale: string;
  gender: 'Female' | 'Male';
  description: string;
  styleList?: string[];
  isFeatured?: boolean;
  voiceType?: string;
  isNeuralHD?: boolean;
  keywords?: string[];
  wordsPer?: string;
  voiceTag?: {
    ContentCategories?: string[];
    VoicePersonalities?: string[];
    Source?: string[];
  };
}

export interface WordBoundary {
  text: string;
  offset: number;
  length: number;
  audioOffset: number;
}

export type SynthesisState = 'idle' | 'synthesizing' | 'playing' | 'paused' | 'error';

export type PlaygroundMode = 'text-to-speech' | 'voice-changer' | 'podcast';

export interface SynthesisResult {
  audioData?: ArrayBuffer;
  error?: string;
}

export { SpeechSDK };
