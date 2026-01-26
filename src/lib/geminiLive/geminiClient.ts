// Gemini Live API Client using official SDK
// Adapted for Azure TTS Playground

import { GoogleGenAI, Modality, StartSensitivity, EndSensitivity, type Session } from '@google/genai';
import { INPUT_SAMPLE_RATE } from './audioHandler';

const MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

export interface GeminiClientConfig {
  apiKey: string;
  onAudioData: (audioData: ArrayBuffer) => void;
  onInputTranscript: (text: string) => void;
  onOutputTranscript: (text: string) => void;
  onTurnComplete: () => void;
  onInterrupted: () => void;
  onToolCall: (toolName: string) => void;
  onError: (error: string) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onLatencyMeasured?: (latencyMs: number) => void;
  enableProductLookup?: boolean;
  interruptionSensitivity?: 'low' | 'medium' | 'high';
  systemPrompt?: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export class GeminiClient {
  private session: Session | null = null;
  private config: GeminiClientConfig;
  private productData: string = '';
  private ai: GoogleGenAI;

  // Latency tracking
  private userSpeechEndTime: number | null = null;
  private firstAudioReceived: boolean = false;

  constructor(config: GeminiClientConfig) {
    this.config = config;
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
  }

  setProductData(data: string) {
    this.productData = data;
  }

  // Called by external VAD when user speech ends
  markSpeechEnd(): void {
    this.userSpeechEndTime = performance.now();
    this.firstAudioReceived = false;
    // @ts-ignore - fractionalSecondDigits is valid but not in TypeScript types
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    console.log(`🎤 [Gemini] Speech end detected by VAD at ${timestamp}`);
  }

  async connect(): Promise<void> {
    this.config.onStatusChange('connecting');

    try {
      // Map sensitivity to Gemini settings using proper enums
      const sensitivity = this.config.interruptionSensitivity || 'medium';
      let startSensitivity: StartSensitivity;
      let endSensitivity: EndSensitivity;
      let silenceDuration: number;

      switch (sensitivity) {
        case 'low':
          startSensitivity = StartSensitivity.START_SENSITIVITY_LOW;
          endSensitivity = EndSensitivity.END_SENSITIVITY_LOW;
          silenceDuration = 800;
          break;
        case 'high':
          startSensitivity = StartSensitivity.START_SENSITIVITY_HIGH;
          endSensitivity = EndSensitivity.END_SENSITIVITY_HIGH;
          silenceDuration = 300;
          break;
        case 'medium':
        default:
          startSensitivity = StartSensitivity.START_SENSITIVITY_LOW; // Default is LOW per docs
          endSensitivity = EndSensitivity.END_SENSITIVITY_LOW;
          silenceDuration = 500;
          break;
      }

      // Prepare tools if product lookup is enabled
      const tools = this.config.enableProductLookup ? [{
        functionDeclarations: [{
          name: "get_product_inventory",
          description: "Retrieves the full product catalog including SKUs, sizes, colors, and prices. Use this when the user asks about products, inventory, prices, or availability.",
        }]
      }] : undefined;

      // Use custom system prompt or default
      const systemPrompt = this.config.systemPrompt || (
        this.config.enableProductLookup
          ? `You are a helpful voice assistant. You help customers find products.

When asked about products, use the get_product_inventory tool to retrieve the product catalog. Be conversational and helpful.

Keep your responses concise and natural for voice interaction. Focus on the most relevant information.`
          : `You are a helpful voice assistant for testing Gemini Live API integration with Azure TTS Playground.

Keep your responses concise and natural for voice interaction.`
      );

      console.log('[Gemini] Connecting with SDK...');

      this.session = await this.ai.live.connect({
        model: MODEL,
        callbacks: {
          onopen: () => {
            console.log('[Gemini] Connected via SDK');
            this.config.onStatusChange('connected');
          },
          onmessage: (message) => {
            this.handleServerMessage(message);
          },
          onerror: (error) => {
            console.error('[Gemini] Session error:', error);
            this.config.onError(`Session error: ${error}`);
            this.config.onStatusChange('error');
          },
          onclose: () => {
            console.log('[Gemini] Session closed');
            this.config.onStatusChange('disconnected');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Zephyr"
              }
            }
          },
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              startOfSpeechSensitivity: startSensitivity,
              endOfSpeechSensitivity: endSensitivity,
              prefixPaddingMs: 20,
              silenceDurationMs: silenceDuration
            }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          ...(tools && { tools })
        }
      });

    } catch (error) {
      console.error('[Gemini] Connection failed:', error);
      this.config.onError(`Failed to connect: ${error}`);
      this.config.onStatusChange('error');
      throw error;
    }
  }

  private handleServerMessage(message: any): void {
    try {
      // Handle tool calls
      if (message.toolCall) {
        const functionCalls = message.toolCall.functionCalls || [];
        for (const call of functionCalls) {
          this.handleToolCall(call);
        }
        return;
      }

      // Handle server content
      if (message.serverContent) {
        this.handleServerContent(message.serverContent);
      }
    } catch (error) {
      console.error('[Gemini] Error handling server message:', error);
    }
  }

  private handleServerContent(content: any): void {
    try {
      // Handle interruption
      if (content.interrupted) {
        console.log('[Gemini] Generation was interrupted by user');
        this.config.onInterrupted();
        // Reset latency tracking on interruption
        this.userSpeechEndTime = null;
        this.firstAudioReceived = false;
        return;
      }

      // Handle input transcription (what the user said)
      if (content.inputTranscription) {
        const inputText = content.inputTranscription.text;
        if (inputText) {
          this.config.onInputTranscript(inputText);
        }
      }

      // Handle output transcription (what the assistant said)
      if (content.outputTranscription) {
        const outputText = content.outputTranscription.text;
        if (outputText) {
          this.config.onOutputTranscript(outputText);
        }
      }

      const parts = content.modelTurn?.parts || [];

      for (const part of parts) {
        // Skip thought parts
        if (part.thought) continue;

        // Handle text response (fallback if no transcription)
        if (part.text) {
          this.config.onOutputTranscript(part.text);
        }

        // Handle audio data
        if (part.inlineData) {
          // Measure latency on first audio received
          if (!this.firstAudioReceived) {
            // @ts-ignore - fractionalSecondDigits is valid but not in TypeScript types
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
            if (this.userSpeechEndTime !== null) {
              const latencyMs = performance.now() - this.userSpeechEndTime;
              this.firstAudioReceived = true;
              console.log(`🔊 [Gemini] First audio chunk received at ${timestamp} - Response latency: ${latencyMs.toFixed(0)}ms`);
              this.config.onLatencyMeasured?.(latencyMs);
            } else {
              // VAD didn't detect speech end, skip latency for this turn
              this.firstAudioReceived = true;
              console.log(`🔊 [Gemini] First audio chunk received at ${timestamp} (no VAD speech end detected)`);
            }
          }

          const base64Audio = part.inlineData.data;
          const audioBuffer = this.base64ToArrayBuffer(base64Audio);
          this.config.onAudioData(audioBuffer);
        }
      }

      // Handle turn complete
      if (content.turnComplete) {
        // Reset latency tracking for next turn
        this.userSpeechEndTime = null;
        this.firstAudioReceived = false;
        this.config.onTurnComplete();
      }
    } catch (error) {
      console.error('[Gemini] Error handling server content:', error);
    }
  }

  private async handleToolCall(call: ToolCall): Promise<void> {
    console.log('[Gemini] Tool call received:', call.name);

    // Notify UI about the tool call
    this.config.onToolCall(call.name);

    let result: string;

    if (call.name === 'get_product_inventory') {
      result = this.productData || 'No product data available. Please enable product lookup.';
    } else {
      result = `Unknown tool: ${call.name}`;
    }

    // Send tool response via session
    if (this.session) {
      await this.session.sendToolResponse({
        functionResponses: [{
          id: call.id,
          name: call.name,
          response: { result }
        }]
      });
    }
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (!this.session) return;

    try {
      // Convert ArrayBuffer to base64 string for the SDK
      const base64Data = this.arrayBufferToBase64(audioData);

      // Send audio using the format expected by the Gemini Live API
      this.session.sendRealtimeInput({
        audio: {
          data: base64Data,
          mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`
        }
      });
    } catch (error) {
      // Silently ignore errors when session is closing
      console.debug('[Gemini] Failed to send audio:', error);
    }
  }

  sendText(text: string): void {
    if (!this.session) return;

    this.session.sendClientContent({
      turns: [{ role: "user", parts: [{ text }] }],
      turnComplete: true
    });
  }

  disconnect(): void {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    this.config.onStatusChange('disconnected');
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
