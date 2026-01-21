/**
 * Voice Live Chat configuration types and defaults
 */

export type AvatarType = 'none' | 'video' | 'photo';

export interface AvatarConfig {
  enabled: boolean;
  type: AvatarType;
  character: string;
  style?: string;
  customized: boolean;
  customAvatarName?: string;
}

export interface VoiceLiveChatConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  instructions: string;
  voice: string;
  recognitionLanguage: string;
  turnDetectionType: 'server_vad' | 'azure_semantic_vad';
  removeFillerWords: boolean;
  useNoiseSuppression: boolean;
  useEchoCancellation: boolean;
  temperature: number;
  avatar: AvatarConfig;
  enableFunctionCalling: boolean;
  functions: {
    enableDateTime: boolean;
  };
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  enabled: false,
  type: 'video',
  character: 'lisa',
  style: 'casual-sitting',
  customized: false,
};

export const DEFAULT_CHAT_CONFIG: VoiceLiveChatConfig = {
  endpoint: '',
  apiKey: '',
  model: 'gpt-realtime',
  instructions: 'You are a helpful and friendly AI assistant. Be concise and natural in your responses.',
  voice: 'en-us-ava:DragonHDLatestNeural',
  recognitionLanguage: 'auto',
  turnDetectionType: 'server_vad',
  removeFillerWords: false,
  useNoiseSuppression: false,
  useEchoCancellation: false,
  temperature: 0.9,
  avatar: { ...DEFAULT_AVATAR_CONFIG },
  enableFunctionCalling: true,
  functions: {
    enableDateTime: true,
  },
};

export const CHAT_MODEL_OPTIONS = [
  { id: 'gpt-realtime', name: 'GPT Realtime' },
  { id: 'gpt-realtime-mini', name: 'GPT Realtime Mini' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-4.1', name: 'GPT-4.1' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
  { id: 'gpt-5-chat', name: 'GPT-5' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini' },
];

export const RECOGNITION_LANGUAGES = [
  { code: 'auto', name: 'Auto Detect' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'de-DE', name: 'German' },
  { code: 'fr-FR', name: 'French' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-MX', name: 'Spanish (Mexico)' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'hi-IN', name: 'Hindi' },
];

export const CHAT_VOICES = [
  // Azure HD Voices (DragonHD)
  { id: 'en-us-ava:DragonHDLatestNeural', name: 'Ava (DragonHD)' },
  { id: 'en-us-andrew:DragonHDLatestNeural', name: 'Andrew (DragonHD)' },
  { id: 'en-us-emma:DragonHDLatestNeural', name: 'Emma (DragonHD)' },
  { id: 'en-us-steffan:DragonHDLatestNeural', name: 'Steffan (DragonHD)' },
  { id: 'zh-cn-xiaochen:DragonHDLatestNeural', name: 'Xiaochen (DragonHD)' },
  { id: 'ja-jp-masaru:DragonHDLatestNeural', name: 'Masaru (DragonHD)' },
  { id: 'de-DE-Seraphina:DragonHDLatestNeural', name: 'Seraphina (DragonHD)' },
  // Azure Multilingual Voices
  { id: 'en-US-AvaMultilingualNeural', name: 'Ava Multilingual' },
  { id: 'en-US-AndrewMultilingualNeural', name: 'Andrew Multilingual' },
  { id: 'en-US-EmmaMultilingualNeural', name: 'Emma Multilingual' },
  { id: 'en-US-BrianMultilingualNeural', name: 'Brian Multilingual' },
  { id: 'zh-CN-XiaoxiaoMultilingualNeural', name: 'Xiaoxiao Multilingual' },
  // OpenAI Voices
  { id: 'alloy', name: 'Alloy (OpenAI)' },
  { id: 'ash', name: 'Ash (OpenAI)' },
  { id: 'ballad', name: 'Ballad (OpenAI)' },
  { id: 'coral', name: 'Coral (OpenAI)' },
  { id: 'echo', name: 'Echo (OpenAI)' },
  { id: 'sage', name: 'Sage (OpenAI)' },
  { id: 'shimmer', name: 'Shimmer (OpenAI)' },
  { id: 'verse', name: 'Verse (OpenAI)' },
];

export const VIDEO_AVATARS = [
  { id: 'lisa-casual-sitting', name: 'Lisa (Casual Sitting)', character: 'lisa', style: 'casual-sitting' },
  { id: 'harry-business', name: 'Harry (Business)', character: 'harry', style: 'business' },
  { id: 'harry-casual', name: 'Harry (Casual)', character: 'harry', style: 'casual' },
  { id: 'harry-youthful', name: 'Harry (Youthful)', character: 'harry', style: 'youthful' },
  { id: 'jeff-business', name: 'Jeff (Business)', character: 'jeff', style: 'business' },
  { id: 'jeff-formal', name: 'Jeff (Formal)', character: 'jeff', style: 'formal' },
  { id: 'lori-casual', name: 'Lori (Casual)', character: 'lori', style: 'casual' },
  { id: 'lori-formal', name: 'Lori (Formal)', character: 'lori', style: 'formal' },
  { id: 'lori-graceful', name: 'Lori (Graceful)', character: 'lori', style: 'graceful' },
  { id: 'max-business', name: 'Max (Business)', character: 'max', style: 'business' },
  { id: 'max-casual', name: 'Max (Casual)', character: 'max', style: 'casual' },
  { id: 'max-formal', name: 'Max (Formal)', character: 'max', style: 'formal' },
  { id: 'meg-business', name: 'Meg (Business)', character: 'meg', style: 'business' },
  { id: 'meg-casual', name: 'Meg (Casual)', character: 'meg', style: 'casual' },
  { id: 'meg-formal', name: 'Meg (Formal)', character: 'meg', style: 'formal' },
];

export const PHOTO_AVATARS = [
  { id: 'adrian', name: 'Adrian' },
  { id: 'amara', name: 'Amara' },
  { id: 'amira', name: 'Amira' },
  { id: 'anika', name: 'Anika' },
  { id: 'bianca', name: 'Bianca' },
  { id: 'camila', name: 'Camila' },
  { id: 'carlos', name: 'Carlos' },
  { id: 'clara', name: 'Clara' },
  { id: 'darius', name: 'Darius' },
  { id: 'diego', name: 'Diego' },
  { id: 'elise', name: 'Elise' },
  { id: 'farhan', name: 'Farhan' },
  { id: 'faris', name: 'Faris' },
  { id: 'gabrielle', name: 'Gabrielle' },
  { id: 'hyejin', name: 'Hyejin' },
  { id: 'imran', name: 'Imran' },
  { id: 'isabella', name: 'Isabella' },
  { id: 'layla', name: 'Layla' },
  { id: 'ling', name: 'Ling' },
  { id: 'liwei', name: 'Liwei' },
  { id: 'marcus', name: 'Marcus' },
  { id: 'matteo', name: 'Matteo' },
  { id: 'rahul', name: 'Rahul' },
  { id: 'rana', name: 'Rana' },
  { id: 'ren', name: 'Ren' },
  { id: 'riya', name: 'Riya' },
  { id: 'sakura', name: 'Sakura' },
  { id: 'simone', name: 'Simone' },
  { id: 'zayd', name: 'Zayd' },
  { id: 'zoe', name: 'Zoe' },
];

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'status' | 'error';
  content: string;
  timestamp: number;
}
