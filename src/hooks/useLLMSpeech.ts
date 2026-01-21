// Hook for LLM Speech API - Large Language Model enhanced transcription
// https://learn.microsoft.com/en-us/azure/ai-services/speech-service/llm-speech

import { useState, useCallback } from 'react';
import { AzureSettings } from '../types/azure';
import { FastTranscript, TranscriptSegment, WordTiming } from '../types/transcription';
import { STTState } from '../types/stt';
import { convertToWav16kHz } from '../utils/audioConversion';

// LLM Speech supported languages (9 locales)
// Uses full BCP-47 locale codes for consistency with other STT models
export const LLM_SPEECH_LANGUAGES = [
  { code: 'en-US', name: 'English', nativeName: 'English (United States)' },
  { code: 'zh-CN', name: 'Chinese', nativeName: '中文 (简体)' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch (Deutschland)' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français (France)' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano (Italia)' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語 (日本)' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español (España)' },
  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português (Brasil)' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어 (대한민국)' },
];

export type LLMSpeechTask = 'transcribe' | 'translate';

export interface LLMSpeechOptions {
  task?: LLMSpeechTask;
  targetLanguage?: string; // For translation task
  prompt?: string[]; // Prompt tuning
  enableDiarization?: boolean;
  maxSpeakers?: number;
}

interface UseLLMSpeechReturn {
  state: STTState;
  transcript: FastTranscript | null;
  error: string;
  progress: number;
  transcribe: (audioFile: File | Blob, language: string, options?: LLMSpeechOptions) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for LLM-enhanced speech transcription via REST API
 */
export function useLLMSpeech(settings: AzureSettings): UseLLMSpeechReturn {
  const [state, setState] = useState<STTState>('idle');
  const [transcript, setTranscript] = useState<FastTranscript | null>(null);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  const transcribe = useCallback(async (
    audioFile: File | Blob,
    language: string,
    options: LLMSpeechOptions = {}
  ) => {
    try {
      setState('processing');
      setError('');
      setProgress(0);

      // Validate file size (300 MB limit for LLM Speech)
      if (audioFile.size > 300 * 1024 * 1024) {
        throw new Error('Audio file must be less than 300 MB for LLM Speech API');
      }

      setProgress(10);

      // Convert audio to WAV format
      const wavBlob = await convertToWav16kHz(audioFile);
      setProgress(30);

      // Extract base language code (e.g., 'en-US' -> 'en', 'zh-CN' -> 'zh')
      // LLM Speech API uses 2-letter language codes
      const baseLanguageCode = language.split('-')[0];

      // Build the definition object for LLM Speech
      const definition: Record<string, any> = {
        enhancedMode: {
          enabled: true,
          task: options.task || 'transcribe',
        }
      };

      // Add target language for translation
      if (options.task === 'translate' && options.targetLanguage) {
        // Also extract base code from target language
        const targetBaseCode = options.targetLanguage.split('-')[0];
        definition.enhancedMode.targetLanguage = targetBaseCode;
      }

      // Add prompt if provided
      if (options.prompt && options.prompt.length > 0) {
        definition.enhancedMode.prompt = options.prompt;
      }

      // Add diarization if enabled
      if (options.enableDiarization) {
        definition.diarization = {
          enabled: true,
          maxSpeakers: options.maxSpeakers || 2
        };
      }

      // Call LLM Speech API (uses the same endpoint as Fast Transcription with enhanced mode)
      const endpoint = `https://${settings.region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2024-11-15`;

      setProgress(50);

      // Create FormData with audio and definition
      const formData = new FormData();
      formData.append('audio', wavBlob, 'audio.wav');
      formData.append('definition', JSON.stringify(definition));

      console.log('LLM Speech API Request:', definition);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': settings.apiKey,
        },
        body: formData
      });

      setProgress(70);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      setProgress(90);

      console.log('LLM Speech API Response:', result);

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

/**
 * Parse LLM Speech API response
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
      // Handle both milliseconds and ticks formats
      const offset = phrase.offsetMilliseconds ?? parseTimestamp(phrase.offset || phrase.offsetInTicks || 0);
      const duration = phrase.durationMilliseconds ?? parseTimestamp(phrase.duration || phrase.durationInTicks || 0);
      // Note: LLM Speech confidence is always 0
      const confidence = phrase.confidence || 0;
      const text = phrase.text || '';

      // Parse word-level timings if available (not available for translate task)
      const words: WordTiming[] | undefined = phrase.words?.map((word: any) => ({
        text: word.text || word.word,
        offset: word.offsetMilliseconds ?? parseTimestamp(word.offset || word.offsetInTicks || 0),
        duration: word.durationMilliseconds ?? parseTimestamp(word.duration || word.durationInTicks || 0),
        confidence: word.confidence || confidence
      }));

      // Parse speaker info if diarization is enabled
      const speaker = phrase.speaker;

      return {
        text,
        offset,
        duration,
        confidence,
        words,
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
    // Convert from ticks (100-nanosecond units) to milliseconds
    return value / 10000;
  }
  if (typeof value === 'string') {
    // Try ISO 8601 duration format
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
