import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlaygroundMode } from '../types/azure';

const LANGUAGE_STORAGE_KEY = 'podcast-player-language';

type PodcastLanguage = 'en-US' | 'zh-CN';

/** Map PlaygroundMode to the audio filename (without extension) */
const MODE_TO_AUDIO: Record<PlaygroundMode, string> = {
  'text-to-speech': 'TextToSpeech',
  'speech-to-text': 'SpeechToText',
  'voice-changer': 'VoiceChanger',
  'multi-talker': 'MultiTalker',
  'voice-creation': 'VoiceCreation',
  'video-translation': 'VideoTranslation',
  'voice-live-chat': 'VoiceLiveChat',
  'voice-live-translator': 'VoiceLiveTranslator',
  'podcast-agent': 'PodcastAgent',
  'gemini-live': 'GeminiLive',
};

/** Human-readable service labels */
const MODE_TO_LABEL: Record<PlaygroundMode, string> = {
  'text-to-speech': 'Text to Speech',
  'speech-to-text': 'Speech to Text',
  'voice-changer': 'Voice Changer',
  'multi-talker': 'Multi Talker',
  'voice-creation': 'Voice Creation',
  'video-translation': 'Video Translation',
  'voice-live-chat': 'Voice Live Chat',
  'voice-live-translator': 'Voice Live Translator',
  'podcast-agent': 'Podcast Agent',
  'gemini-live': 'Gemini Live',
};

function getStoredLanguage(): PodcastLanguage {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'zh-CN') return 'zh-CN';
  } catch { /* ignore */ }
  return 'en-US';
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface PodcastPlayerProps {
  mode: PlaygroundMode;
}

export function PodcastPlayer({ mode }: PodcastPlayerProps) {
  const [language, setLanguage] = useState<PodcastLanguage>(getStoredLanguage);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const audioFileName = MODE_TO_AUDIO[mode];
  const audioSrc = `${import.meta.env.BASE_URL}podcast-audio/${language}/${audioFileName}.mp3`;

  // Persist language preference
  const switchLanguage = useCallback((lang: PodcastLanguage) => {
    setLanguage(lang);
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, lang); } catch { /* ignore */ }
  }, []);

  // Reset playback state when mode or language changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [mode, language]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    const onLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [audioSrc]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [isPlaying]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  }, [duration]);

  const skipBackward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (audioRef.current && duration) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
    }
  }, [duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="border-t border-gray-200 bg-gradient-to-r from-purple-50 via-white to-blue-50">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      {/* Collapsed bar — always visible */}
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Podcast branding text */}
        <span className="text-xs font-semibold bg-gradient-to-r from-purple-700 to-blue-600 bg-clip-text text-transparent whitespace-nowrap flex-shrink-0 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a5 5 0 00-5 5v6a5 5 0 0010 0V6a5 5 0 00-5-5z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 004 7.46V22H8v2h8v-2h-3v-2.54A9 9 0 0021 12v-2h-2z" />
          </svg>
          Podcast: {MODE_TO_LABEL[mode]} Introduction
        </span>
        {/* Expand/collapse toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
          title={isExpanded ? 'Collapse player' : 'Expand player'}
        >
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlayPause}
          className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-500 font-mono w-10 text-right flex-shrink-0">
            {formatTime(currentTime)}
          </span>
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="flex-1 h-1.5 bg-gray-200 rounded-full cursor-pointer group relative"
          >
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-[width] duration-100 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" />
            </div>
          </div>
          <span className="text-xs text-gray-500 font-mono w-10 flex-shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Language toggle */}
        <div className="flex-shrink-0 flex items-center bg-gray-100 rounded-full p-0.5">
          <button
            onClick={() => switchLanguage('en-US')}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
              language === 'en-US'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => switchLanguage('zh-CN')}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
              language === 'zh-CN'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            中文
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {isExpanded && (
        <div className="px-4 pb-3 flex items-center gap-4 border-t border-gray-100 pt-2">
          {/* Skip controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={skipBackward}
              className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              title="Back 10s"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>
            <span className="text-xs text-gray-400">10s</span>
            <button
              onClick={skipForward}
              className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              title="Forward 10s"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200" />

          {/* Info text */}
          <p className="text-xs text-gray-400 flex-1">
            AI-generated podcast introducing {MODE_TO_LABEL[mode]} — powered by <a href="#podcast-agent" className="text-purple-500 hover:text-purple-700 underline">Azure Podcast Generation</a>
          </p>
        </div>
      )}
    </div>
  );
}
