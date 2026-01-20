// Hook for Fast Transcription API using Azure Speech REST API

import { useState, useCallback } from 'react';
import { AzureSettings } from '../types/azure';
import { FastTranscript, TranscriptSegment, WordTiming } from '../types/transcription';
import { STTState } from '../types/stt';
import { convertToWav16kHz } from '../utils/audioConversion';

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

      // Use en-US as default if auto-detect is selected (Fast API doesn't support auto-detect)
      const languageCode = language === 'auto' ? 'en-US' : language;

      if (language === 'auto') {
        console.warn('Auto-detect not supported for Fast Transcription, defaulting to en-US');
      }

      // Call Fast Transcription API
      const endpoint = `https://${settings.region}.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions:transcribe?language=${languageCode}`;

      setProgress(50);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': settings.apiKey,
        },
        body: wavBlob
      });

      setProgress(70);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      setProgress(90);

      // Parse the transcription result
      const parsedTranscript = parseTranscriptResult(result, languageCode);
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
 * Parse Fast Transcription API response
 */
function parseTranscriptResult(apiResponse: any, language: string): FastTranscript {
  // Extract full text from combinedRecognizedPhrases
  const fullText = apiResponse.combinedRecognizedPhrases?.[0]?.display || '';

  // Parse segments from recognizedPhrases
  const segments: TranscriptSegment[] = (apiResponse.recognizedPhrases || []).map((phrase: any) => {
    const nBest = phrase.nBest?.[0];
    if (!nBest) {
      return null;
    }

    // Parse ISO 8601 duration format (PT0S, PT1.5S, etc.)
    const offset = parseISO8601Duration(phrase.offset || 'PT0S');
    const duration = parseISO8601Duration(phrase.duration || 'PT0S');
    const confidence = nBest.confidence || 0.9;

    // Parse word-level timings
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
