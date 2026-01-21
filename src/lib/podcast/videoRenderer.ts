/**
 * Video renderer for podcast with beautiful background and waveform
 */

import { fetchBingDailyImage, getPicsumImage, getGradientBackground, loadImage, createGradientBackground, createFallbackGradient } from '../../utils/bingImage';

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
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private animationFrameId: number | null = null;
  private backgroundImage: HTMLImageElement | null = null;
  private backgroundImageUrl: string | null = null;

  constructor(
    private options: VideoGenerationOptions
  ) {
    const width = options.width || 1920;
    const height = options.height || 1080;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }
    this.ctx = ctx;

    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
  }

  /**
   * Fetch Bing wallpaper URL using multiple fallback methods
   */
  private async fetchBingImageUrl(): Promise<string> {
    // Method 1: Community-maintained Bing wallpaper API (most reliable, try first)
    try {
      const randomIndex = Math.floor(Math.random() * 7); // Get random wallpaper from past week
      const response = await fetch(`https://bing.biturl.top/?resolution=1920&format=json&index=${randomIndex}&mkt=en-US`);
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
   * Initialize audio analysis
   */
  private initializeAudioAnalysis() {
    // Create new AudioContext if needed
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Create analyser
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;

    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
  }

  /**
   * Draw background image on canvas
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

      // Add semi-transparent overlay for better text visibility
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } catch (error) {
      console.warn('Failed to load image, using fallback gradient:', error);
      createFallbackGradient(this.canvas, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Draw waveform visualization with enhanced effects
   */
  private drawWaveform() {
    if (!this.analyser || !this.dataArray) return;

    // Get frequency and time domain data
    this.analyser.getByteTimeDomainData(this.dataArray as any);
    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(frequencyData);

    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerY = height / 2;
    const waveformHeight = height * 0.4;

    // Draw frequency bars (background effect)
    this.drawFrequencyBars(frequencyData, width, height);

    // Draw main waveform with gradient and glow
    this.ctx.lineWidth = 4;

    // Create gradient for waveform
    const gradient = this.ctx.createLinearGradient(0, centerY - waveformHeight/2, 0, centerY + waveformHeight/2);
    gradient.addColorStop(0, 'rgba(147, 51, 234, 0.9)');    // Purple
    gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.9)');  // Pink
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.9)');    // Blue

    this.ctx.strokeStyle = gradient;

    // Add glow effect
    this.ctx.shadowColor = 'rgba(147, 51, 234, 0.8)';
    this.ctx.shadowBlur = 20;

    this.ctx.beginPath();

    const sliceWidth = width / this.dataArray.length;
    let x = 0;

    for (let i = 0; i < this.dataArray.length; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = centerY + ((v - 1) * waveformHeight) / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.stroke();

    // Draw mirrored waveform for symmetry effect
    this.ctx.globalAlpha = 0.3;
    this.ctx.beginPath();
    x = 0;

    for (let i = 0; i < this.dataArray.length; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = centerY - ((v - 1) * waveformHeight) / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.stroke();
    this.ctx.globalAlpha = 1.0;

    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  /**
   * Draw frequency bars visualization
   */
  private drawFrequencyBars(frequencyData: Uint8Array, width: number, height: number) {
    const barCount = 64;
    const barWidth = width / barCount * 0.8;
    const barSpacing = width / barCount * 0.2;

    for (let i = 0; i < barCount; i++) {
      const barHeight = (frequencyData[i] / 255) * (height * 0.3);
      const x = i * (barWidth + barSpacing) + width * 0.1;
      const y = height / 2;

      // Create gradient for bars
      const gradient = this.ctx.createLinearGradient(x, y - barHeight/2, x, y + barHeight/2);
      gradient.addColorStop(0, 'rgba(147, 51, 234, 0.2)');
      gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.3)');
      gradient.addColorStop(1, 'rgba(147, 51, 234, 0.2)');

      this.ctx.fillStyle = gradient;

      // Draw bar above center
      this.ctx.fillRect(x, y - barHeight/2, barWidth, barHeight/2);

      // Draw bar below center (mirrored)
      this.ctx.fillRect(x, y, barWidth, barHeight/2);
    }
  }

  /**
   * Draw text overlay with progress bar
   */
  private drawTextOverlay() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const currentTime = this.audioElement.currentTime;
    const duration = this.audioElement.duration;

    // Draw progress bar
    const barWidth = width * 0.6;
    const barHeight = 8;
    const barX = (width - barWidth) / 2;
    const barY = height - 100;

    // Background bar
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress bar
    const progress = duration > 0 ? currentTime / duration : 0;
    this.ctx.fillStyle = 'rgba(147, 51, 234, 0.9)'; // Purple color
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Time display
    this.ctx.font = '24px Arial, sans-serif';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 10;
    const timeText = `${this.formatTime(currentTime)} / ${this.formatTime(duration)}`;
    this.ctx.fillText(timeText, width / 2, barY - 20);

    // Generation timestamp in bottom right corner
    this.ctx.font = '16px Arial, sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.textAlign = 'right';
    const timestamp = new Date().toLocaleString();
    this.ctx.fillText(timestamp, width - 30, height - 30);

    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  /**
   * Format time in MM:SS
   */
  private formatTime(seconds: number): string {
    if (!isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Render frame - called on each animation frame
   */
  private async renderFrame() {
    // Redraw background (or cache it for performance)
    await this.drawBackground();

    // Draw waveform
    this.drawWaveform();

    // Draw text overlay
    this.drawTextOverlay();

    // Continue animation
    if (this.isRecording) {
      this.animationFrameId = requestAnimationFrame(() => this.renderFrame());
    }
  }

  /**
   * Start video generation
   */
  async generate(): Promise<void> {
    try {
      // Create a NEW audio element for each generation to avoid reuse errors
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.src = this.options.audioUrl;

      await this.audioElement.load();

      // Wait for metadata to load
      await new Promise((resolve) => {
        this.audioElement.addEventListener('loadedmetadata', resolve, { once: true });
      });

      // Initialize audio analysis
      this.initializeAudioAnalysis();

      // Draw initial background
      await this.drawBackground();

      // Setup MediaRecorder
      const canvasStream = this.canvas.captureStream(30); // 30 fps
      const audioTrack = this.audioContext!.createMediaStreamDestination();

      // Connect audio for recording - now safe since it's a new audio element
      const audioSource = this.audioContext!.createMediaElementSource(this.audioElement);
      audioSource.connect(this.analyser!);
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
        videoBitsPerSecond: 5000000, // 5 Mbps
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

      // Start rendering
      this.renderFrame();

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

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

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

    this.analyser = null;
    this.dataArray = null;
  }

  /**
   * Cancel generation
   */
  cancel() {
    this.stop();
    this.cleanup();
  }
}
