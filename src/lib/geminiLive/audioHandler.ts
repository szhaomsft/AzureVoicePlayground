// Audio handling for Gemini Live
// Uses Web Audio API for browser-based audio processing

// Input sample rate (microphone) - Gemini expects 16kHz for input
export const INPUT_SAMPLE_RATE = 16000;
// Output sample rate (playback) - Gemini outputs 24kHz audio
export const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

export class GeminiAudioHandler {
  private recordingContext: AudioContext;
  private playbackContext: AudioContext;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private playbackAnalyser: AnalyserNode | null = null;
  private onAudioData: ((data: ArrayBuffer) => void) | null = null;
  private isRecording = false;

  // Audio playback with continuous scheduling
  private playbackQueue: AudioBufferSourceNode[] = [];
  private nextPlayTime = 0;
  private isPlaybackStarted = false;

  // Animation
  private circleElement: HTMLElement | null = null;
  private animationFrameId: number | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private currentAnimationType: 'record' | 'play' | null = null;

  constructor() {
    this.recordingContext = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
    this.playbackContext = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
  }

  setCircleElement(element: HTMLElement | null) {
    this.circleElement = element;
  }

  async startRecording(onAudioData: (data: ArrayBuffer) => void): Promise<void> {
    this.onAudioData = onAudioData;

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: INPUT_SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Resume context if needed
      if (this.recordingContext.state === 'suspended') {
        await this.recordingContext.resume();
      }

      // Create source node from microphone
      this.sourceNode = this.recordingContext.createMediaStreamSource(this.mediaStream);

      // Create analyser for volume monitoring
      this.analyserNode = this.recordingContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.7; // Less smoothing for more responsive animation
      this.analyserNode.minDecibels = -90; // Increase sensitivity to quiet sounds
      this.analyserNode.maxDecibels = -10;
      this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

      // Create processor node for capturing audio data
      this.processorNode = this.recordingContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

      this.processorNode.onaudioprocess = (event) => {
        if (!this.isRecording || !this.onAudioData) return;

        const inputData = event.inputBuffer.getChannelData(0);

        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const sample = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        }

        this.onAudioData(pcmData.buffer);
      };

