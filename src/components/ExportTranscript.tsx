// Export Transcript Component

import React from 'react';
import { TranscriptSegment } from '../types/transcription';
import { ExportFormat } from '../types/stt';
import { exportTranscript } from '../utils/sttExport';

interface ExportTranscriptProps {
  segments: TranscriptSegment[];
  filename?: string;
  disabled?: boolean;
}

export function ExportTranscript({ segments, filename = 'transcript', disabled = false }: ExportTranscriptProps) {
  const handleExport = (format: ExportFormat) => {
    if (segments.length === 0) {
      return;
    }

    exportTranscript(segments, filename, format);
  };

  const hasSegments = segments.length > 0;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Export Transcript
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleExport('txt')}
          disabled={disabled || !hasSegments}
          className="flex-1 min-w-[100px] px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>TXT</span>
          </div>
        </button>

        <button
          onClick={() => handleExport('srt')}
          disabled={disabled || !hasSegments}
          className="flex-1 min-w-[100px] px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <span>SRT</span>
          </div>
        </button>

        <button
          onClick={() => handleExport('vtt')}
          disabled={disabled || !hasSegments}
          className="flex-1 min-w-[100px] px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>VTT</span>
          </div>
        </button>
      </div>

      {!hasSegments && !disabled && (
        <p className="text-xs text-gray-500 mt-1">
          Transcribe audio to enable export
        </p>
      )}
    </div>
  );
}
