import { VoiceInfo } from './azure';

export interface MultiTalkerVoice {
  name: string;           // e.g., "zh-cn-multitalker-xiaochen-yunhan:DragonHDV2.4Neural"
  displayName: string;    // e.g., "Xiaochen & Yunhan (Chinese)"
  locale: string;         // e.g., "zh-CN"
  speakers: string[];     // e.g., ["xiaochen", "yunhan"]
}

export interface MultiTalkerHistoryEntry {
  id: string;
  timestamp: number;
  text: string;
  voice: string;
  region: string;
  audioData: ArrayBuffer;
  duration: number;
}

export type MultiTalkerState = 'idle' | 'synthesizing' | 'playing' | 'paused' | 'error';

/**
 * Parse a multi-talker voice name to extract speaker names
 * Example: "zh-cn-multitalker-xiaochen-yunhan:DragonHDV2.4Neural"
 * Returns: ["xiaochen", "yunhan"]
 */
export function extractSpeakersFromVoiceName(voiceName: string): string[] {
  // Pattern: locale-multitalker-speaker1-speaker2:modelName
  const match = voiceName.match(/multitalker-([^:]+)/i);
  if (match) {
    // Split by hyphen, but be careful about locale prefix already removed
    const speakerPart = match[1];
    // Split by hyphen to get individual speaker names
    return speakerPart.split('-').filter(s => s.length > 0);
  }
  return [];
}

/**
 * Extract locale from voice name
 * Example: "zh-cn-multitalker-xiaochen-yunhan:DragonHDV2.4Neural"
 * Returns: "zh-CN"
 */
export function extractLocaleFromVoiceName(voiceName: string): string {
  // Pattern: starts with locale like "zh-cn-" or "en-us-"
  const match = voiceName.match(/^([a-z]{2}-[a-z]{2})/i);
  if (match) {
    // Normalize to proper case: "zh-CN"
    const parts = match[1].split('-');
    return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
  }
  return 'en-US';
}

/**
 * Convert a VoiceInfo to MultiTalkerVoice if it's a multi-talker voice
 */
export function toMultiTalkerVoice(voice: VoiceInfo): MultiTalkerVoice | null {
  if (!voice.name.toLowerCase().includes('multitalker')) {
    return null;
  }

  const speakers = extractSpeakersFromVoiceName(voice.name);
  if (speakers.length === 0) {
    return null;
  }

  const locale = extractLocaleFromVoiceName(voice.name);

  // Create display name from speakers
  const speakerNames = speakers.map(s =>
    s.charAt(0).toUpperCase() + s.slice(1)
  );
  const displayName = `${speakerNames.join(' & ')} (${locale})`;

  return {
    name: voice.name,
    displayName,
    locale,
    speakers,
  };
}

/**
 * Escape XML special characters
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build multi-talker SSML from text input
 */
export function buildMultiTalkerSSML(
  text: string,
  voiceName: string,
  locale: string,
  speakers: string[]
): string {
  // Create lowercase speaker list for case-insensitive matching
  const speakersLower = speakers.map(s => s.toLowerCase());

  // Parse lines like "xiaochen: Hello" or "Ava: Hi there"
  const lines = text.split('\n').filter(line => line.trim());

  const turns = lines.map(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const speakerInput = line.substring(0, colonIndex).trim();
      const speakerLower = speakerInput.toLowerCase();
      const content = line.substring(colonIndex + 1).trim();

      // Find matching speaker (case-insensitive)
      const speakerIndex = speakersLower.indexOf(speakerLower);
      if (speakerIndex >= 0 && content) {
        // Use lowercase speaker name in SSML
        return `<mstts:turn speaker="${speakerLower}">${escapeXml(content)}</mstts:turn>`;
      }
    }
    // Default to first speaker if no valid prefix - use the whole line as content
    if (line.trim()) {
      return `<mstts:turn speaker="${speakers[0].toLowerCase()}">${escapeXml(line.trim())}</mstts:turn>`;
    }
    return '';
  }).filter(turn => turn).join('\n');

  return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" version="1.0" xml:lang="${locale}">
<voice name="${voiceName}">
<lang xml:lang="${locale}">
<mstts:dialog>
${turns}
</mstts:dialog>
</lang>
</voice>
</speak>`;
}