      // Connect nodes
      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.processorNode);
      this.processorNode.connect(this.recordingContext.destination);

      this.isRecording = true;

      // Start animation for recording
      if (this.circleElement) {
        this.startAnimation('record');
      }

      console.log('[Gemini Audio] Recording started');
    } catch (error) {
      console.error('[Gemini Audio] Error starting recording:', error);
      throw error;
    }
  }

  stopRecording(): void {
    this.isRecording = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.stopAnimation();

    console.log('[Gemini Audio] Recording stopped');
  }

  queueAudioForPlayback(audioData: ArrayBuffer): void {
    try {
      // Resume context if suspended (browser autoplay policy)
      if (this.playbackContext.state === 'suspended') {
        this.playbackContext.resume();
      }

      // Convert Int16 PCM to Float32
      const int16Data = new Int16Array(audioData);
      const float32Data = new Float32Array(int16Data.length);

      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 0x8000;
      }

      // Create audio buffer
      const audioBuffer = this.playbackContext.createBuffer(1, float32Data.length, OUTPUT_SAMPLE_RATE);
      audioBuffer.getChannelData(0).set(float32Data);

      // Create buffer source
      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;

      // Create playback analyser if needed
      if (!this.playbackAnalyser) {
        this.playbackAnalyser = this.playbackContext.createAnalyser();
        this.playbackAnalyser.fftSize = 2048;
        this.playbackAnalyser.smoothingTimeConstant = 0.7;
        this.playbackAnalyser.minDecibels = -90;
        this.playbackAnalyser.maxDecibels = -10;
      }

      // Connect to analyser for visualization and destination for audio output
      source.connect(this.playbackAnalyser);
      this.playbackAnalyser.connect(this.playbackContext.destination);

      // Start playback animation
      if (this.circleElement) {
        this.startAnimation('play');
      }

      // Schedule playback
      const currentTime = this.playbackContext.currentTime;

      if (!this.isPlaybackStarted) {
        // First chunk - start immediately with small buffer
        this.nextPlayTime = currentTime + 0.05; // 50ms initial buffer
        this.isPlaybackStarted = true;
      }

      // If we've fallen behind, catch up
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime + 0.01;
      }

      // Schedule this chunk
      source.start(this.nextPlayTime);

      // Add to queue and handle onended
      this.playbackQueue.push(source);
      source.onended = () => {
        const index = this.playbackQueue.indexOf(source);
        if (index > -1) {
          this.playbackQueue.splice(index, 1);
        }
        // When playback queue is empty and we're still recording, switch back to record animation
        if (this.playbackQueue.length === 0 && this.mediaStream && this.circleElement) {
          this.startAnimation('record');
        }
      };

      // Calculate when this chunk ends for next scheduling
      const chunkDuration = float32Data.length / OUTPUT_SAMPLE_RATE;
      this.nextPlayTime += chunkDuration;

    } catch (error) {
      console.error('[Gemini Audio] Error queuing audio:', error);
    }
  }

  private startAnimation(type: 'record' | 'play') {
    // Don't restart if already animating the same type
    if (this.currentAnimationType === type && this.animationFrameId) {
      return;
    }

    this.stopAnimation();
    this.currentAnimationType = type;

    const animate = () => {
      // Use the appropriate analyser based on animation type
      const analyser = type === 'record' ? this.analyserNode : this.playbackAnalyser;

      if (!analyser || !this.circleElement) {
        console.warn('[Gemini Audio] Animation stopped - missing analyser or circle');
        return;
      }

      if (!this.dataArray || this.dataArray.length !== analyser.frequencyBinCount) {
        this.dataArray = new Uint8Array(analyser.frequencyBinCount);
      }

      analyser.getByteFrequencyData(this.dataArray);

      const volume = Array.from(this.dataArray).reduce((acc, v) => acc + v, 0) / this.dataArray.length;

      this.updateCircle(volume, type);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    console.log('[Gemini Audio] Starting animation:', type);
    animate();
  }

  private stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.currentAnimationType = null;
  }

  private updateCircle(volume: number, type: 'record' | 'play') {
    if (!this.circleElement) return;

    const minSize = 120;
    const maxSize = 200; // Add max size limit to prevent overflow
    // Significantly increase multiplier for much more visible size changes
    const size = Math.min(minSize + volume * 3.0, maxSize);

    // Normalize volume to 0-1 range for color interpolation
    const intensity = Math.min(volume / 128, 1);

    // Colorful gradients based on type and intensity - EXACT MATCH to Voice Live
    let gradient: string;
    if (type === 'record') {
      // Recording: green to teal gradient, more vibrant with higher volume
      const hue1 = 160 + intensity * 20; // teal range
      const hue2 = 180 + intensity * 30; // cyan range
      const saturation = 60 + intensity * 40;
      const lightness = 70 - intensity * 20;
      gradient = `linear-gradient(135deg, hsl(${hue1}, ${saturation}%, ${lightness}%), hsl(${hue2}, ${saturation}%, ${lightness}%))`;
    } else {
      // Playing: purple to pink gradient, more vibrant with higher volume
      const hue1 = 260 + intensity * 20; // purple range
      const hue2 = 300 + intensity * 30; // pink range
      const saturation = 60 + intensity * 40;
      const lightness = 70 - intensity * 20;
      gradient = `linear-gradient(135deg, hsl(${hue1}, ${saturation}%, ${lightness}%), hsl(${hue2}, ${saturation}%, ${lightness}%))`;
    }

    this.circleElement.style.background = gradient;
    this.circleElement.style.width = `${size}px`;
    this.circleElement.style.height = `${size}px`;
    this.circleElement.style.boxShadow = `0 0 ${20 + intensity * 30}px rgba(${type === 'record' ? '20, 184, 166' : '168, 85, 247'}, ${0.3 + intensity * 0.4})`;
  }

  resetPlayback(): void {
    this.stopAnimation();
    this.playbackQueue.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
    });
    this.playbackQueue = [];
    this.isPlaybackStarted = false;
    this.nextPlayTime = 0;
  }

  stopPlayback(): void {
    console.log('[Gemini Audio] Stopping audio playback due to interruption');
    this.stopAnimation();
    this.playbackQueue.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
    });
    this.playbackQueue = [];
    this.isPlaybackStarted = false;
    this.nextPlayTime = 0;

    // Switch back to record animation if still recording
    if (this.mediaStream && this.circleElement) {
      this.startAnimation('record');
    }
  }

  cleanup(): void {
    this.stopRecording();
    this.resetPlayback();

    if (this.recordingContext && this.recordingContext.state !== 'closed') {
      this.recordingContext.close();
    }

    if (this.playbackContext && this.playbackContext.state !== 'closed') {
      this.playbackContext.close();
    }
  }
}
