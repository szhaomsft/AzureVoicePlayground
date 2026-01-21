/**
 * Type definitions for Podcast Agent API
 */

export type HostType = 'OneHost' | 'TwoHosts';
export type PodcastStyle = 'Default' | 'Professional' | 'Casual';
export type PodcastLength = 'VeryShort' | 'Short' | 'Medium' | 'Long' | 'VeryLong';
export type PodcastContentKind = 'PlainText' | 'AzureStorageBlobPublicUrl' | 'FileBase64';
export type FileFormat = 'Txt' | 'Pdf';
export type OperationStatus = 'NotStarted' | 'Running' | 'Succeeded' | 'Failed';
export type GenerationStatus =
  | 'idle'
  | 'uploading'
  | 'creating'
  | 'processing'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface PodcastContent {
  kind: PodcastContentKind;
  text?: string;           // For PlainText (max 1MB)
  url?: string;            // For AzureStorageBlobPublicUrl
  base64Text?: string;     // For FileBase64 (max 8MB)
  tempFileId?: string;     // For temp file upload
  fileFormat?: FileFormat; // For URL or base64
}

export interface ScriptGeneration {
  additionalInstructions?: string;
  length?: PodcastLength;
  style?: PodcastStyle;
}

export interface PodcastTTS {
  voiceName?: string;                    // e.g., "en-us-multitalker-set1:DragonHDV2.4Neural"
  multiTalkerVoiceSpeakerNames?: string; // e.g., "ava,andrew"
  genderPreference?: 'Male' | 'Female';  // For OneHost
}

export interface CreateGenerationParams {
  generationId: string;
  locale: string;
  host: HostType;
  displayName: string;
  content: PodcastContent;
  scriptGeneration?: ScriptGeneration;
  tts?: PodcastTTS;
}

export interface PodcastOutput {
  audioFileUrl?: string;
  reportFileUrl?: string;
}

export interface Generation {
  id: string;
  locale: string;
  host: HostType;
  displayName?: string;
  description?: string;
  status: OperationStatus;
  createdDateTime: string;
  lastActionDateTime?: string;
  content?: {
    url?: string;
    kind?: string;
  };
  config?: {
    locale?: string;
  };
  output?: PodcastOutput;
  failureReason?: string;
}

export interface OperationResponse {
  id: string;
  status: OperationStatus;
  createdDateTime: string;
  lastActionDateTime?: string;
  resourceLocation?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface PodcastApiConfig {
  region: string;
  apiKey: string;
}

export interface GenerationProgress {
  step: number;
  totalSteps: number;
  message: string;
  generationId?: string;
}

export interface PodcastContentSource {
  type: 'file' | 'url' | 'text';
  file?: File;
  url?: string;
  text?: string;
  base64?: string;
  fileName?: string;
}

export interface PodcastHistoryEntry {
  id: string;
  generationId: string;
  timestamp: number;
  displayName: string;
  locale: string;
  hostType: HostType;
  voiceName?: string;
  style: string;
  length: string;
  status: OperationStatus;
  audioUrl?: string;
  duration?: number;
  contentPreview: string;
  error?: string;
}

export interface PodcastConfig {
  locale: string;
  hostType: HostType;
  style: PodcastStyle;
  length: PodcastLength;
  additionalInstructions?: string;
}

export interface TempFile {
  id: string;
  name: string;
  createdDateTime: string;
  expiresDateTime: string;
  sizeInBytes: number;
}

// Size limits (in bytes)
export const MAX_PLAIN_TEXT_LENGTH = 1 * 1024 * 1024;      // 1MB
export const MAX_BASE64_TEXT_LENGTH = 8 * 1024 * 1024;     // 8MB
export const MAX_CONTENT_FILE_SIZE = 50 * 1024 * 1024;     // 50MB

// Supported locales
export const PODCAST_LOCALES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'en-AU', name: 'English (Australia)' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'de-DE', name: 'German' },
  { code: 'fr-FR', name: 'French' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'ar-AE', name: 'Arabic (UAE)' },
];

// Supported regions for Podcast API
export const PODCAST_SUPPORTED_REGIONS = [
  'eastus',
  'eastus2',
  'westeurope',
  'southeastasia',
  'swedencentral',
  'centralindia',
];
