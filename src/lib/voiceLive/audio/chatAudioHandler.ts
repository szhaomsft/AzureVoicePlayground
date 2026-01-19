/**
 * Audio handler for Voice Live Chat - handles microphone capture and playback at 24kHz
 */
export class ChatAudioHandler {
  private context: AudioContext;
  private workletNode: AudioWorkletNode | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private readonly sampleRate = 24000;

  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  private playbackQueue: AudioBufferSourceNode[] = [];

  private analysisNode: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private animationFrameId: number | null = null;
  private circleElement: HTMLElement | null = null;

  constructor() {
    this.context = new AudioContext({ sampleRate: this.sampleRate });
  }

  async initialize() {
    // Recreate AudioContext if it was closed
    if (this.context.state === 'closed') {
      this.context = new AudioContext({ sampleRate: this.sampleRate });
    }

    // Use import.meta.env.BASE_URL for proper path resolution in Vite
    // Cast to any to work around type definition issues
    const basePath = (import.meta as any).env?.BASE_URL || '/';
    await this.context.audioWorklet.addModule(`${basePath}audio-processor.js`);

    this.analysisNode = this.context.createAnalyser();
    this.analysisNode.fftSize = 2048;
    this.analysisNode.smoothingTimeConstant = 0.85;
    this.dataArray = new Uint8Array(this.analysisNode.frequencyBinCount);
  }

  getSampleRate(): number {
    return this.sampleRate;
  }

  setCircleElement(element: HTMLElement | null) {
    this.circleElement = element;
  }

  async startRecording(onChunk: (chunk: Uint8Array) => void) {
    try {
      if (!this.workletNode) {
        await this.initialize();
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: this.sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      await this.context.resume();
      this.source = this.context.createMediaStreamSource(this.stream);
      this.workletNode = new AudioWorkletNode(
        this.context,
        'audio-recorder-processor'
      );

      this.workletNode.port.onmessage = (event) => {
        if (event.data.eventType === 'audio') {
          const float32Data = event.data.audioData;
          const int16Data = new Int16Array(float32Data.length);

          for (let i = 0; i < float32Data.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Data[i]));
            int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          const uint8Data = new Uint8Array(int16Data.buffer);
          onChunk(uint8Data);
        }
      };

      this.source.connect(this.workletNode);
      if (this.analysisNode && this.circleElement) {
        this.source.connect(this.analysisNode);
        this.startAnimation('record');
      }
      this.workletNode.connect(this.context.destination);

      this.workletNode.port.postMessage({ command: 'START_RECORDING' });
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  stopRecording() {
    if (!this.workletNode || !this.source || !this.stream) {
      return;
    }

    this.workletNode.port.postMessage({ command: 'STOP_RECORDING' });

    this.workletNode.disconnect();
    this.source.disconnect();
    this.stream.getTracks().forEach((track) => track.stop());

    this.workletNode = null;
    this.source = null;
    this.stream = null;

    this.stopAnimation();
  }

  startStreamingPlayback() {
    this.isPlaying = true;
    this.nextPlayTime = this.context.currentTime;
  }

  stopStreamingPlayback() {
    this.isPlaying = false;
    this.playbackQueue.forEach((source) => source.stop());
    this.playbackQueue = [];
  }

  playChunk(chunk: Uint8Array, onChunkPlayed?: () => void) {
    if (!this.isPlaying) return;

    const int16Data = new Int16Array(chunk.buffer);
    const float32Data = new Float32Array(int16Data.length);

    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / (int16Data[i] < 0 ? 0x8000 : 0x7fff);
    }

    const audioBuffer = this.context.createBuffer(
      1,
      float32Data.length,
      this.sampleRate
    );
    audioBuffer.getChannelData(0).set(float32Data);

    const source = this.context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.context.destination);

    if (this.analysisNode && this.circleElement) {
      source.connect(this.analysisNode);
      this.startAnimation('play');
    }

    const chunkDuration = audioBuffer.length / this.sampleRate;
    if (this.nextPlayTime < this.context.currentTime) {
      this.nextPlayTime = this.context.currentTime;
    }

    source.start(this.nextPlayTime);

    this.playbackQueue.push(source);
    source.onended = () => {
      onChunkPlayed?.();
      const index = this.playbackQueue.indexOf(source);
      if (index > -1) {
        this.playbackQueue.splice(index, 1);
      }
      if (this.playbackQueue.length === 0 && this.stream && this.circleElement) {
        this.startAnimation('record');
      }
    };

    this.nextPlayTime += chunkDuration;
  }

  private startAnimation(type: 'record' | 'play') {
    this.stopAnimation();

    const animate = () => {
      if (!this.analysisNode || !this.dataArray || !this.circleElement) return;

      this.analysisNode.getByteFrequencyData(this.dataArray);

      const volume =
        Array.from(this.dataArray).reduce((acc, v) => acc + v, 0) /
        this.dataArray.length;

      this.updateCircle(volume, type);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  private stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private updateCircle(volume: number, type: 'record' | 'play') {
    if (!this.circleElement) return;

    const minSize = 120;
    const size = minSize + volume * 0.8;
    this.circleElement.style.backgroundColor = type === 'record' ? '#e5e7eb' : '#bfdbfe';
    this.circleElement.style.width = `${size}px`;
    this.circleElement.style.height = `${size}px`;
  }

  async close() {
    this.stopAnimation();
    this.stopRecording();
    this.stopStreamingPlayback();
    await this.context.close();
  }
}
