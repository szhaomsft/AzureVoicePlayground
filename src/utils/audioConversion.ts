// Audio format conversion utilities for Speech-to-Text

/**
 * Convert audio file to WAV PCM 16kHz mono format
 * Required for Azure Speech Recognition APIs
 */
export async function convertToWav16kHz(audioFile: File | Blob): Promise<Blob> {
  const audioContext = new AudioContext({ sampleRate: 16000 });

  try {
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Extract mono channel (or mix if stereo)
    const channelData = audioBuffer.numberOfChannels > 1
      ? mixToMono(audioBuffer)
      : audioBuffer.getChannelData(0);

    // Encode to WAV
    const wavBlob = encodeWav(channelData, 16000);

    return wavBlob;
  } finally {
    await audioContext.close();
  }
}

/**
 * Mix stereo audio to mono
 */
function mixToMono(audioBuffer: AudioBuffer): Float32Array {
  const channelCount = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const monoData = new Float32Array(length);

  // Mix all channels
  for (let channel = 0; channel < channelCount; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      monoData[i] += channelData[i] / channelCount;
    }
  }

  return monoData;
}

/**
 * Encode Float32Array to WAV format
 */
export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 for mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Convert float samples to 16-bit PCM
  floatTo16BitPCM(view, 44, samples);

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

/**
 * Get audio duration in seconds
 */
export async function getAudioDuration(audioFile: File | Blob): Promise<number> {
  const audioContext = new AudioContext();

  try {
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer.duration;
  } finally {
    await audioContext.close();
  }
}

/**
 * Validate audio file format
 */
export function isValidAudioFormat(file: File): boolean {
  const validFormats = [
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/flac',
    'audio/webm',
    'audio/x-m4a',
    'audio/mp4'
  ];

  // Check MIME type
  if (validFormats.includes(file.type)) {
    return true;
  }

  // Check file extension as fallback
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['wav', 'mp3', 'ogg', 'flac', 'webm', 'm4a', 'mp4'];

  return extension ? validExtensions.includes(extension) : false;
}
