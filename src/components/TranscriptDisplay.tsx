// Transcript Display Component

import React, { useRef, useState } from 'react';
import { TranscriptSegment } from '../types/transcription';

interface TranscriptDisplayProps {
  segments: TranscriptSegment[];
  fullText: string;
  interimText?: string;
  isStreaming: boolean;
  showTimestamps?: boolean;
  showConfidence?: boolean;
  audioSource?: File | Blob | null;
}

export function TranscriptDisplay({
  segments,
  fullText,
  interimText,
  isStreaming,
  showTimestamps = true,
  showConfidence = true,
  audioSource
}: TranscriptDisplayProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingSegment, setPlayingSegment] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Create audio URL when audioSource changes
  React.useEffect(() => {
    // Clean up any existing playback
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingSegment(null);
    }

    if (audioSource) {
      const url = URL.createObjectURL(audioSource);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }
      };
    } else {
      setAudioUrl(null);
    }
  }, [audioSource]);

  const handleSegmentClick = async (segment: TranscriptSegment, index: number) => {
    if (!audioRef.current || !audioUrl) {
      console.log('No audio ref or URL available');
      return;
    }

    const audio = audioRef.current;
    const startTime = segment.offset / 1000; // Convert ms to seconds
    const endTime = (segment.offset + segment.duration) / 1000;

    console.log('Playing segment:', index, 'from', startTime, 'to', endTime);

    // Clean up previous event listeners
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Stop any current playback
    try {
      audio.pause();
    } catch (e) {
      // Ignore if already paused
    }
    setPlayingSegment(null);

    try {
      // Always set the source to ensure it's loaded
      audio.src = audioUrl;

      // Wait for the audio to be loaded enough to play
      if (audio.readyState < 2) {
        console.log('Waiting for audio to load...');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout loading audio')), 5000);
          const onLoaded = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          audio.addEventListener('loadeddata', onLoaded, { once: true });
          audio.addEventListener('error', (e) => {
            clearTimeout(timeout);
            reject(e);
          }, { once: true });
        });
      }

      // Set playback position
      console.log('Setting currentTime to', startTime);
      audio.currentTime = startTime;

      // Play the audio
      console.log('Playing audio...');
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        await playPromise;
        console.log('Audio playing successfully');
      }

      setPlayingSegment(index);

      // Create event handler for stopping at segment end
      const handleTimeUpdate = () => {
        if (audio.currentTime >= endTime) {
          console.log('Reached end of segment, stopping');
          audio.pause();
          setPlayingSegment(null);
        }
      };

      // Create pause handler
      const handlePauseEnd = () => {
        console.log('Audio paused or ended');
        setPlayingSegment(null);
      };

      // Add event listeners
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('pause', handlePauseEnd);
      audio.addEventListener('ended', handlePauseEnd);

      // Store cleanup function
      cleanupRef.current = () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('pause', handlePauseEnd);
        audio.removeEventListener('ended', handlePauseEnd);
      };
    } catch (error) {
      console.error('Error playing audio segment:', error);
      setPlayingSegment(null);
    }
  };
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
              <div
                key={index}
                onClick={() => audioSource && handleSegmentClick(segment, index)}
                className={`border-l-2 pl-3 transition-all ${
                  playingSegment === index
                    ? 'border-green-500 bg-green-50'
                    : 'border-blue-500'
                } ${audioSource ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                title={audioSource ? 'Click to play this segment' : ''}
              >
                {showTimestamps && (
                  <div className="flex items-center gap-3 mb-1">
                    {/* Speaker Label */}
                    {segment.speaker !== undefined && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Speaker {segment.speaker}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 font-mono">
                      {formatTime(segment.offset)}
                    </span>
                    {showConfidence && (
                      <span className={`text-xs font-medium ${getConfidenceColor(segment.confidence)}`}>
                        {getConfidenceLabel(segment.confidence)} ({Math.round(segment.confidence * 100)}%)
                      </span>
                    )}
                    {/* Play icon indicator */}
                    {audioSource && (
                      <span className="text-xs text-gray-400">
                        {playingSegment === index ? (
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        )}
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

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
