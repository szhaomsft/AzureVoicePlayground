/**
 * Video format conversion utility using FFmpeg.wasm
 */
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let isLoaded = false;

/**
 * Initialize FFmpeg instance (lazy loading)
 */
export async function initFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpeg && isLoaded) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  // Set up progress logging
  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(progress);
    });
  }

  try {
    // Load FFmpeg core from CDN
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    isLoaded = true;
    console.log('FFmpeg loaded successfully');
  } catch (error) {
    console.error('Failed to load FFmpeg:', error);
    throw new Error('FFmpeg initialization failed. Your browser may not support the required features.');
  }

  return ffmpeg;
}

/**
 * Convert WebM video to MP4 format
 * @param webmBlob - Input WebM video blob
 * @param onProgress - Optional progress callback (0-1)
 * @returns MP4 video blob
 */
export async function convertWebMToMP4(
  webmBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpegInstance = await initFFmpeg(onProgress);

  const inputFileName = 'input.webm';
  const outputFileName = 'output.mp4';

  try {
    // Write input file to FFmpeg virtual file system
    const inputData = await fetchFile(webmBlob);
    await ffmpegInstance.writeFile(inputFileName, inputData);

    console.log('Input file written, starting conversion...');

    // Convert WebM to MP4 with H.264 codec
    // -i: input file
    // -c:v libx264: use H.264 video codec
    // -preset ultrafast: fastest encoding (good for static images)
    // -crf 28: quality (higher = smaller file, good for static content)
    // -c:a aac: use AAC audio codec
    // -b:a 128k: audio bitrate
    await ffmpegInstance.exec([
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '28',
      '-c:a', 'aac',
      '-b:a', '128k',
      outputFileName
    ]);

    console.log('Conversion completed, reading output file...');

    // Read the output file
    const data = await ffmpegInstance.readFile(outputFileName);

    // Convert Uint8Array to Blob
    const mp4Blob = new Blob([data], { type: 'video/mp4' });

    console.log('MP4 blob created, cleaning up files...');

    // Clean up files from virtual file system (with error handling)
    try {
      await ffmpegInstance.deleteFile(inputFileName);
    } catch (e) {
      console.warn('Failed to delete input file:', e);
    }

    try {
      await ffmpegInstance.deleteFile(outputFileName);
    } catch (e) {
      console.warn('Failed to delete output file:', e);
    }

    return mp4Blob;
  } catch (error) {
    console.error('FFmpeg conversion error:', error);

    // Clean up on error (with error handling)
    try {
      await ffmpegInstance.deleteFile(inputFileName);
    } catch (e) {
      // Ignore cleanup errors
    }

    try {
      await ffmpegInstance.deleteFile(outputFileName);
    } catch (e) {
      // Ignore cleanup errors
    }

    throw new Error(`Failed to convert video to MP4: ${error}`);
  }
}

/**
 * Check if FFmpeg is supported in the current browser
 */
export function isFFmpegSupported(): boolean {
  // FFmpeg.wasm requires SharedArrayBuffer which needs specific headers
  // or is available in certain contexts
  return typeof SharedArrayBuffer !== 'undefined' ||
         typeof window !== 'undefined' && 'crossOriginIsolated' in window;
}
