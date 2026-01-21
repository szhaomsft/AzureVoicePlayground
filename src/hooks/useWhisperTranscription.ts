// Hook for Whisper Batch Transcription using Azure Batch ASR API

import { useState, useCallback, useRef } from 'react';
import { AzureSettings } from '../types/azure';
import { WhisperTranscript, TranscriptSegment, WordTiming } from '../types/transcription';
import { STTState } from '../types/stt';
import { convertToWav16kHz } from '../utils/audioConversion';

interface UseWhisperTranscriptionReturn {
  state: STTState;
  transcript: WhisperTranscript | null;
  error: string;
  jobId: string;
  pollingStatus: string;
  transcribe: (audioFile: File | Blob, language: string) => Promise<void>;
  cancelJob: () => void;
  reset: () => void;
}

/**
 * Hook for Whisper transcription via Batch ASR API with polling
 */
export function useWhisperTranscription(settings: AzureSettings): UseWhisperTranscriptionReturn {
  const [state, setState] = useState<STTState>('idle');
  const [transcript, setTranscript] = useState<WhisperTranscript | null>(null);
  const [error, setError] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [pollingStatus, setPollingStatus] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);

  const transcribe = useCallback(async (audioFile: File | Blob, language: string) => {
    try {
      setState('processing');
      setError('');
      setJobId('');
      setPollingStatus('Preparing audio...');

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Validate file size (limit to 10 MB for data URL approach)
      if (audioFile.size > 10 * 1024 * 1024) {
        throw new Error('Audio file must be less than 10 MB for Whisper API (data URL limitation)');
      }

      // Note: Whisper Batch API requires publicly accessible URLs
      // Data URLs may not be supported - this is experimental
      throw new Error('Whisper API requires publicly accessible audio URLs. Data URLs are not supported. Please use Azure Blob Storage or a public URL.');

      // Convert audio to WAV format
      const wavBlob = await convertToWav16kHz(audioFile);

      // Convert to base64 data URL
      setPollingStatus('Converting audio to data URL...');
      const dataUrl = await blobToDataURL(wavBlob);

      // Use en-US as default if auto-detect is selected
      const languageCode = language === 'auto' ? 'en-US' : language;

      // Create transcription job
      setPollingStatus('Creating transcription job...');
      const jobUrl = await createTranscriptionJob(
        settings,
        dataUrl,
        languageCode,
        abortControllerRef.current!.signal
      );

      // Extract job ID from URL
      const jobIdMatch = jobUrl.match(/transcriptions\/([^/]+)/);
      const extractedJobId = jobIdMatch?.[1] ?? jobUrl;
      setJobId(extractedJobId);

      // Poll for completion
      setPollingStatus('Waiting for transcription...');
      const job = await pollJobStatus(
        settings,
        jobUrl,
        setPollingStatus,
        abortControllerRef.current!.signal
      );

      if (job.status === 'Failed') {
        throw new Error(job.properties?.error || 'Transcription job failed');
      }

      // Retrieve transcription results
      setPollingStatus('Retrieving results...');
      const whisperTranscript = await getTranscriptionResults(
        settings,
        jobUrl,
        extractedJobId,
        languageCode,
        abortControllerRef.current!.signal
      );

      setTranscript(whisperTranscript);
      setState('completed');
      setPollingStatus('Completed');

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Transcription cancelled');
        setPollingStatus('Cancelled');
      } else {
        setError(err.message || 'Transcription failed');
        setPollingStatus('Failed');
      }
      setState('error');
    }
  }, [settings]);

  const cancelJob = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const reset = useCallback(() => {
    cancelJob();
    setState('idle');
    setTranscript(null);
    setError('');
    setJobId('');
    setPollingStatus('');
  }, [cancelJob]);

  return {
    state,
    transcript,
    error,
    jobId,
    pollingStatus,
    transcribe,
    cancelJob,
    reset
  };
}

/**
 * Convert Blob to Data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Create Whisper transcription job
 */
