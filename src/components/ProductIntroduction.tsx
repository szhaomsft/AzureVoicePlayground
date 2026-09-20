import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlaygroundMode } from '../types/azure';

const LANGUAGE_STORAGE_KEY = 'podcast-player-language';

type PodcastLanguage = 'en-US' | 'zh-CN';

/** Map PlaygroundMode to filenames (audio + doc share the same base name) */
const MODE_TO_FILE: Record<PlaygroundMode, string> = {
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

/** Simple markdown-to-HTML converter for well-structured introduction docs */
function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip the H1 title (already shown in the header)
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h4 class="text-sm font-semibold text-gray-800 mt-4 mb-2">${escapeAndFormat(line.slice(4))}</h4>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h3 class="text-base font-semibold text-gray-900 mt-5 mb-2">${escapeAndFormat(line.slice(3))}</h3>`);
      continue;
    }

    // List items
    if (line.startsWith('- ')) {
      if (!inList) { html.push('<ul class="list-disc list-inside space-y-1 ml-2">'); inList = true; }
      html.push(`<li class="text-sm text-gray-600">${escapeAndFormat(line.slice(2))}</li>`);
      continue;
    }

    // End list on non-list line
    if (inList && line.trim() === '') {
      html.push('</ul>');
      inList = false;
      continue;
    }

    // Paragraph
    if (line.trim() !== '') {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<p class="text-sm text-gray-600 mb-2">${escapeAndFormat(line)}</p>`);
    }
  }

  if (inList) { html.push('</ul>'); }
  return html.join('\n');
}

/** Escape HTML and apply inline formatting (bold, code, links) */
function escapeAndFormat(text: string): string {
  let s = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>');
  s = s.replace(/`(.+?)`/g, '<code class="bg-gray-100 text-purple-700 px-1 py-0.5 rounded text-xs">$1</code>');
  s = s.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-purple-600 hover:text-purple-800 underline">$1</a>');
  return s;
}

interface ProductIntroductionProps {
  mode: PlaygroundMode;
}

export function ProductIntroduction({ mode }: ProductIntroductionProps) {
  /* ── audio state ── */
  const [language, setLanguage] = useState<PodcastLanguage>(getStoredLanguage);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  /* ── expand / doc state ── */
  const [isExpanded, setIsExpanded] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const baseName = MODE_TO_FILE[mode];
  const label = MODE_TO_LABEL[mode];
  const audioSrc = `${import.meta.env.BASE_URL}podcast-audio/${language}/${baseName}.mp3`;
  const docSrc = `${import.meta.env.BASE_URL}docs/introductions/${baseName}.md`;

  /* ── language persistence ── */
  const switchLanguage = useCallback((lang: PodcastLanguage) => {
    setLanguage(lang);
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, lang); } catch { /* ignore */ }
  }, []);

  /* ── reset on mode / language change ── */
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [mode, language]);

  useEffect(() => {
    setMarkdown(null);
    setIsExpanded(false);
  }, [mode]);

  /* ── audio event wiring ── */
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
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false)); }
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
    if (audioRef.current) { audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); }
  }, []);

  const skipForward = useCallback(() => {
    if (audioRef.current && duration) { audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10); }
  }, [duration]);

  /* ── fetch markdown on first expand ── */
  useEffect(() => {
    if (!isExpanded || markdown !== null) return;
    setIsLoading(true);
    fetch(docSrc)
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.text(); })
      .then((text) => setMarkdown(text))
      .catch(() => setMarkdown(''))
      .finally(() => setIsLoading(false));
  }, [isExpanded, markdown, docSrc]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="border-t border-gray-200 bg-gradient-to-r from-purple-50 via-white to-blue-50">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      {/* ── Collapsed bar — always visible ── */}
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Podcast branding + title link */}
        <a
          href={`#${mode}-introduction`}
          onClick={(e) => { e.preventDefault(); setIsExpanded(!isExpanded); }}
          className="text-xs font-semibold bg-gradient-to-r from-purple-700 to-blue-600 bg-clip-text text-transparent whitespace-nowrap flex-shrink-0 flex items-center gap-1 hover:from-purple-800 hover:to-blue-700"
          title={isExpanded ? 'Collapse' : `Expand ${label} Introduction`}
        >
          <svg className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a5 5 0 00-5 5v6a5 5 0 0010 0V6a5 5 0 00-5-5z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 004 7.46V22H8v2h8v-2h-3v-2.54A9 9 0 0021 12v-2h-2z" />
          </svg>
          Podcast: {label} Introduction
        </a>

        {/* Expand / collapse chevron */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Play / Pause */}
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
          <span className="text-xs text-gray-500 font-mono w-10 text-right flex-shrink-0">{formatTime(currentTime)}</span>
          <div ref={progressRef} onClick={handleProgressClick} className="flex-1 h-1.5 bg-gray-200 rounded-full cursor-pointer group relative">
            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-[width] duration-100 relative" style={{ width: `${progress}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" />
            </div>
          </div>
          <span className="text-xs text-gray-500 font-mono w-10 flex-shrink-0">{formatTime(duration)}</span>
        </div>

        {/* Language toggle */}
        <div className="flex-shrink-0 flex items-center bg-gray-100 rounded-full p-0.5">
          <button
            onClick={() => switchLanguage('en-US')}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${language === 'en-US' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >EN</button>
          <button
            onClick={() => switchLanguage('zh-CN')}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${language === 'zh-CN' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >中文</button>
        </div>
      </div>

      {/* ── Expanded section ── */}
      {isExpanded && (
        <div id={`${mode}-introduction`} className="border-t border-gray-100">
          {/* Skip controls + powered-by */}
          <div className="px-4 py-2 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={skipBackward} className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors" title="Back 10s">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>
              <span className="text-xs text-gray-400">10s</span>
              <button onClick={skipForward} className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors" title="Forward 10s">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                </svg>
              </button>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <p className="text-xs text-gray-400 flex-1">
              AI-generated podcast introducing {label} — powered by <a href="#podcast-agent" className="text-purple-500 hover:text-purple-700 underline">Azure Podcast Generation</a>
            </p>
          </div>

          {/* Bridge note */}
          <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs text-gray-500">
              This podcast is generated based on the introduction below.
            </p>
          </div>

          {/* Introduction document */}
          <div className="px-6 pb-4 max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center gap-2 py-4">
                <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Loading introduction...</span>
              </div>
            )}
            {markdown !== null && markdown !== '' && (
              <div className="MSTTSPlayerContentSource prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />
            )}
            {markdown === '' && !isLoading && (
              <p className="text-sm text-gray-400 py-4">Introduction document not available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
