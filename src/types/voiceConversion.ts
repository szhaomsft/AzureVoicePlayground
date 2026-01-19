export interface VoiceConversionVoice {
  name: string;
  displayName: string;
  gender: 'Female' | 'Male' | 'Neutral';
}

export interface BlobStorageConfig {
  accountName: string;
  containerName: string;
  sasToken: string;
}

export interface ConversionHistoryEntry {
  id: string;
  timestamp: number;
  sourceFileName: string;
  targetVoice: string;
  region: string;
  resultAudioData: ArrayBuffer;
  duration: number;
}

export type ConversionState = 'idle' | 'uploading' | 'converting' | 'playing' | 'error';

// 28 supported voices for voice conversion (en-US only)
export const VOICE_CONVERSION_VOICES: VoiceConversionVoice[] = [
  // Female voices
  { name: 'en-US-AmandaMultilingualNeural', displayName: 'Amanda', gender: 'Female' },
  { name: 'en-US-AvaMultilingualNeural', displayName: 'Ava', gender: 'Female' },
  { name: 'en-US-CoraMultilingualNeural', displayName: 'Cora', gender: 'Female' },
  { name: 'en-US-EmmaMultilingualNeural', displayName: 'Emma', gender: 'Female' },
  { name: 'en-US-EvelynMultilingualNeural', displayName: 'Evelyn', gender: 'Female' },
  { name: 'en-US-JennyMultilingualNeural', displayName: 'Jenny', gender: 'Female' },
  { name: 'en-US-LolaMultilingualNeural', displayName: 'Lola', gender: 'Female' },
  { name: 'en-US-NancyMultilingualNeural', displayName: 'Nancy', gender: 'Female' },
  { name: 'en-US-NovaTurboMultilingualNeural', displayName: 'Nova (Turbo)', gender: 'Female' },
  { name: 'en-US-PhoebeMultilingualNeural', displayName: 'Phoebe', gender: 'Female' },
  { name: 'en-US-SerenaMultilingualNeural', displayName: 'Serena', gender: 'Female' },
  { name: 'en-US-ShimmerTurboMultilingualNeural', displayName: 'Shimmer (Turbo)', gender: 'Female' },

  // Male voices
  { name: 'en-US-AdamMultilingualNeural', displayName: 'Adam', gender: 'Male' },
  { name: 'en-US-AlloyTurboMultilingualNeural', displayName: 'Alloy (Turbo)', gender: 'Male' },
  { name: 'en-US-AndrewMultilingualNeural', displayName: 'Andrew', gender: 'Male' },
  { name: 'en-US-BrandonMultilingualNeural', displayName: 'Brandon', gender: 'Male' },
  { name: 'en-US-BrianMultilingualNeural', displayName: 'Brian', gender: 'Male' },
  { name: 'en-US-ChristopherMultilingualNeural', displayName: 'Christopher', gender: 'Male' },
  { name: 'en-US-DavisMultilingualNeural', displayName: 'Davis', gender: 'Male' },
  { name: 'en-US-DerekMultilingualNeural', displayName: 'Derek', gender: 'Male' },
  { name: 'en-US-DustinMultilingualNeural', displayName: 'Dustin', gender: 'Male' },
  { name: 'en-US-EchoTurboMultilingualNeural', displayName: 'Echo (Turbo)', gender: 'Male' },
  { name: 'en-US-LewisMultilingualNeural', displayName: 'Lewis', gender: 'Male' },
  { name: 'en-US-OnyxTurboMultilingualNeural', displayName: 'Onyx (Turbo)', gender: 'Male' },
  { name: 'en-US-RyanMultilingualNeural', displayName: 'Ryan', gender: 'Male' },
  { name: 'en-US-SamuelMultilingualNeural', displayName: 'Samuel', gender: 'Male' },
  { name: 'en-US-SteffanMultilingualNeural', displayName: 'Steffan', gender: 'Male' },

  // Neutral voice
  { name: 'en-US-FableTurboMultilingualNeural', displayName: 'Fable (Turbo)', gender: 'Neutral' },
];
