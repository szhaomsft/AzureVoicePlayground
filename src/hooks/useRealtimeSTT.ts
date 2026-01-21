// Hook for Realtime Speech-to-Text using Azure Speech SDK

import { useState, useCallback, useRef, useEffect } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { AzureSettings } from '../types/azure';
import { RealtimeTranscript, TranscriptSegment, WordTiming } from '../types/transcription';
import { STTState } from '../types/stt';
import { convertToWav16kHz } from '../utils/audioConversion';

// Languages supported for auto-detection (Language Identification)
// Use one locale per language as per Azure documentation
// https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=language-identification
// Note: Language identification only supports up to 4 languages in DetectAudioAtStart mode
const AUTO_DETECT_LANGUAGES = [
  'en-US',  // English
  'zh-CN',  // Chinese (Simplified)
  'ja-JP',  // Japanese
  'ko-KR',  // Korean
];

interface UseRealtimeSTTReturn {
  state: STTState;
  transcript: RealtimeTranscript | null;
  error: string;
  startRecognition: (audioSource: File | Blob, language: string) => Promise<void>;
  stopRecognition: () => void;
  reset: () => void;
}

/**
 * Hook for real-time speech recognition via Azure Speech SDK
 */
export function useRealtimeSTT(settings: AzureSettings): UseRealtimeSTTReturn {
  const [state, setState] = useState<STTState>('idle');
  const [transcript, setTranscript] = useState<RealtimeTranscript | null>(null);
  const [error, setError] = useState<string>('');

  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const pushStreamRef = useRef<SpeechSDK.PushAudioInputStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.close();
      }
      if (pushStreamRef.current) {
        pushStreamRef.current.close();
      }
    };
  }, []);

  const startRecognition = useCallback(async (audioSource: File | Blob, language: string) => {
    try {
      setState('processing');
      setError('');

      // Convert audio to required format (WAV PCM 16kHz mono)
      const wavBlob = await convertToWav16kHz(audioSource);

      // Initialize Speech SDK
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        settings.apiKey,
        settings.region
      );

      // Enable detailed output for word-level timestamps
      speechConfig.outputFormat = SpeechSDK.OutputFormat.Detailed;

      // Create push stream for audio input
      const pushStream = SpeechSDK.AudioInputStream.createPushStream();
      pushStreamRef.current = pushStream;

      const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(pushStream);

      // Create recognizer - use AutoDetectSourceLanguageConfig for auto-detect
      let recognizer: SpeechSDK.SpeechRecognizer;

      if (language === 'auto') {
        // Use AutoDetectSourceLanguageConfig with candidate languages
        const autoDetectConfig = SpeechSDK.AutoDetectSourceLanguageConfig.fromLanguages(AUTO_DETECT_LANGUAGES);
        recognizer = SpeechSDK.SpeechRecognizer.FromConfig(speechConfig, autoDetectConfig, audioConfig);
        console.log('Auto-detect enabled with languages:', AUTO_DETECT_LANGUAGES);
      } else {
        // Set specific language
        speechConfig.speechRecognitionLanguage = language;
        recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      }

      recognizerRef.current = recognizer;

      // Initialize transcript
      setTranscript({
        text: '',
        segments: [],
        isStreaming: true,
        isFinal: false,
        interimText: ''
      });

      // Handle interim results (recognizing event)
      recognizer.recognizing = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizingSpeech) {
          setTranscript(prev => prev ? {
            ...prev,
            interimText: e.result.text,
            isStreaming: true
          } : null);
        }
      };

      // Handle final recognized segments
      recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const text = e.result.text;
          const offset = e.result.offset / 10000; // Convert to milliseconds
          const duration = e.result.duration / 10000;

          // Parse detailed result for confidence, word timings, and locale
          let confidence = 0.9; // Default confidence
          let words: WordTiming[] | undefined;
          let locale: string | undefined;

          try {
            const detailedResult = JSON.parse(
              e.result.properties.getProperty(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult)
            );

            console.log('Realtime STT Detailed Result:', detailedResult);

            if (detailedResult.NBest && detailedResult.NBest.length > 0) {
              const best = detailedResult.NBest[0];
              confidence = best.Confidence || 0.9;

              // Extract word-level timings
              if (best.Words) {
                words = best.Words.map((word: any) => ({
                  text: word.Word,
                  offset: word.Offset / 10000,
                  duration: word.Duration / 10000,
                  confidence: word.Confidence || confidence
                }));
              }
            }

            // Try to get locale from detailed result
            locale = detailedResult.PrimaryLanguage?.Language || detailedResult.Locale;
          } catch (err) {
            console.warn('Could not parse detailed result:', err);
          }

          // Fallback: Get detected language from auto-detect property
          if (!locale) {
            const detectedLanguage = e.result.properties.getProperty(
              SpeechSDK.PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages
            );
            if (detectedLanguage) {
              console.log(`Detected language: ${detectedLanguage}`);
              locale = detectedLanguage;
            } else if (language !== 'auto') {
              // Use the specified language as locale
              locale = language;
            }
          }

          const segment: TranscriptSegment = {
            text,
            offset,
            duration,
            confidence,
            words,
            locale
          };

          setTranscript(prev => {
            if (!prev) return null;

            const newSegments = [...prev.segments, segment];
            const fullText = newSegments.map(s => s.text).join(' ');

            return {
              ...prev,
              text: fullText,
              segments: newSegments,
              interimText: '' // Clear interim text after recognition
            };
          });
        } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
          console.warn('No speech could be recognized');
        }
      };

      // Handle cancellation/errors
      recognizer.canceled = (s, e) => {
        if (e.reason === SpeechSDK.CancellationReason.Error) {
          setError(e.errorDetails || 'Recognition error occurred');
          setState('error');
        }

        setTranscript(prev => prev ? { ...prev, isStreaming: false, isFinal: true } : null);
        recognizer.stopContinuousRecognitionAsync();
      };

      // Handle session stopped
      recognizer.sessionStopped = (s, e) => {
        setTranscript(prev => prev ? { ...prev, isStreaming: false, isFinal: true } : null);
        setState('completed');
        recognizer.stopContinuousRecognitionAsync();
      };

      // Start continuous recognition
      recognizer.startContinuousRecognitionAsync(
        () => {
          setState('streaming');
        },
        (err) => {
          setError(`Failed to start recognition: ${err}`);
          setState('error');
        }
      );

      // Feed audio data to push stream
      const arrayBuffer = await wavBlob.arrayBuffer();
      const audioData = new Uint8Array(arrayBuffer);

      // Push audio in chunks (simulate streaming)
      const chunkSize = 3200; // 100ms at 16kHz
      let offset = 44; // Skip WAV header

      const pushChunks = () => {
        if (offset < audioData.length) {
          const chunk = audioData.slice(offset, offset + chunkSize);
          pushStream.write(chunk.buffer);
          offset += chunkSize;

          // Continue pushing chunks
          setTimeout(pushChunks, 100);
        } else {
          // All data pushed, close stream
          pushStream.close();
        }
      };

      pushChunks();

    } catch (err: any) {
      setError(err.message || 'Failed to start recognition');
      setState('error');
    }
  }, [settings]);

  const stopRecognition = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync(
        () => {
          setTranscript(prev => prev ? { ...prev, isStreaming: false, isFinal: true } : null);
          setState('completed');
        },
        (err) => {
          console.error('Error stopping recognition:', err);
        }
      );
    }
  }, []);

  const reset = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.close();
      recognizerRef.current = null;
    }
    if (pushStreamRef.current) {
      pushStreamRef.current.close();
      pushStreamRef.current = null;
    }

    setState('idle');
    setTranscript(null);
    setError('');
  }, []);

  return {
    state,
    transcript,
    error,
    startRecognition,
    stopRecognition,
    reset
  };
}
