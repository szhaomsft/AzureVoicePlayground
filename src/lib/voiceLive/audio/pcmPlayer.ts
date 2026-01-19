import { pcm16BytesToFloat32LE } from './pcm16';

export type VolumeCallback = (volume: number) => void;

export class Pcm16Player {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array<ArrayBuffer>;
  private nextStartTime = 0;
  private sources: AudioBufferSourceNode[] = [];
  private animationFrameId: number | null = null;
  private onVolume: VolumeCallback | null = null;

  constructor() {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.85;
    this.analyser.connect(this.audioContext.destination);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
  }

  setVolumeCallback(callback: VolumeCallback | null) {
    this.onVolume = callback;
  }

  async resume(): Promise<void> {
    if (this.audioContext.state === 'closed') {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.85;
      this.analyser.connect(this.audioContext.destination);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    }
    if (this.audioContext.state !== 'running') {
      await this.audioContext.resume();
    }
  }

  private startVolumeMonitoring() {
    if (this.animationFrameId !== null) return;

    const monitor = () => {
      this.analyser.getByteFrequencyData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const volume = sum / this.dataArray.length;

      if (this.onVolume) {
        this.onVolume(volume);
      }

      if (this.sources.length > 0) {
        this.animationFrameId = requestAnimationFrame(monitor);
      } else {
        this.animationFrameId = null;
        if (this.onVolume) {
          this.onVolume(0); // Reset to zero when done
        }
      }
    };

    this.animationFrameId = requestAnimationFrame(monitor);
  }

  enqueuePcm16(bytes: Uint8Array, sampleRate = 16000) {
    const floatData = pcm16BytesToFloat32LE(bytes);
    const buffer = this.audioContext.createBuffer(1, floatData.length, sampleRate);
    buffer.getChannelData(0).set(floatData);

    const src = this.audioContext.createBufferSource();
    src.buffer = buffer;
    // Connect through analyser instead of directly to destination
    src.connect(this.analyser);

    const now = this.audioContext.currentTime;
    if (this.nextStartTime < now) this.nextStartTime = now;
    const startAt = this.nextStartTime;
    this.nextStartTime += buffer.duration;

    src.onended = () => {
      this.sources = this.sources.filter((s) => s !== src);
    };
    this.sources.push(src);
    src.start(startAt);

    // Start monitoring volume when playback begins
    this.startVolumeMonitoring();
  }

  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        // ignore
      }
    }
    this.sources = [];
    this.nextStartTime = 0;
    if (this.onVolume) {
      this.onVolume(0); // Reset to zero
    }
  }
}
