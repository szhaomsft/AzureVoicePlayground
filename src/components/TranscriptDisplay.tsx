// Transcript Display Component

import React from 'react';
import { TranscriptSegment } from '../types/transcription';

interface TranscriptDisplayProps {
  segments: TranscriptSegment[];
  fullText: string;
  interimText?: string;
  isStreaming: boolean;
  showTimestamps?: boolean;
  showConfidence?: boolean;
}

export function TranscriptDisplay({
  segments,
  fullText,
  interimText,
  isStreaming,
  showTimestamps = true,
  showConfidence = true
}: TranscriptDisplayProps) {
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  const hasContent = segments.length > 0 || interimText;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Transcript
        </label>
        {isStreaming && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span>Streaming...</span>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-300 rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto p-4">
        {hasContent ? (
          <div className="space-y-4">
            {/* Final segments */}
            {segments.map((segment, index) => (
              <div key={index} className="border-l-2 border-blue-500 pl-3">
                {showTimestamps && (
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-gray-500 font-mono">
                      {formatTime(segment.offset)}
                    </span>
                    {showConfidence && (
                      <span className={`text-xs font-medium ${getConfidenceColor(segment.confidence)}`}>
                        {getConfidenceLabel(segment.confidence)} ({Math.round(segment.confidence * 100)}%)
                      </span>
                    )}
                  </div>
                )}
                <p className="text-gray-900 leading-relaxed">{segment.text}</p>

                {/* Word-level timings (optional detailed view) */}
                {segment.words && segment.words.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {segment.words.map((word, wordIdx) => (
                      <span
                        key={wordIdx}
                        className="inline-block px-1.5 py-0.5 bg-gray-50 text-gray-700 text-xs rounded border border-gray-200 hover:bg-gray-100 transition-colors cursor-default"
                        title={`${formatTime(word.offset)} - ${getConfidenceLabel(word.confidence)}`}
                      >
                        {word.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Interim text (for streaming) */}
            {interimText && (
              <div className="border-l-2 border-gray-300 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 italic">Recognizing...</span>
                </div>
                <p className="text-gray-500 italic leading-relaxed">{interimText}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[180px] text-gray-400">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No transcript yet</p>
            <p className="text-xs mt-1">Upload or record audio to begin transcription</p>
          </div>
        )}
      </div>

      {/* Summary stats */}
      {segments.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span>{segments.length} segment{segments.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span>{fullText.split(' ').length} word{fullText.split(' ').length !== 1 ? 's' : ''}</span>
          </div>
          {segments.length > 0 && segments[segments.length - 1].offset && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Duration: {formatTime(segments[segments.length - 1].offset + segments[segments.length - 1].duration)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
