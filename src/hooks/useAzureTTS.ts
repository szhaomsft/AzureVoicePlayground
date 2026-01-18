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
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioDurationRef = useRef<number>(0);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const synthesisCompleteRef = useRef<boolean>(false);

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

      // Only check for last word if synthesis is complete
      if (synthesisCompleteRef.current && currentIndex === boundariesRef.current.length - 1) {
        const lastWord = boundariesRef.current[currentIndex];
        // If we've been on the last word for more than 1 second, stop playback
        if (currentPlaybackTime > lastWord.audioOffset + 1000) {
          console.log(`🎵 Audio playback ended (1s after last word highlighted). Current time: ${currentPlaybackTime}ms, Last word at: ${lastWord.audioOffset}ms`);
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
        `⏱️ ${currentPlaybackTime.toFixed(0)}ms | Word [${currentIndex}]: "${currentWord?.text}" @ ${currentWord?.audioOffset}ms | Total: ${boundariesRef.current.length} | Complete: ${synthesisCompleteRef.current}`
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

      const synthesizer = initializeSynthesizer();

      // Track if we should use fallback (no word boundaries)
      let useFallbackPlayback = false;

      // Set a timeout - after 1 second, if no word boundary, use fallback mode
      const fallbackTimeout = setTimeout(() => {
        if (boundariesRef.current.length === 0) {
          console.log('⚠️ No word boundary received within 1 second - will start playback when audio arrives');
          useFallbackPlayback = true;
        }
      }, 1000);

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
          // First word boundary - clear the fallback timeout and start playback
          clearTimeout(fallbackTimeout);
          useFallbackPlayback = false;

          const currentTime = Date.now();
          const adjustedStartTime = currentTime - boundary.audioOffset;
          playbackStartTimeRef.current = adjustedStartTime;
          console.log('📍 FIRST word boundary - starting playback. Word:', boundary.text, 'offset:', boundary.audioOffset, 'ms. Playback start:', adjustedStartTime, 'Current time:', currentTime);

          // Start playing if we haven't already
          if (!isPlayingRef.current) {
            isPlayingRef.current = true;
            setState('playing');
            trackWordPosition();
          }
        }
      };

      // Listen to synthesis events - collect audio for download
      synthesizer.synthesizing = (s, e) => {
        if (e.result.audioData) {
          audioChunksRef.current.push(new Uint8Array(e.result.audioData));

          // Start playback on first audio chunk if using fallback mode
          if (useFallbackPlayback && !isPlayingRef.current && audioChunksRef.current.length === 1) {
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

      synthesizer.synthesisCompleted = (s, e) => {
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

        // If we have no word boundaries, we need to start playback now and estimate duration
        if (boundariesRef.current.length === 0) {
          console.log('⚠️ No word boundaries received - using fallback audio duration detection');

          // Start playback if not already started
          if (!isPlayingRef.current) {
            playbackStartTimeRef.current = Date.now();
            isPlayingRef.current = true;
            setState('playing');
          }

          // For MP3 at 48kbps, approximate duration: bytes * 8 / bitrate (in seconds)
          const estimatedDurationMs = (totalLength * 8 / 48000) * 1000;
          const currentPlaybackTime = Date.now() - playbackStartTimeRef.current;
          const remainingTime = Math.max(0, estimatedDurationMs - currentPlaybackTime + 500); // Add 500ms buffer

          console.log(`🕐 Estimated audio duration: ${estimatedDurationMs}ms, current playback: ${currentPlaybackTime}ms, will stop in: ${remainingTime}ms`);

          setTimeout(() => {
            if (isPlayingRef.current) {
              console.log('🎵 Audio playback ended (fallback timeout)');
              isPlayingRef.current = false;
              if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
              }
              setState('idle');
              setCurrentWordIndex(-1);
            }
          }, remainingTime);
        }
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
