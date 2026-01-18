import { useState, useRef, useCallback } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { AzureSettings, WordBoundary, SynthesisState } from '../types/azure';

export function useAzureTTS(settings: AzureSettings) {
  const [state, setState] = useState<SynthesisState>('idle');
  const [error, setError] = useState<string>('');
  const [wordBoundaries, setWordBoundaries] = useState<WordBoundary[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);

  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);
  const playerRef = useRef<SpeechSDK.SpeakerAudioDestination | null>(null);
  const audioChunksRef = useRef<Uint8Array[]>([]);
  const playbackStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const boundariesRef = useRef<WordBoundary[]>([]);
  const trackingStartedRef = useRef<boolean>(false);

  const initializeSynthesizer = useCallback(() => {
    if (synthesizerRef.current) {
      synthesizerRef.current.close();
    }

    console.log('Initializing synthesizer with voice:', settings.selectedVoice);

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      settings.apiKey,
      settings.region
    );
    speechConfig.speechSynthesisVoiceName = settings.selectedVoice;
    speechConfig.speechSynthesisOutputFormat =
      SpeechSDK.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;

    // Create audio destination for playback
    playerRef.current = new SpeechSDK.SpeakerAudioDestination();

    // Log available properties to see what callbacks exist
    console.log('SpeakerAudioDestination properties:', Object.getOwnPropertyNames(playerRef.current));
    console.log('SpeakerAudioDestination prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(playerRef.current)));

    // Try to listen for when audio playback finishes
    // onAudioEnd might not be the correct callback name
    if ('onAudioEnd' in playerRef.current) {
      playerRef.current.onAudioEnd = () => {
        console.log('🎵 Audio playback ended (onAudioEnd)');
        isPlayingRef.current = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        setState('idle');
        setCurrentWordIndex(-1);
      };
    } else {
      console.warn('⚠️ onAudioEnd not available on SpeakerAudioDestination');
    }

    const audioConfig = SpeechSDK.AudioConfig.fromSpeakerOutput(playerRef.current);

    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
    synthesizerRef.current = synthesizer;

    return synthesizer;
  }, [settings]);

  const synthesize = useCallback(
    (text: string) => {
      if (!text.trim()) {
        setError('Please enter some text to synthesize');
        return;
      }

      setState('synthesizing');
      setError('');
      setWordBoundaries([]);
      setCurrentWordIndex(-1);
      audioChunksRef.current = [];
      boundariesRef.current = [];
      isPlayingRef.current = false;
      trackingStartedRef.current = false;

      const synthesizer = initializeSynthesizer();

      // Listen to word boundary events
      synthesizer.wordBoundary = (s, e) => {
        const boundary: WordBoundary = {
          text: e.text,
          offset: e.textOffset,
          length: e.wordLength,
          audioOffset: e.audioOffset / 10000, // Convert to milliseconds
        };
        boundariesRef.current.push(boundary);
        setWordBoundaries([...boundariesRef.current]);

        console.log(`📍 Word boundary: "${boundary.text}" at ${boundary.audioOffset}ms (text offset: ${boundary.offset})`);

        if (boundariesRef.current.length === 1) {
          // Adjust playback start time based on first word's audioOffset
          const currentTime = Date.now();
          const adjustedStartTime = currentTime - boundary.audioOffset;
          playbackStartTimeRef.current = adjustedStartTime;
          console.log('📍 FIRST word boundary - adjusting timer. Word:', boundary.text, 'offset:', boundary.audioOffset, 'ms. New playback start:', adjustedStartTime, 'Current time:', currentTime);
        }
      };

      // Listen to synthesis events
      synthesizer.synthesizing = (s, e) => {
        if (e.result.audioData) {
          // Start tracking time when first audio chunk arrives
          if (audioChunksRef.current.length === 0) {
            playbackStartTimeRef.current = Date.now();
            isPlayingRef.current = true;
            console.log('First audio chunk received, starting playback timer at:', playbackStartTimeRef.current);
            trackWordPosition();
          }
          audioChunksRef.current.push(new Uint8Array(e.result.audioData));
        }
      };

      synthesizer.synthesisStarted = () => {
        setState('playing');
        console.log('Synthesis started');
      };

      synthesizer.synthesisCompleted = (s, e) => {
        if (e.result.audioData) {
          // Combine all audio chunks
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
        }
        console.log('✅ Synthesis completed');

        // If no word boundaries were received (like MAI voices), estimate audio duration
        if (boundariesRef.current.length === 0) {
          console.log('⚠️ No word boundaries detected - estimating audio duration for auto-stop');
          // Estimate duration based on audio data size
          // MP3 at 48kbps ≈ 6KB/second
          const estimatedDurationMs = (audioChunksRef.current.reduce((sum, chunk) => sum + chunk.length, 0) / 6000) * 1000;
          console.log(`Estimated audio duration: ${estimatedDurationMs.toFixed(0)}ms`);

          // Set a timeout to stop playback after estimated duration + 500ms buffer
          setTimeout(() => {
            if (isPlayingRef.current) {
              console.log('🎵 Audio playback ended (estimated duration) - stopping tracking');
              isPlayingRef.current = false;
              if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
              }
              setState('idle');
              setCurrentWordIndex(-1);
            }
          }, estimatedDurationMs + 500);
        }
        // DON'T stop tracking here - audio is still playing
        // Will be stopped by 2-second timeout after last word, or estimated duration for voices without word boundaries
      };

      synthesizer.canceled = (s, e) => {
        console.error('Synthesis canceled:', e.errorDetails);
        setError(e.errorDetails || 'Synthesis was canceled');
        setState('error');
        setCurrentWordIndex(-1);
        isPlayingRef.current = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      // Track word position during playback
      const trackWordPosition = () => {
        if (!isPlayingRef.current) {
          console.log('Stopped tracking - not playing');
          return;
        }

        // Get current playback time from the actual player if available
        let currentPlaybackTime = Date.now() - playbackStartTimeRef.current;
        if (playerRef.current && typeof playerRef.current.currentTime === 'function') {
          try {
            const playerTime = playerRef.current.currentTime();
            if (playerTime > 0) {
              currentPlaybackTime = playerTime * 1000; // Convert to milliseconds
            }
          } catch (e) {
            // Fall back to calculated time
          }
        }

        // Find the current word - use negative lookahead to highlight slightly before audio
        let currentIndex = -1;
        for (let i = 0; i < boundariesRef.current.length; i++) {
          // Highlight 300ms BEFORE the word is spoken to compensate for word boundary delays
          if (boundariesRef.current[i].audioOffset <= currentPlaybackTime + 300) {
            currentIndex = i;
          } else {
            break;
          }
        }

        // Update current word index immediately
        if (currentIndex !== -1) {
          setCurrentWordIndex(currentIndex);
        }

        // Check if we've gone past the last word by more than 1 second - audio likely finished
        if (boundariesRef.current.length > 0) {
          const lastWordOffset = boundariesRef.current[boundariesRef.current.length - 1].audioOffset;
          const timeSinceLastWord = currentPlaybackTime - lastWordOffset;

          if (timeSinceLastWord > 1000) {
            console.log('🎵 Audio playback ended (1s past last word) - stopping tracking');
            isPlayingRef.current = false;
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
            }
            setState('idle');
            setCurrentWordIndex(-1);
            return;
          }
        }

        // Log less frequently to reduce console spam (every 500ms)
        if (Math.floor(currentPlaybackTime / 500) !== Math.floor((currentPlaybackTime - 16) / 500)) {
          const currentWord = currentIndex >= 0 ? boundariesRef.current[currentIndex] : null;
          console.log(
            `⏱️ ${currentPlaybackTime.toFixed(0)}ms | Word [${currentIndex}]: "${currentWord?.text}" @ ${currentWord?.audioOffset}ms`
          );
        }

        // Continue tracking every frame for smooth highlighting
        if (isPlayingRef.current) {
          animationFrameRef.current = requestAnimationFrame(trackWordPosition);
        }
      };

      // Start synthesis
      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            console.log('Synthesis completed successfully');
          } else {
            console.error('Synthesis failed:', result.errorDetails);
            setError(result.errorDetails || 'Synthesis failed');
            setState('error');
          }
        },
        (error) => {
          console.error('Synthesis error:', error);
          setError(error);
          setState('error');
        }
      );
    },
    [initializeSynthesizer, state]
  );

  const pause = useCallback(() => {
    if (playerRef.current && state === 'playing') {
      playerRef.current.pause();
      setState('paused');
    }
  }, [state]);

  const resume = useCallback(() => {
    if (playerRef.current && state === 'paused') {
      playerRef.current.resume();
      setState('playing');
    }
  }, [state]);

  const stop = useCallback(() => {
    console.log('⏹️ Stop called - cleaning up');
    isPlayingRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (synthesizerRef.current) {
      synthesizerRef.current.close();
      synthesizerRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current = null;
    }
    setState('idle');
    setCurrentWordIndex(-1);
  }, []);

  return {
    state,
    error,
    wordBoundaries,
    currentWordIndex,
    audioData,
    synthesize,
    pause,
    resume,
    stop,
  };
}
