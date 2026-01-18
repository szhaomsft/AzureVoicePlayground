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
  const synthesisCompleteRef = useRef<boolean>(false);
  const useFallbackPlaybackRef = useRef<boolean>(false);
  const inputTextRef = useRef<string>('');
  const stopTimeoutRef = useRef<number | null>(null);

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

    // Use speaker output for streaming playback
    const player = new SpeechSDK.SpeakerAudioDestination();
    playerRef.current = player;

    const audioConfig = SpeechSDK.AudioConfig.fromSpeakerOutput(player);
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
    synthesizerRef.current = synthesizer;

    return synthesizer;
  }, [settings]);

  const trackWordPosition = useCallback(() => {
    if (!isPlayingRef.current) {
      console.log('Stopped tracking - not playing');
      return;
    }

    // Get current playback time from the actual player if available
    let currentPlaybackTime = Date.now() - playbackStartTimeRef.current;
    if (playerRef.current && playerRef.current.currentTime) {
      try {
        const playerTime = playerRef.current.currentTime;
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

      // Check if we've reached the last word
      if (synthesisCompleteRef.current && currentIndex === boundariesRef.current.length - 1) {
        const lastWord = boundariesRef.current[currentIndex];
        const timeSinceLastWord = currentPlaybackTime - lastWord.audioOffset;
        const wordDuration = 100; // Give 100ms for the last word/punctuation to play

        console.log(`🔍 Last word check: current=${currentPlaybackTime}ms, lastWordOffset=${lastWord.audioOffset}ms, timeSince=${timeSinceLastWord}ms, threshold=${wordDuration}ms, willStop=${timeSinceLastWord >= wordDuration}`);

        // Only stop if we've actually passed the word's start time (accounting for lookahead)
        if (timeSinceLastWord >= wordDuration) {
          console.log(`🎵 Audio playback ended (last word finished). Word: "${lastWord.text}", offset: ${lastWord.audioOffset}ms, current: ${currentPlaybackTime}ms, time since: ${timeSinceLastWord}ms`);
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
    }

    // Log less frequently to reduce console spam (every 500ms)
    if (Math.floor(currentPlaybackTime / 500) !== Math.floor((currentPlaybackTime - 16) / 500)) {
      const currentWord = currentIndex >= 0 ? boundariesRef.current[currentIndex] : null;
      console.log(
        `⏱️ ${currentPlaybackTime.toFixed(0)}ms | Word [${currentIndex}]: "${currentWord?.text}" @ ${currentWord?.audioOffset}ms | Total: ${boundariesRef.current.length} | Complete: ${synthesisCompleteRef.current} | IsLast: ${currentIndex === boundariesRef.current.length - 1}`
      );
    }

    // Continue tracking every frame for smooth highlighting
    if (isPlayingRef.current) {
      animationFrameRef.current = requestAnimationFrame(trackWordPosition);
    }
  }, []);

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
      synthesisCompleteRef.current = false;
      useFallbackPlaybackRef.current = false;
      inputTextRef.current = text;

      const synthesizer = initializeSynthesizer();

      // Set a timeout - after 1 second, if no word boundary, use fallback mode
      const fallbackTimeout = setTimeout(() => {
        if (boundariesRef.current.length === 0) {
          console.log('⚠️ No word boundary received within 1 second - will start playback when audio arrives');
          useFallbackPlaybackRef.current = true;
        }
      }, 1000);

      // Listen to word boundary events
      synthesizer.wordBoundary = (_s, e) => {
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
          // First word boundary - clear the fallback timeout and disable fallback mode
          clearTimeout(fallbackTimeout);
          useFallbackPlaybackRef.current = false;

          const currentTime = Date.now();
          const adjustedStartTime = currentTime - boundary.audioOffset;
          playbackStartTimeRef.current = adjustedStartTime;
          console.log('📍 FIRST word boundary - starting playback. Word:', boundary.text, 'offset:', boundary.audioOffset, 'ms. Playback start:', adjustedStartTime, 'Current time:', currentTime);

          // Start playing and tracking if we haven't already started
          if (!isPlayingRef.current) {
            isPlayingRef.current = true;
            setState('playing');
            trackWordPosition();
          } else {
            // Already playing in fallback mode - just start tracking now with corrected timing
            console.log('🔄 Switching from fallback mode to word boundary mode - restarting tracking');
            trackWordPosition();
          }
        }
      };

      // Listen to synthesis events - collect audio for download
      synthesizer.synthesizing = (_s, e) => {
        if (e.result.audioData) {
          audioChunksRef.current.push(new Uint8Array(e.result.audioData));

          // Start playback on first audio chunk if using fallback mode
          if (useFallbackPlaybackRef.current && !isPlayingRef.current && audioChunksRef.current.length === 1) {
            console.log('🎵 First audio chunk received (fallback mode) - starting playback');
            playbackStartTimeRef.current = Date.now();
            isPlayingRef.current = true;
            setState('playing');
          }
        }
      };

      synthesizer.synthesisStarted = () => {
        setState('synthesizing');
        console.log('Synthesis started');
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

        // Mark synthesis as complete so we can now detect the real last word
        synthesisCompleteRef.current = true;
        console.log('✅ Synthesis completed - now have all', boundariesRef.current.length, 'word boundaries');

        // Calculate audio duration from file size
        // For MP3 at 48kbps, approximate duration: bytes * 8 / bitrate (in seconds)
        const estimatedDurationMs = (totalLength * 8 / 48000) * 1000;
        const currentPlaybackTime = Date.now() - playbackStartTimeRef.current;
        const remainingTime = Math.max(100, estimatedDurationMs - currentPlaybackTime + 300); // Add 300ms buffer

        console.log(`🕐 Estimated audio duration: ${estimatedDurationMs}ms, current playback: ${currentPlaybackTime}ms, will stop in: ${remainingTime}ms`);

        // Clear any existing timeout
        if (stopTimeoutRef.current) {
          clearTimeout(stopTimeoutRef.current);
        }

        // Set timeout to stop playback when audio ends
        stopTimeoutRef.current = setTimeout(() => {
          console.log('🎵 Audio playback ended (duration timeout)');
          isPlayingRef.current = false;
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          setState('idle');
          setCurrentWordIndex(-1);
          stopTimeoutRef.current = null;
        }, remainingTime);

        // If we have no word boundaries, start playback now if not already started
        if (boundariesRef.current.length === 0) {
          console.log('⚠️ No word boundaries received - using fallback mode');

          if (!isPlayingRef.current) {
            playbackStartTimeRef.current = Date.now();
            isPlayingRef.current = true;
            setState('playing');
          }
        }
      };

      synthesizer.SynthesisCanceled = (_s: any, e: any) => {
        console.error('Synthesis canceled:', e.errorDetails);
        setError(e.errorDetails || 'Synthesis was canceled');
        setState('error');
        setCurrentWordIndex(-1);
        isPlayingRef.current = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
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
    [initializeSynthesizer, trackWordPosition]
  );

  const pause = useCallback(() => {
    if (playerRef.current && state === 'playing') {
      playerRef.current.pause();
      setState('paused');
      isPlayingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [state]);

  const resume = useCallback(() => {
    if (playerRef.current && state === 'paused') {
      playerRef.current.resume();
      setState('playing');
      isPlayingRef.current = true;
      trackWordPosition();
    }
  }, [state, trackWordPosition]);

  const stop = useCallback(() => {
    console.log('⏹️ Stop called - cleaning up');
    isPlayingRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.pause();
    }
    if (synthesizerRef.current) {
      synthesizerRef.current.close();
      synthesizerRef.current = null;
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
