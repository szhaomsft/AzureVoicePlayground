// Hook for Fast Transcription API using Azure Speech REST API

import { useState, useCallback } from 'react';
import { AzureSettings } from '../types/azure';
import { FastTranscript, TranscriptSegment, WordTiming } from '../types/transcription';
import { STTState } from '../types/stt';
import { convertToWav16kHz } from '../utils/audioConversion';
import { FAST_TRANSCRIPTION_LANGUAGES } from '../utils/sttLanguages';

interface UseFastTranscriptionReturn {
  state: STTState;
  transcript: FastTranscript | null;
  error: string;
  progress: number;
  transcribe: (audioFile: File | Blob, language: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for fast transcription via REST API
 */
export function useFastTranscription(settings: AzureSettings): UseFastTranscriptionReturn {
  const [state, setState] = useState<STTState>('idle');
  const [transcript, setTranscript] = useState<FastTranscript | null>(null);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  const transcribe = useCallback(async (audioFile: File | Blob, language: string) => {
    try {
      setState('processing');
      setError('');
      setProgress(0);

      // Validate file size (25 MB limit for Fast Transcription API)
      if (audioFile.size > 25 * 1024 * 1024) {
        throw new Error('Audio file must be less than 25 MB for Fast Transcription API');
      }

      setProgress(10);

      // Convert audio to WAV format
      const wavBlob = await convertToWav16kHz(audioFile);
      setProgress(30);

      // Prepare locales array
      let locales: string[];
      if (language === 'auto') {
        // For auto-detect, pass all supported language codes for Fast Transcription
        locales = FAST_TRANSCRIPTION_LANGUAGES.map(lang => lang.code);
        console.log('Auto-detect enabled, using all Fast Transcription locales:', locales.length);
      } else {
        // Use specific language
        locales = [language];
      }

      // Call Fast Transcription API
      const endpoint = `https://${settings.region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2024-11-15`;

      setProgress(50);

      // Create FormData with audio and definition
      const formData = new FormData();
      formData.append('audio', wavBlob, 'audio.wav');
      formData.append('definition', JSON.stringify({
        locales: locales
      }));

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
 * Parse Fast Transcription API response (2024-11-15 format)
 */
function parseTranscriptResult(apiResponse: any, language: string): FastTranscript {
  console.log('Fast Transcription API Response:', apiResponse);

  // Handle new API format with combinedPhrases
  let fullText = '';
  let segments: TranscriptSegment[] = [];

  // Try to extract from combinedPhrases (new format)
  if (apiResponse.combinedPhrases && apiResponse.combinedPhrases.length > 0) {
    fullText = apiResponse.combinedPhrases[0].text || '';
  }
  // Fallback to combinedRecognizedPhrases (old format)
  else if (apiResponse.combinedRecognizedPhrases && apiResponse.combinedRecognizedPhrases.length > 0) {
    fullText = apiResponse.combinedRecognizedPhrases[0].display || '';
  }

  // Parse segments from phrases (new format)
  if (apiResponse.phrases && Array.isArray(apiResponse.phrases)) {
    segments = apiResponse.phrases.map((phrase: any) => {
      const offset = parseTimestamp(phrase.offset || phrase.offsetInTicks || 0);
      const duration = parseTimestamp(phrase.duration || phrase.durationInTicks || 0);
      const confidence = phrase.confidence || phrase.nBest?.[0]?.confidence || 0.9;
      const text = phrase.text || phrase.nBest?.[0]?.display || '';

      // Parse word-level timings if available
      const words: WordTiming[] | undefined = phrase.words?.map((word: any) => ({
        text: word.word || word.text,
        offset: parseTimestamp(word.offset || word.offsetInTicks || 0),
        duration: parseTimestamp(word.duration || word.durationInTicks || 0),
        confidence: word.confidence || confidence
      }));

      return {
        text,
        offset,
        duration,
        confidence,
        words
      };
    }).filter((seg: any) => seg.text);
  }
  // Fallback to recognizedPhrases (old format)
  else if (apiResponse.recognizedPhrases && Array.isArray(apiResponse.recognizedPhrases)) {
    segments = apiResponse.recognizedPhrases.map((phrase: any) => {
      const nBest = phrase.nBest?.[0];
      if (!nBest) {
        return null;
      }

      const offset = parseISO8601Duration(phrase.offset || 'PT0S');
      const duration = parseISO8601Duration(phrase.duration || 'PT0S');
      const confidence = nBest.confidence || 0.9;

      const words: WordTiming[] | undefined = nBest.words?.map((word: any) => ({
        text: word.word,
        offset: parseISO8601Duration(word.offset),
        duration: parseISO8601Duration(word.duration),
        confidence: word.confidence || confidence
      }));

      return {
        text: nBest.display,
        offset,
        duration,
        confidence,
        words
      };
    }).filter(Boolean);
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
 * Examples: PT0S = 0, PT1.5S = 1500, PT1M30S = 90000
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