async function createTranscriptionJob(
  settings: AzureSettings,
  audioDataUrl: string,
  language: string,
  signal: AbortSignal
): Promise<string> {
  // First, get the Whisper model ID
  const modelsEndpoint = `https://${settings.region}.api.cognitive.microsoft.com/speechtotext/models/base?api-version=2024-11-15`;

  const modelsResponse = await fetch(modelsEndpoint, {
    headers: {
      'Ocp-Apim-Subscription-Key': settings.apiKey
    },
    signal
  });

  if (!modelsResponse.ok) {
    throw new Error(`Failed to get Whisper model (${modelsResponse.status})`);
  }

  const modelData = await modelsResponse.json();
  const modelSelf = modelData.self; // Use the full model URL from the response

  // Create transcription job
  const endpoint = `https://${settings.region}.api.cognitive.microsoft.com/speechtotext/transcriptions:submit?api-version=2024-11-15`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': settings.apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contentUrls: [audioDataUrl],
      locale: language,
      displayName: `Whisper Transcription ${Date.now()}`,
      model: {
        self: modelSelf
      },
      properties: {
        wordLevelTimestampsEnabled: true
      }
    }),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Whisper API Error:', errorText);
    console.error('Request body:', JSON.stringify({
      contentUrls: [audioDataUrl.substring(0, 100) + '...'],
      locale: language,
      displayName: `Whisper Transcription ${Date.now()}`,
      model: { self: modelSelf },
      properties: { wordLevelTimestampsEnabled: true }
    }, null, 2));
    throw new Error(`Failed to create transcription job (${response.status}): ${errorText}`);
  }

  const job = await response.json();
  return job.self; // Job URL for polling
}

/**
 * Poll job status until completion
 */
async function pollJobStatus(
  settings: AzureSettings,
  jobUrl: string,
  setStatus: (status: string) => void,
  signal: AbortSignal
): Promise<any> {
  const maxAttempts = 150; // 5 minutes at 2-second intervals
  let attempts = 0;
  let delay = 2000; // Start at 2 seconds
  const maxDelay = 5000; // Max 5 seconds

  while (attempts < maxAttempts) {
    const response = await fetch(jobUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': settings.apiKey
      },
      signal
    });

    if (!response.ok) {
      throw new Error(`Failed to poll job status (${response.status})`);
    }

    const job = await response.json();
    setStatus(`Status: ${job.status}${job.status === 'Running' ? ` (${attempts * delay / 1000}s elapsed)` : ''}`);

    if (job.status === 'Succeeded' || job.status === 'Failed') {
      return job;
    }

    // Wait before next poll
    await sleep(delay);

    // Exponential backoff after 15 attempts
    if (attempts > 15) {
      delay = maxDelay;
    }

    attempts++;
  }

  throw new Error('Transcription timeout after 5 minutes');
}

/**
 * Retrieve transcription results
 */
async function getTranscriptionResults(
  settings: AzureSettings,
  jobUrl: string,
  jobId: string,
  language: string,
  signal: AbortSignal
): Promise<WhisperTranscript> {
  // Get files list
  const filesResponse = await fetch(`${jobUrl}/files`, {
    headers: {
      'Ocp-Apim-Subscription-Key': settings.apiKey
    },
    signal
  });

  if (!filesResponse.ok) {
    throw new Error(`Failed to get transcription files (${filesResponse.status})`);
  }

  const files = await filesResponse.json();
  const transcriptFile = files.values?.find((f: any) => f.kind === 'Transcription');

  if (!transcriptFile) {
    throw new Error('Transcription file not found');
  }

  // Download transcription content
  const transcriptResponse = await fetch(transcriptFile.links.contentUrl, { signal });

  if (!transcriptResponse.ok) {
    throw new Error(`Failed to download transcription (${transcriptResponse.status})`);
  }

  const transcriptData = await transcriptResponse.json();

  // Parse result
  return parseWhisperTranscript(transcriptData, jobId, language);
}

/**
 * Parse Whisper transcription result
 */
function parseWhisperTranscript(data: any, jobId: string, language: string): WhisperTranscript {
  const combinedPhrases = data.combinedRecognizedPhrases || [];
  const fullText = combinedPhrases[0]?.display || '';

  const segments: TranscriptSegment[] = (data.recognizedPhrases || []).map((phrase: any) => {
    const nBest = phrase.nBest?.[0];
    if (!nBest) return null;

    const offset = parseISO8601Duration(phrase.offset || 'PT0S');
    const duration = parseISO8601Duration(phrase.duration || 'PT0S');
    const confidence = nBest.confidence || 0.95;

    const words: WordTiming[] | undefined = nBest.words?.map((word: any) => ({
      text: word.word,
      offset: parseISO8601Duration(word.offset),
      duration: parseISO8601Duration(word.duration),
      confidence: word.confidence || confidence
    }));

    // Extract locale from phrase or use the specified language
    const locale = phrase.locale || language;

    return {
      text: nBest.display,
      offset,
      duration,
      confidence,
      words,
      locale
    };
  }).filter(Boolean);

  const totalDuration = segments.length > 0
    ? Math.max(...segments.map(s => s.offset + s.duration))
    : 0;

  return {
    fullText,
    segments,
    language,
    duration: totalDuration,
    jobId
  };
}

/**
 * Parse ISO 8601 duration to milliseconds
 */
function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?/);

  if (!match) return 0;

  const hours = parseFloat(match[1] || '0');
  const minutes = parseFloat(match[2] || '0');
  const seconds = parseFloat(match[3] || '0');

  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
