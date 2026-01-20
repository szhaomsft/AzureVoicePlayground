// Export utilities for transcripts (TXT, SRT, VTT)

import { TranscriptSegment } from '../types/transcription';
import { ExportFormat } from '../types/stt';

/**
 * Export transcript to plain text format
 */
export function exportToTXT(segments: TranscriptSegment[]): string {
  return segments.map(seg => seg.text).join(' ');
}

/**
 * Export transcript to SRT (SubRip) subtitle format
 * Format: 00:00:01,500
 */
export function exportToSRT(segments: TranscriptSegment[]): string {
  return segments.map((seg, index) => {
    const startTime = formatSRTTimestamp(seg.offset);
    const endTime = formatSRTTimestamp(seg.offset + seg.duration);

    return `${index + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
  }).join('\n');
}

/**
 * Export transcript to WebVTT subtitle format
 * Format: 00:00:01.500
 */
export function exportToVTT(segments: TranscriptSegment[]): string {
  const header = 'WEBVTT\n\n';
  const body = segments.map((seg, index) => {
    const startTime = formatVTTTimestamp(seg.offset);
    const endTime = formatVTTTimestamp(seg.offset + seg.duration);

    return `${index + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
  }).join('\n');

  return header + body;
}

/**
 * Format timestamp for SRT (uses comma for milliseconds)
 * Format: 00:00:01,500
 */
function formatSRTTimestamp(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(millis, 3)}`;
}

/**
 * Format timestamp for VTT (uses period for milliseconds)
 * Format: 00:00:01.500
 */
function formatVTTTimestamp(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(millis, 3)}`;
}

/**
 * Pad number with leading zeros
 */
function pad(num: number, size: number): string {
  return num.toString().padStart(size, '0');
}

/**
 * Download transcript file
 */
export function downloadTranscript(
  content: string,
  filename: string,
  format: ExportFormat
): void {
  const mimeTypes: Record<ExportFormat, string> = {
    txt: 'text/plain',
    srt: 'text/srt',
    vtt: 'text/vtt'
  };

  const blob = new Blob([content], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export transcript in the specified format
 */
export function exportTranscript(
  segments: TranscriptSegment[],
  filename: string,
  format: ExportFormat
): void {
  let content: string;

  switch (format) {
    case 'txt':
      content = exportToTXT(segments);
      break;
    case 'srt':
      content = exportToSRT(segments);
      break;
    case 'vtt':
      content = exportToVTT(segments);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  downloadTranscript(content, filename, format);
}
