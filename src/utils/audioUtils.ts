export function downloadAudioAsMP3(audioData: ArrayBuffer, filename?: string) {
  const blob = new Blob([audioData], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const downloadFilename = filename || `tts-output-${timestamp}.mp3`;

  const link = document.createElement('a');
  link.href = url;
  link.download = downloadFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function getAudioDuration(audioData: ArrayBuffer | Blob | File): Promise<number> {
  return new Promise((resolve, reject) => {
    const blob = audioData instanceof Blob ? audioData : new Blob([audioData], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
      URL.revokeObjectURL(url);
    });

    audio.addEventListener('error', () => {
      reject(new Error('Failed to load audio metadata'));
      URL.revokeObjectURL(url);
    });
  });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
