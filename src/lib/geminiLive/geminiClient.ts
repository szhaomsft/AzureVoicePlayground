// Gemini Live API WebSocket Client
// Adapted for Azure TTS Playground

const MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";
const SAMPLE_RATE = 24000;

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
  private ws: WebSocket | null = null;
  private config: GeminiClientConfig;
  private productData: string = '';

  constructor(config: GeminiClientConfig) {
    this.config = config;
  }

  setProductData(data: string) {
    this.productData = data;
  }

  async connect(): Promise<void> {
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.config.apiKey}`;

    this.config.onStatusChange('connecting');

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[Gemini] WebSocket connected');
          this.sendSetup();
          this.config.onStatusChange('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[Gemini] WebSocket error:', error);
          this.config.onError('WebSocket connection error');
          this.config.onStatusChange('error');
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('[Gemini] WebSocket closed:', event.code, event.reason);
          this.config.onStatusChange('disconnected');
        };
      } catch (error) {
        this.config.onError(`Failed to connect: ${error}`);
        this.config.onStatusChange('error');
        reject(error);
      }
    });
  }

  private sendSetup(): void {
    const tools = this.config.enableProductLookup ? [
      {
        function_declarations: [
          {
            name: "get_product_inventory",
            description: "Retrieves the full product catalog including SKUs, sizes, colors, and prices. Use this when the user asks about products, inventory, prices, or availability.",
            parameters: {
              type: "object",
              properties: {},
              required: []
            }
          }
        ]
      }
    ] : [];

    // Map sensitivity to Gemini settings
    // Enum values: UNSPECIFIED=0, LOW=1, MEDIUM=2, HIGH=3
    const sensitivity = this.config.interruptionSensitivity || 'medium';
    let startSensitivity: number;
    let endSensitivity: number;
    let silenceDuration: number;

    switch (sensitivity) {
      case 'low':
        startSensitivity = 1; // START_SENSITIVITY_LOW
        endSensitivity = 1; // END_SENSITIVITY_LOW
        silenceDuration = 800; // Longer silence before detecting speech end
        break;
      case 'high':
        startSensitivity = 3; // START_SENSITIVITY_HIGH
        endSensitivity = 3; // END_SENSITIVITY_HIGH
        silenceDuration = 300;
        break;
      case 'medium':
      default:
        startSensitivity = 2; // START_SENSITIVITY_MEDIUM
        endSensitivity = 2; // END_SENSITIVITY_MEDIUM
        silenceDuration = 500;
        break;
    }

    // Use custom system prompt or default
    const systemPrompt = this.config.systemPrompt || (
      this.config.enableProductLookup
        ? `You are a helpful voice assistant. You help customers find products.

When asked about products, use the get_product_inventory tool to retrieve the product catalog. Be conversational and helpful.

Keep your responses concise and natural for voice interaction. Focus on the most relevant information.`
        : `You are a helpful voice assistant for testing Gemini Live API integration with Azure TTS Playground.

Keep your responses concise and natural for voice interaction.`
    );

    const setupMessage = {
      setup: {
        model: `models/${MODEL}`,
        ...(tools.length > 0 && { tools }),
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: "Zephyr"
              }
            }
          }
        },
        realtime_input_config: {
          automatic_activity_detection: {
            disabled: false,
            start_of_speech_sensitivity: startSensitivity,
            end_of_speech_sensitivity: endSensitivity,
            prefix_padding_ms: 20,
            silence_duration_ms: silenceDuration
          }
        },
        input_audio_transcription: {},
        output_audio_transcription: {},
        system_instruction: {
          parts: [
            {
              text: systemPrompt
            }
          ]
        }
      }
    };

    console.log('[Gemini] Sending setup message with sensitivity:', sensitivity);
    this.send(setupMessage);
  }

  private async handleMessage(data: string | Blob): Promise<void> {
    try {
      let jsonData: string;
      if (data instanceof Blob) {
        jsonData = await data.text();
      } else {
        jsonData = data;
      }

      const message = JSON.parse(jsonData);

      // Handle tool calls
      if (message.toolCall) {
        const functionCalls = message.toolCall.functionCalls || [];
        for (const call of functionCalls) {
          await this.handleToolCall(call);
        }
        return;
      }

      // Handle server content (audio/text responses)
      if (message.serverContent) {
        // Handle interruption
        if (message.serverContent.interrupted) {
          console.log('[Gemini] Generation was interrupted by user');
          this.config.onInterrupted();
          return;
        }

        // Handle input transcription (what the user said)
        if (message.serverContent.inputTranscription) {
          const inputText = message.serverContent.inputTranscription.text;
          if (inputText) {
            this.config.onInputTranscript(inputText);
          }
        }

        // Handle output transcription (what the assistant said)
        if (message.serverContent.outputTranscription) {
          const outputText = message.serverContent.outputTranscription.text;
          if (outputText) {
            this.config.onOutputTranscript(outputText);
          }
        }

        const parts = message.serverContent.modelTurn?.parts || [];

        for (const part of parts) {
          // Skip thought parts
          if (part.thought) continue;

          // Handle text response (fallback if no transcription)
          if (part.text) {
            this.config.onOutputTranscript(part.text);
          }

          // Handle audio data
          if (part.inlineData) {
            const base64Audio = part.inlineData.data;
            const audioBuffer = this.base64ToArrayBuffer(base64Audio);
            this.config.onAudioData(audioBuffer);
          }
        }

        // Handle turn complete
        if (message.serverContent.turnComplete) {
          this.config.onTurnComplete();
        }
      }
    } catch (error) {
      console.error('[Gemini] Error parsing message:', error);
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

    // Send tool response
    const toolResponse = {
      tool_response: {
        function_responses: [
          {
            id: call.id,
            name: call.name,
            response: {
              result: result
            }
          }
        ]
      }
    };

    this.send(toolResponse);
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const base64Audio = this.arrayBufferToBase64(audioData);

    const message = {
      realtime_input: {
        media_chunks: [
          {
            mime_type: `audio/pcm;rate=${SAMPLE_RATE}`,
            data: base64Audio
          }
        ]
      }
    };

    this.send(message);
  }

  sendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      client_content: {
        turns: [
          {
            role: "user",
            parts: [{ text: text }]
          }
        ],
        turn_complete: true
      }
    };

    this.send(message);
  }

  private send(message: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
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
