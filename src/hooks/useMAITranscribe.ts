// Hook for MAI-Transcribe-2 model via LLM Speech API
// https://learn.microsoft.com/en-us/azure/ai-services/speech-service/mai-transcribe

import { useState, useCallback } from 'react';
import { AzureSettings } from '../types/azure';
import { FastTranscript, TranscriptSegment, WordTiming } from '../types/transcription';
import { STTState } from '../types/stt';
import { convertToWav16kHz } from '../utils/audioConversion';

const MAI_TRANSCRIBE_MODEL = 'MAI-Transcribe-2';
const MAI_TRANSCRIBE_MAX_FILE_SIZE_BYTES = 300 * 1024 * 1024;

// MAI-Transcribe-2 supported languages (60 languages)
export const MAI_TRANSCRIBE_LANGUAGES = [
  { code: 'af-ZA', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية' },
  { code: 'as-IN', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'az-AZ', name: 'Azerbaijani', nativeName: 'Azərbaycan dili' },
  { code: 'bg-BG', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'bs-BA', name: 'Bosnian', nativeName: 'Bosanski' },
  { code: 'ca-ES', name: 'Catalan', nativeName: 'Català' },
  { code: 'cs-CZ', name: 'Czech', nativeName: 'Čeština' },
  { code: 'da-DK', name: 'Danish', nativeName: 'Dansk' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch (Deutschland)' },
  { code: 'el-GR', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'en-US', name: 'English', nativeName: 'English (United States)' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español (España)' },
  { code: 'et-EE', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'fa-IR', name: 'Persian', nativeName: 'فارسی' },
  { code: 'fi-FI', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'fil-PH', name: 'Filipino', nativeName: 'Filipino' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français (France)' },
  { code: 'gl-ES', name: 'Galician', nativeName: 'Galego' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'he-IL', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'hu-HU', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'hy-AM', name: 'Armenian', nativeName: 'Հայերեն' },
  { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'is-IS', name: 'Icelandic', nativeName: 'Íslenska' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano (Italia)' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語 (日本)' },
  { code: 'kk-KZ', name: 'Kazakh', nativeName: 'Қазақ тілі' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어 (대한민국)' },
  { code: 'lt-LT', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'lv-LV', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'mk-MK', name: 'Macedonian', nativeName: 'Македонски' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ms-MY', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'nb-NO', name: 'Norwegian Bokmål', nativeName: 'Norsk bokmål' },
  { code: 'ne-NP', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'or-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski' },
  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português (Brasil)' },
  { code: 'ro-RO', name: 'Romanian', nativeName: 'Română' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский' },
  { code: 'sk-SK', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'sl-SI', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'sv-SE', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'sw-KE', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'th-TH', name: 'Thai', nativeName: 'ไทย' },
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'uk-UA', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'ur-PK', name: 'Urdu', nativeName: 'اردو' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'yue-HK', name: 'Cantonese', nativeName: '粵語' },
  { code: 'zh-CN', name: 'Chinese', nativeName: '中文 (简体)' },
];

export interface MAITranscribeOptions {
  enableDiarization?: boolean;
}

interface UseMAITranscribeReturn {
  state: STTState;
  transcript: FastTranscript | null;
  error: string;
  progress: number;
  transcribe: (audioFile: File | Blob, language: string, options?: MAITranscribeOptions) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for MAI-Transcribe-2 speech transcription via LLM Speech API
 */
export function useMAITranscribe(settings: AzureSettings): UseMAITranscribeReturn {
  const [state, setState] = useState<STTState>('idle');
  const [transcript, setTranscript] = useState<FastTranscript | null>(null);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  const transcribe = useCallback(async (
    audioFile: File | Blob,
    language: string,
    options: MAITranscribeOptions = {}
  ) => {
    try {
      setState('processing');
      setError('');
      setProgress(0);

      // Validate file size (300 MB limit)
      if (audioFile.size > MAI_TRANSCRIBE_MAX_FILE_SIZE_BYTES) {
        throw new Error('Audio file must be less than 300 MB for MAI-Transcribe-2');
      }

      setProgress(10);

      // Convert audio to WAV format
      const wavBlob = await convertToWav16kHz(audioFile);
      setProgress(30);

      // Call LLM Speech API endpoint with MAI-Transcribe-2 model
      const endpoint = `https://${settings.region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2025-10-15`;

      setProgress(50);

      const definition = buildMAITranscribeDefinition(language, options);
      console.log('MAI-Transcribe-2 API Request:', definition);

      const result = await postTranscription(endpoint, settings.apiKey, wavBlob, definition);

      setProgress(70);
      setProgress(90);

      console.log('MAI-Transcribe-2 API Response:', result);

      // Parse the transcription result
      const parsedTranscript = parseTranscriptResult(result, language);
      setTranscript(parsedTranscript);
      setProgress(100);
      setState('completed');

    } catch (err: any) {
      setError(err.message || 'Transcription failed');
      setState('error');
      setProgress(0);
    }
  }, [settings]);

  const reset = useCallback(() => {
    setState('idle');
    setTranscript(null);
    setError('');
    setProgress(0);
  }, []);

  return {
    state,
    transcript,
    error,
    progress,
    transcribe,
    reset
  };
}

function buildMAITranscribeDefinition(
  language: string,
  options: MAITranscribeOptions
): Record<string, any> {
  const definition: Record<string, any> = {
    enhancedMode: {
      enabled: true,
      model: MAI_TRANSCRIBE_MODEL,
      modelOptions: {
        timestamps: 'word',
      },
    }
  };

  if (options.enableDiarization) {
    definition.diarization = {
      enabled: true,
    };
  }

  if (language !== 'auto') {
    definition.locales = [language.split('-')[0].toLowerCase()];
  }

  return definition;
}

async function postTranscription(
  endpoint: string,
  apiKey: string,
  wavBlob: Blob,
  definition: Record<string, any>
): Promise<any> {
  const formData = new FormData();
  formData.append('audio', wavBlob, 'audio.wav');
  formData.append('definition', JSON.stringify(definition));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
    },
    body: formData
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`API request failed (${response.status}): ${responseText}`);
  }

  return response.json();
}

/**
 * Parse MAI-Transcribe-2 API response (same format as LLM Speech)
 */
function parseTranscriptResult(apiResponse: any, language: string): FastTranscript {
  let fullText = '';
  let segments: TranscriptSegment[] = [];

  // Try to extract from combinedPhrases
  if (apiResponse.combinedPhrases && apiResponse.combinedPhrases.length > 0) {
    fullText = apiResponse.combinedPhrases[0].text || '';
  }

  // Parse segments from phrases
  if (apiResponse.phrases && Array.isArray(apiResponse.phrases)) {
    segments = apiResponse.phrases.map((phrase: any) => {
      const offset = phrase.offsetMilliseconds ?? parseTimestamp(phrase.offset || phrase.offsetInTicks || 0);
      const duration = phrase.durationMilliseconds ?? parseTimestamp(phrase.duration || phrase.durationInTicks || 0);
      const confidence = phrase.confidence || 0;
      const text = phrase.text || '';

      // Parse word-level timings if available
      const words: WordTiming[] | undefined = phrase.words?.map((word: any) => ({
        text: word.text || word.word,
        offset: word.offsetMilliseconds ?? parseTimestamp(word.offset || word.offsetInTicks || 0),
        duration: word.durationMilliseconds ?? parseTimestamp(word.duration || word.durationInTicks || 0),
        confidence: word.confidence || confidence
      }));

      const locale = phrase.locale;
      const speaker = phrase.speaker;

      return {
        text,
        offset,
        duration,
        confidence,
        words,
        locale,
        speaker
      };
    }).filter((seg: any) => seg.text);
  }

  // Calculate total duration
  const totalDuration = segments.length > 0
    ? Math.max(...segments.map(s => s.offset + s.duration))
    : 0;

  return {
    fullText,
    segments,
    language,
    duration: totalDuration
  };
}

/**
 * Parse timestamp - handles both ticks (100-nanosecond units) and ISO 8601 duration
 */
function parseTimestamp(value: any): number {
  if (typeof value === 'number') {
    return value / 10000;
  }
  if (typeof value === 'string') {
    return parseISO8601Duration(value);
  }
  return 0;
}

/**
 * Parse ISO 8601 duration to milliseconds
 */
function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?/);

  if (!match) {
    return 0;
  }

  const hours = parseFloat(match[1] || '0');
  const minutes = parseFloat(match[2] || '0');
  const seconds = parseFloat(match[3] || '0');

  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}
