export interface HistoryEntry {
  id: string;              // Unique identifier (timestamp-based)
  timestamp: number;       // Date.now()
  text: string;            // Original text synthesized
  voice: string;           // Voice name used
  region: string;          // Azure region
  audioData: ArrayBuffer;  // MP3 audio data
  duration: number;        // Audio duration in seconds
}
