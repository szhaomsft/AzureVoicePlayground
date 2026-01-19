import { useState, useRef, useCallback } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { AzureSettings } from '../types/azure';
import { MultiTalkerState, buildMultiTalkerSSML } from '../types/multiTalker';

interface UseMultiTalkerTTSProps {
  apiKey: string;
  region: string;
}

export function useMultiTalkerTTS({ apiKey, region }: UseMultiTalkerTTSProps) {
  const [state, setState] = useState<MultiTalkerState>('idle');
  const [error, setError] = useState<string>('');
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [generatedSSML, setGeneratedSSML] = useState<string>('');

  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);
  const playerRef = useRef<SpeechSDK.SpeakerAudioDestination | null>(null);
  const audioChunksRef = useRef<Uint8Array[]>([]);
  const playbackStartTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const stopTimeoutRef = useRef<number | null>(null);

  const initializeSynthesizer = useCallback((voiceName: string) => {
    if (synthesizerRef.current) {
      synthesizerRef.current.close();
    }

    console.log('Initializing multi-talker synthesizer with voice:', voiceName);

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(apiKey, region);
    // For SSML, we don't set the voice name here - it's in the SSML
    speechConfig.speechSynthesisOutputFormat =
      SpeechSDK.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;

    // Use speaker output for streaming playback
    const player = new SpeechSDK.SpeakerAudioDestination();
    playerRef.current = player;

    const audioConfig = SpeechSDK.AudioConfig.fromSpeakerOutput(player);
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
    synthesizerRef.current = synthesizer;

    return synthesizer;
  }, [apiKey, region]);

  const synthesize = useCallback(
    (text: string, voiceName: string, locale: string, speakers: string[]) => {
      if (!text.trim()) {
        setError('Please enter some text to synthesize');
        return;
      }

      if (!voiceName) {
        setError('Please select a multi-talker voice');
        return;
      }

      if (speakers.length === 0) {
        setError('No speakers found in voice name');
        return;
      }

      // Build the SSML
      const ssml = buildMultiTalkerSSML(text, voiceName, locale, speakers);
      setGeneratedSSML(ssml);
      console.log('Generated SSML:', ssml);

      setState('synthesizing');
      setError('');
      audioChunksRef.current = [];
      isPlayingRef.current = false;

      const synthesizer = initializeSynthesizer(voiceName);

      // Listen to synthesis events - collect audio
      synthesizer.synthesizing = (_s, e) => {
        if (e.result.audioData) {
          audioChunksRef.current.push(new Uint8Array(e.result.audioData));

          // Start playback on first audio chunk
          if (!isPlayingRef.current && audioChunksRef.current.length === 1) {
            console.log('First audio chunk received - starting playback');
            playbackStartTimeRef.current = Date.now();
            isPlayingRef.current = true;
            setState('playing');
          }
        }
      };

      synthesizer.synthesisStarted = () => {
        setState('synthesizing');
        console.log('Multi-talker synthesis started');
      };

      synthesizer.synthesisCompleted = (_s, e) => {
        // Combine all audio chunks for download
        const totalLength = audioChunksRef.current.reduce(
          (sum, chunk) => sum + chunk.length,
          0
        );
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunksRef.current) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        setAudioData(combined.buffer);

        console.log('Multi-talker synthesis completed - audio size:', totalLength, 'bytes');

        // Calculate audio duration from file size
        // For MP3 at 48kbps, approximate duration: bytes * 8 / bitrate (in seconds)
        const estimatedDurationMs = (totalLength * 8 / 48000) * 1000;

        const currentPlaybackTime = Date.now() - playbackStartTimeRef.current;
        const remainingTime = Math.max(100, estimatedDurationMs - currentPlaybackTime + 300);

        console.log(`Estimated audio duration: ${estimatedDurationMs}ms, will stop in: ${remainingTime}ms`);

        // Start playback if not already started
        if (!isPlayingRef.current) {
          playbackStartTimeRef.current = Date.now();
          isPlayingRef.current = true;
          setState('playing');
        }

        // Clear any existing timeout
        if (stopTimeoutRef.current) {
          clearTimeout(stopTimeoutRef.current);
        }

        // Set timeout to stop playback when audio ends
        stopTimeoutRef.current = setTimeout(() => {
          console.log('Audio playback ended');
          isPlayingRef.current = false;
          setState('idle');
          stopTimeoutRef.current = null;
        }, remainingTime);
      };

      synthesizer.SynthesisCanceled = (_s: any, e: any) => {
        console.error('Multi-talker synthesis canceled:', e.errorDetails);
        setError(e.errorDetails || 'Synthesis was canceled');
        setState('error');
        isPlayingRef.current = false;
      };

      // Start synthesis with SSML
      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            console.log('Multi-talker synthesis completed successfully');
          } else {
            console.error('Multi-talker synthesis failed:', result.errorDetails);
            setError(result.errorDetails || 'Synthesis failed');
            setState('error');
          }
        },
        (error) => {
          console.error('Multi-talker synthesis error:', error);
          setError(error);
          setState('error');
        }
      );
    },
    [initializeSynthesizer]
  );

  const pause = useCallback(() => {
    if (playerRef.current && state === 'playing') {
      playerRef.current.pause();
      setState('paused');
      isPlayingRef.current = false;
    }
  }, [state]);

  const resume = useCallback(() => {
    if (playerRef.current && state === 'paused') {
      playerRef.current.resume();
      setState('playing');
      isPlayingRef.current = true;
    }
  }, [state]);

  const stop = useCallback(() => {
    console.log('Stop called - cleaning up');
    isPlayingRef.current = false;

    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.pause();
    }
    if (synthesizerRef.current) {
      synthesizerRef.current.close();
      synthesizerRef.current = null;
    }
    setState('idle');
  }, []);

  return {
    state,
    error,
    audioData,
    generatedSSML,
    synthesize,
    pause,
    resume,
    stop,
  };
}
