// Transcription result types for different STT models

export interface TranscriptSegment {
  text: string;
  offset: number; // milliseconds from start
  duration: number; // milliseconds
  confidence: number; // 0-1
  words?: WordTiming[];
  speaker?: number; // Speaker ID for diarization
  locale?: string; // Detected locale for this segment
}

export interface WordTiming {
  text: string;
  offset: number;
  duration: number;
  confidence: number;
}

export interface RealtimeTranscript {
  text: string;
  segments: TranscriptSegment[];
  isStreaming: boolean;
  isFinal: boolean;
  interimText?: string; // Current interim recognition
}

export interface FastTranscript {
  fullText: string;
  segments: TranscriptSegment[];
  language: string;
  duration: number;
}

export interface WhisperTranscript {
  fullText: string;
  segments: TranscriptSegment[];
  language: string;
  duration: number;
  jobId: string;
  diarization?: SpeakerSegment[];
}

export interface SpeakerSegment {
  speaker: number;
  offset: number;
  duration: number;
  text: string;
}

// Discriminated union for model-specific results
export type TranscriptResult =
  | { model: 'realtime'; data: RealtimeTranscript }
  | { model: 'fast-transcription'; data: FastTranscript }
  | { model: 'whisper'; data: WhisperTranscript };
