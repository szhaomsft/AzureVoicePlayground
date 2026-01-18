import React, { useRef, useEffect, useState } from 'react';
import { WordBoundary, SynthesisState } from '../types/azure';
import { getLanguageFromVoice, getPresetsForLanguage } from '../utils/languagePresets';
import { BUILD_TIMESTAMP } from '../buildTimestamp';

interface TextInputProps {
  text: string;
  onTextChange: (text: string) => void;
  wordBoundaries: WordBoundary[];
  currentWordIndex: number;
  selectedVoice: string;
  state: SynthesisState;
}

export function TextInput({
  text,
  onTextChange,
  wordBoundaries,
  currentWordIndex,
  selectedVoice,
  state,
}: TextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [showSSML, setShowSSML] = useState(false);
  const [selectedPresetLanguage, setSelectedPresetLanguage] = useState<string>('');

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  // Get current language from selected voice
  const currentLanguage = getLanguageFromVoice(selectedVoice);

  // Use selected preset language, or default to voice's language
  const presetLanguage = selectedPresetLanguage || currentLanguage;
  const currentPresets = getPresetsForLanguage(presetLanguage);

  const handlePresetSelect = (presetKey: string) => {
    const preset = currentPresets[presetKey as keyof typeof currentPresets];
    if (preset) {
      onTextChange(preset);
      setShowSSML(false); // Reset to plain text view when loading preset
    }
  };

  const isPlaying = state === 'synthesizing' || state === 'playing';

  // Auto-scroll to keep current word visible
  useEffect(() => {
    if (currentWordIndex >= 0 && currentWordIndex < wordBoundaries.length) {
      const boundary = wordBoundaries[currentWordIndex];
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const textBeforeBoundary = text.substring(0, boundary.offset);
        const lines = textBeforeBoundary.split('\n').length;
        const lineHeight = 24; // Approximate line height
        const scrollPosition = (lines - 1) * lineHeight;

        // Scroll to make current word visible
        textarea.scrollTop = Math.max(0, scrollPosition - textarea.clientHeight / 2);
      }
    }
  }, [currentWordIndex, wordBoundaries, text]);

  // Create highlighted text
  const getHighlightedText = () => {
    if (currentWordIndex < 0 || currentWordIndex >= wordBoundaries.length) {
      return text;
    }

    const boundary = wordBoundaries[currentWordIndex];
    const before = text.substring(0, boundary.offset);
    const highlighted = text.substring(boundary.offset, boundary.offset + boundary.length);
    const after = text.substring(boundary.offset + boundary.length);

    return (
      <>
        {before}
        <span className="bg-yellow-300 font-semibold">{highlighted}</span>
        {after}
      </>
    );
  };

  // Generate SSML from plain text
  const generateSSML = () => {
    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="${selectedVoice}">
    ${text}
  </voice>
</speak>`;
  };

  const displayText = showSSML ? generateSSML() : text;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold text-gray-800">Text to Synthesize</h2>
          <span className="text-xs text-gray-400">
            Build: {new Date(BUILD_TIMESTAMP).toLocaleString()}
          </span>
        </div>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>
            {wordCount} word{wordCount !== 1 ? 's' : ''}
          </span>
          <span>
            {charCount} char{charCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Preset selector */}
      <div className="mb-3 grid grid-cols-[200px_1fr] gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preset Language
          </label>
          <select
            value={selectedPresetLanguage}
            onChange={(e) => setSelectedPresetLanguage(e.target.value)}
            disabled={isPlaying}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Voice Language ({currentLanguage})</option>
            <option value="ar-EG">Arabic (Egypt)</option>
            <option value="ar-SA">Arabic (Saudi Arabia)</option>
            <option value="bg-BG">Bulgarian</option>
            <option value="ca-ES">Catalan</option>
            <option value="cs-CZ">Czech</option>
            <option value="cy-GB">Welsh</option>
            <option value="da-DK">Danish</option>
            <option value="de-DE">German</option>
            <option value="el-GR">Greek</option>
            <option value="en-AU">English (Australia)</option>
            <option value="en-CA">English (Canada)</option>
            <option value="en-GB">English (UK)</option>
            <option value="en-IN">English (India)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Spanish (Spain)</option>
            <option value="es-MX">Spanish (Mexico)</option>
            <option value="et-EE">Estonian</option>
            <option value="fi-FI">Finnish</option>
            <option value="fr-CA">French (Canada)</option>
            <option value="fr-FR">French (France)</option>
            <option value="he-IL">Hebrew</option>
            <option value="hi-IN">Hindi</option>
            <option value="hr-HR">Croatian</option>
            <option value="hu-HU">Hungarian</option>
            <option value="id-ID">Indonesian</option>
            <option value="it-IT">Italian</option>
            <option value="ja-JP">Japanese</option>
            <option value="ko-KR">Korean</option>
            <option value="lt-LT">Lithuanian</option>
            <option value="lv-LV">Latvian</option>
            <option value="nb-NO">Norwegian</option>
            <option value="nl-NL">Dutch</option>
            <option value="pl-PL">Polish</option>
            <option value="pt-BR">Portuguese (Brazil)</option>
            <option value="pt-PT">Portuguese (Portugal)</option>
            <option value="ro-RO">Romanian</option>
            <option value="ru-RU">Russian</option>
            <option value="sk-SK">Slovak</option>
            <option value="sl-SI">Slovenian</option>
            <option value="sr-RS">Serbian</option>
            <option value="sv-SE">Swedish</option>
            <option value="th-TH">Thai</option>
            <option value="tr-TR">Turkish</option>
            <option value="uk-UA">Ukrainian</option>
            <option value="vi-VN">Vietnamese</option>
            <option value="zh-CN">Chinese (Mandarin)</option>
            <option value="zh-TW">Chinese (Taiwan)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Load Preset Text
          </label>
          <select
            onChange={(e) => handlePresetSelect(e.target.value)}
            disabled={isPlaying}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            defaultValue=""
          >
            <option value="">-- Select a preset --</option>
            <option value="podcast">Podcast</option>
            <option value="education">Education/Learning</option>
            <option value="instructions">Instructions/Guidance</option>
            <option value="story">Story/Narrative</option>
            <option value="ads">Advertisement</option>
            <option value="news">News Report</option>
            <option value="promotional">Promotional/Marketing</option>
            <option value="vlog">Vlog/Social Media</option>
            <option value="business">Business/Professional</option>
            <option value="callcenter">Call Center/Customer Care</option>
            <option value="standup">Stand-up Comedy</option>
            <option value="enthusiastic">Enthusiastic/Excited</option>
            <option value="casual">Casual Conversation</option>
            <option value="hesitant">Hesitant/Uncertain</option>
            <option value="explainer">Explainer Video</option>
          </select>
        </div>
      </div>

      <div className="flex-1 relative">
        {/* Highlighted overlay */}
        {currentWordIndex >= 0 && (
          <div
            ref={highlightRef}
            className="absolute inset-0 px-3 py-2 pointer-events-none overflow-hidden whitespace-pre-wrap break-words font-mono text-base leading-6 text-transparent"
            style={{ zIndex: 1 }}
          >
            {getHighlightedText()}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={displayText}
          onChange={(e) => !showSSML && onTextChange(e.target.value)}
          placeholder="Enter text here to convert to speech..."
          readOnly={showSSML}
          className="w-full h-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-base leading-6"
          style={{ position: 'relative', zIndex: 2, background: showSSML ? '#f9fafb' : 'transparent' }}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setShowSSML(!showSSML)}
          disabled={!text}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showSSML ? 'Show Plain Text' : 'Show SSML'}
        </button>
        <button
          onClick={() => onTextChange('')}
          disabled={!text}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear Text
        </button>
      </div>
    </div>
  );
}
