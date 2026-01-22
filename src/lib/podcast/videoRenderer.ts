/**
 * Video renderer for podcast with static Bing wallpaper background
 * Generates minimal video files with just a static image and audio
 */

import { loadImage, createFallbackGradient } from '../../utils/bingImage';

export interface VideoGenerationOptions {
  audioUrl: string;
  podcastTitle: string;
  width?: number;
  height?: number;
  onProgress?: (progress: number) => void;
  onComplete?: (videoBlob: Blob) => void;
  onError?: (error: Error) => void;
}

export class PodcastVideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioElement: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private backgroundImage: HTMLImageElement | null = null;
  private backgroundImageUrl: string | null = null;
  private audioBlobUrl: string | null = null;

  constructor(
    private options: VideoGenerationOptions
  ) {
    // Use smaller resolution: 1280x720 (720p) for smaller file size
    const width = options.width || 1280;
    const height = options.height || 720;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }
    this.ctx = ctx;

    this.audioElement = new Audio();
  }

  /**
   * Fetch Bing wallpaper URL using multiple fallback methods
   */
  private async fetchBingImageUrl(): Promise<string> {
    // Method 1: Community-maintained Bing wallpaper API (most reliable, try first)
    try {
      const randomIndex = Math.floor(Math.random() * 7); // Get random wallpaper from past week
      const response = await fetch(`https://bing.biturl.top/?resolution=1280&format=json&index=${randomIndex}&mkt=en-US`);
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          console.log('Using Bing image (Method 1 - wallpaper API):', data.url);
          return data.url;
        }
      }
    } catch (error) {
      console.warn('Method 1 (wallpaper API) failed:', error);
    }

    // Method 2: Use CORS proxy
    try {
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const bingApiUrl = encodeURIComponent('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US');
      const response = await fetch(`${proxyUrl}${bingApiUrl}`);
      if (response.ok) {
        const data = await response.json();
        if (data.images && data.images.length > 0) {
          const imageUrl = `https://www.bing.com${data.images[0].url}`;
          console.log('Using Bing image (Method 2 - CORS proxy):', imageUrl);
          return imageUrl;
        }
      }
    } catch (error) {
      console.warn('Method 2 (CORS proxy) failed:', error);
    }

    // Fallback: Use a collection of beautiful Bing wallpapers
    const fallbackImages = [
      'https://www.bing.com/th?id=OHR.NaplesBasilica_EN-US0488733664_1920x1080.jpg',
      'https://www.bing.com/th?id=OHR.AuroraReine_EN-US9682343142_1920x1080.jpg',
      'https://www.bing.com/th?id=OHR.LicancaburVolcano_EN-US9749384708_1920x1080.jpg',
      'https://www.bing.com/th?id=OHR.SnowdoniaSnow_EN-US9892342479_1920x1080.jpg',
      'https://www.bing.com/th?id=OHR.RedRocksArches_EN-US0089294623_1920x1080.jpg',
    ];
    const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
    console.log('Using fallback Bing image:', randomFallback);
    return randomFallback;
  }

  /**
   * Initialize audio context for recording (no analysis needed)
   */
  private initializeAudioContext() {
    // Create new AudioContext if needed
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Draw static background image on canvas (no overlay, no animations)
   */
  private async drawBackground(): Promise<void> {
    try {
      // Fetch and cache the background image URL once
      if (!this.backgroundImageUrl) {
        this.backgroundImageUrl = await this.fetchBingImageUrl();
      }

      // Load image once and cache it
      if (!this.backgroundImage) {
        this.backgroundImage = await loadImage(this.backgroundImageUrl);
      }

      const img = this.backgroundImage;

      // Draw image covering the entire canvas
      const scale = Math.max(
        this.canvas.width / img.width,
        this.canvas.height / img.height
      );
      const x = (this.canvas.width - img.width * scale) / 2;
      const y = (this.canvas.height - img.height * scale) / 2;

      this.ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    } catch (error) {
      console.warn('Failed to load image, using fallback gradient:', error);
      createFallbackGradient(this.canvas, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Start video generation with static background
   */
  async generate(): Promise<void> {
    try {
      // Fetch audio using CORS proxy to bypass COEP restrictions
      console.log('Fetching audio from:', this.options.audioUrl);

      // Use CORS proxy to fetch the audio
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const proxiedUrl = proxyUrl + encodeURIComponent(this.options.audioUrl);

      console.log('Fetching via proxy:', proxiedUrl);
      const audioResponse = await fetch(proxiedUrl);

      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch audio via proxy: ${audioResponse.status} ${audioResponse.statusText}`);
      }

      const audioBlob = await audioResponse.blob();
      const audioBlobUrl = URL.createObjectURL(audioBlob);
      this.audioBlobUrl = audioBlobUrl; // Store for cleanup

      // Create a NEW audio element for each generation to avoid reuse errors
      this.audioElement = new Audio();
      this.audioElement.src = audioBlobUrl;

      await this.audioElement.load();

      // Wait for metadata to load
      await new Promise((resolve) => {
        this.audioElement.addEventListener('loadedmetadata', resolve, { once: true });
      });

      // Initialize audio context (no analysis needed)
      this.initializeAudioContext();

      // Draw static background once
      await this.drawBackground();

      // Setup MediaRecorder with static canvas
      const canvasStream = this.canvas.captureStream(1); // 1 fps for static image
      const audioTrack = this.audioContext!.createMediaStreamDestination();

      // Connect audio for recording - no analyzer needed
      const audioSource = this.audioContext!.createMediaElementSource(this.audioElement);
      audioSource.connect(audioTrack);
      audioSource.connect(this.audioContext!.destination);

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioTrack.stream.getAudioTracks(),
      ]);

      // Check for supported MIME types
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];

      let mimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      if (!mimeType) {
        throw new Error('No supported video MIME type found');
      }

      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 500000, // 500 kbps (reduced for static image)
      });

      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        this.options.onComplete?.(blob);
        this.cleanup();
      };

      // Start recording
      this.isRecording = true;
      this.mediaRecorder.start();
      this.audioElement.play();

      // Monitor progress
      this.audioElement.addEventListener('timeupdate', () => {
        const progress = this.audioElement.duration > 0
          ? this.audioElement.currentTime / this.audioElement.duration
          : 0;
        this.options.onProgress?.(progress);
      });

      // Stop when audio ends
      this.audioElement.addEventListener('ended', () => {
        this.stop();
      }, { once: true });

    } catch (error) {
      console.error('Video generation error:', error);
      this.options.onError?.(error as Error);
      this.cleanup();
    }
  }

  /**
   * Stop recording
   */
  stop() {
    this.isRecording = false;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.audioElement.pause();
  }

  /**
   * Cleanup resources
   */
  private cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Revoke blob URL to free memory
    if (this.audioBlobUrl) {
      URL.revokeObjectURL(this.audioBlobUrl);
      this.audioBlobUrl = null;
    }
  }

  /**
   * Cancel generation
   */
  cancel() {
    this.stop();
    this.cleanup();
  }
}
