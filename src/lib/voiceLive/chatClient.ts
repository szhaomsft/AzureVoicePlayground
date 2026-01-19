import { AzureKeyCredential } from '@azure/core-auth';
import {
  VoiceLiveClient,
  type VoiceLiveSession,
  type VoiceLiveSubscription,
  type ServerEventResponseTextDelta,
  type ServerEventResponseTextDone,
  type ServerEventResponseDone,
  type ServerEventResponseCreated,
  type ServerEventResponseAudioDelta,
  type ServerEventConversationItemInputAudioTranscriptionDelta,
  type ServerEventConversationItemInputAudioTranscriptionCompleted,
  type ServerEventError,
  type ServerEventSessionAvatarConnecting,
  type ServerEventSessionUpdated,
  type ServerEventSessionCreated,
  type VoiceLiveSessionHandlers,
  type RequestSession,
  type AvatarConfig as SdkAvatarConfig,
  type ClientEventSessionAvatarConnect,
} from '@azure/ai-voicelive';
import type { VoiceLiveChatConfig, ChatMessage, AvatarConfig } from './chatDefaults';
import { Pcm16Player } from './audio/pcmPlayer';

export type ChatState = {
  isConnected: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  isAvatarConnected: boolean;
  messages: ChatMessage[];
  statusText: string;
};

export type ChatClientEvents = {
  onState: (next: ChatState) => void;
  onAvatarTrack?: (event: RTCTrackEvent) => void;
};

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export class VoiceLiveChatClient {
  private client?: VoiceLiveClient;
  private session?: VoiceLiveSession;
  private subscription?: VoiceLiveSubscription;
  private readonly pcmPlayer = new Pcm16Player();
  private peerConnection?: RTCPeerConnection;
  private avatarConfig?: AvatarConfig;

  private state: ChatState = {
    isConnected: false,
    isRecording: false,
    isSpeaking: false,
    isAvatarConnected: false,
    messages: [],
    statusText: '',
  };

  private currentResponseText = '';
  private currentResponseId = '';

  private readonly events: ChatClientEvents;

  constructor(events: ChatClientEvents) {
    this.events = events;
  }

  get snapshot(): ChatState {
    return this.state;
  }

  private setState(patch: Partial<ChatState>) {
    this.state = { ...this.state, ...patch };
    this.events.onState(this.state);
  }

  private addMessage(type: ChatMessage['type'], content: string) {
    const message: ChatMessage = {
      id: generateId(),
      type,
      content,
      timestamp: Date.now(),
    };
    this.setState({ messages: [...this.state.messages, message] });
  }

  private buildAvatarConfig(avatar: AvatarConfig): SdkAvatarConfig | undefined {
    if (!avatar.enabled || avatar.type === 'none') {
      return undefined;
    }

    // Basic video params - don't over-constrain with crop initially
    const videoParams = {
      codec: 'h264' as const,
    };

    if (avatar.customized && avatar.customAvatarName) {
      if (avatar.type === 'photo') {
        return {
          type: 'photo-avatar',
          model: 'vasa-1',
          character: avatar.customAvatarName,
          customized: true,
          video: videoParams,
        };
      }
      return {
        type: 'video-avatar',
        character: avatar.customAvatarName,
        customized: true,
        video: videoParams,
      };
    }

    if (avatar.type === 'photo') {
      return {
        type: 'photo-avatar',
        model: 'vasa-1',
        character: avatar.character,
        customized: false,
        video: videoParams,
      };
    }

    return {
      type: 'video-avatar',
      character: avatar.character,
      style: avatar.style,
      customized: false,
      video: videoParams,
    };
  }

  private buildSessionConfig(config: VoiceLiveChatConfig): RequestSession {
    const isOpenAIVoice = config.voiceType === 'openai' || !config.voice.includes('-');
    const avatarSdkConfig = this.buildAvatarConfig(config.avatar);
    const modalities: string[] = ['text', 'audio'];
    if (avatarSdkConfig) {
      modalities.push('avatar');
    }

    return {
      modalities: modalities as any,
      model: config.model,
      instructions: config.instructions,
      voice: isOpenAIVoice
        ? config.voice
        : {
            name: config.voice,
            type: 'azure-standard',
          },
      inputAudioFormat: 'pcm16',
      outputAudioFormat: 'pcm16',
      inputAudioTranscription: {
        model: config.model.includes('gpt') && config.model.includes('realtime')
          ? 'whisper-1'
          : 'azure-speech',
        language: config.recognitionLanguage === 'auto' ? undefined : config.recognitionLanguage,
      },
      turnDetection: {
        type: config.turnDetectionType,
        removeFillerWords: config.removeFillerWords,
      },
      temperature: config.temperature,
      inputAudioNoiseReduction: config.useNoiseSuppression
        ? { type: 'azure_deep_noise_suppression' }
        : undefined,
      inputAudioEchoCancellation: config.useEchoCancellation
        ? { type: 'server_echo_cancellation' }
        : undefined,
      avatar: avatarSdkConfig,
    };
  }

  private async setupPeerConnection(serverSdp: string): Promise<void> {
    console.log('[VoiceLive Chat] Setting up WebRTC peer connection');
    this.peerConnection = new RTCPeerConnection();

    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      console.log('[VoiceLive Chat] Received track:', event.track.kind);
      if (this.events.onAvatarTrack) {
        this.events.onAvatarTrack(event);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('[VoiceLive Chat] ICE state:', this.peerConnection?.iceConnectionState);
      if (this.peerConnection?.iceConnectionState === 'connected') {
        this.setState({ isAvatarConnected: true, statusText: 'Avatar connected' });
      } else if (
        this.peerConnection?.iceConnectionState === 'disconnected' ||
        this.peerConnection?.iceConnectionState === 'failed'
      ) {
        this.setState({ isAvatarConnected: false });
      }
    };

    this.peerConnection.addTransceiver('video', { direction: 'recvonly' });
    this.peerConnection.addTransceiver('audio', { direction: 'recvonly' });

    await this.peerConnection.setRemoteDescription({ type: 'offer', sdp: serverSdp });
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    await new Promise<void>((resolve) => {
      if (this.peerConnection?.iceGatheringState === 'complete') {
        resolve();
      } else {
        this.peerConnection!.onicegatheringstatechange = () => {
          if (this.peerConnection?.iceGatheringState === 'complete') resolve();
        };
        setTimeout(resolve, 5000);
      }
    });

    const clientSdp = this.peerConnection.localDescription?.sdp;
    if (clientSdp && this.session) {
      console.log('[VoiceLive Chat] Sending client SDP');
      const avatarConnectEvent: ClientEventSessionAvatarConnect = {
        type: 'session.avatar.connect',
        clientSdp,
      };
      await this.session.sendEvent(avatarConnectEvent);
      console.log('[VoiceLive Chat] Client SDP sent successfully');
    }
  }

  private closePeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = undefined;
      this.setState({ isAvatarConnected: false });
    }
  }

  async connect(config: VoiceLiveChatConfig) {
    if (this.state.isConnected) return;

    if (!config.endpoint.trim()) throw new Error('Missing endpoint');
    if (!config.apiKey.trim()) throw new Error('Missing API key');

    this.avatarConfig = config.avatar;
    this.setState({ statusText: 'Connecting...' });

    this.client = new VoiceLiveClient(
      config.endpoint.trim(),
      new AzureKeyCredential(config.apiKey.trim()),
      {
        apiVersion: '2025-05-01-preview',
        defaultSessionOptions: { enableDebugLogging: false },
      }
    );

    const sessionConfig = this.buildSessionConfig(config);
    console.log('[VoiceLive Chat] Session config:', JSON.stringify(sessionConfig, null, 2));

    // Pass full session config to createSession - this sets initial config before connecting
    // This is important for avatar because voice cannot be updated after avatar is configured
    this.session = this.client.createSession(sessionConfig, { connectionTimeoutInMs: 30000 });

    // Subscribe to handlers BEFORE connecting so we don't miss events
    const handlers: VoiceLiveSessionHandlers = {
      onConnected: async (_args, ctx) => {
        console.log('[VoiceLive Chat] Connected', { sessionId: ctx.sessionId });
        this.setState({ statusText: 'Connected' });
      },
      onDisconnected: async (args) => {
        console.log('[VoiceLive Chat] Disconnected', args);
        this.closePeerConnection();
        this.setState({ statusText: `Disconnected: ${args.reason}` });
      },
      onServerError: async (event: ServerEventError) => {
        console.log('[VoiceLive Chat] Server error', event.error);
        this.addMessage('error', event.error.message);
      },
      onSessionCreated: async (event: ServerEventSessionCreated) => {
        console.log('[VoiceLive Chat] Session created', event.session);
        if (event.session.avatar) {
          console.log('[VoiceLive Chat] Avatar in created session:', event.session.avatar);
        }
      },
      onSessionUpdated: async (event: ServerEventSessionUpdated) => {
        console.log('[VoiceLive Chat] Session updated', event.session);
        // Check if avatar is configured in the session
        if (event.session.avatar) {
          console.log('[VoiceLive Chat] Avatar configured in session:', event.session.avatar);
        }
      },
      onSessionAvatarConnecting: async (event: ServerEventSessionAvatarConnecting) => {
        console.log('[VoiceLive Chat] Avatar connecting, received server SDP');
        console.log('[VoiceLive Chat] Server SDP length:', event.serverSdp?.length);
        try {
          await this.setupPeerConnection(event.serverSdp);
        } catch (error) {
          console.error('[VoiceLive Chat] Failed to setup avatar:', error);
          this.addMessage('error', `Avatar connection failed: ${error}`);
        }
      },
      onConversationItemInputAudioTranscriptionDelta: async (
        event: ServerEventConversationItemInputAudioTranscriptionDelta
      ) => {
        console.log('[VoiceLive Chat] Transcription delta', event.delta);
      },
      onConversationItemInputAudioTranscriptionCompleted: async (
        event: ServerEventConversationItemInputAudioTranscriptionCompleted
      ) => {
        console.log('[VoiceLive Chat] Transcription completed', event.transcript);
        if (event.transcript?.trim()) {
          this.addMessage('user', event.transcript);
        }
      },
      onInputAudioBufferSpeechStarted: async () => {
        console.log('[VoiceLive Chat] Speech started');
        this.setState({ isSpeaking: true });
      },
      onInputAudioBufferSpeechStopped: async () => {
        console.log('[VoiceLive Chat] Speech stopped');
        this.setState({ isSpeaking: false });
      },
      onResponseCreated: async (event: ServerEventResponseCreated) => {
        console.log('[VoiceLive Chat] Response created', event);
        this.currentResponseId = event.response.id ?? generateId();
        this.currentResponseText = '';
      },
      onResponseTextDelta: async (event: ServerEventResponseTextDelta) => {
        this.currentResponseText += event.delta;
      },
      onResponseTextDone: async (event: ServerEventResponseTextDone) => {
        console.log('[VoiceLive Chat] Response text done', event);
      },
      onResponseAudioDelta: async (event: ServerEventResponseAudioDelta) => {
        if (!this.avatarConfig?.enabled) {
          const chunk = event.delta;
          if (chunk instanceof Uint8Array) {
            this.pcmPlayer.enqueuePcm16(chunk, 24000);
          }
        }
      },
      onResponseDone: async (event: ServerEventResponseDone) => {
        console.log('[VoiceLive Chat] Response done', event);

        let text = this.currentResponseText.trim();

        if (!text && event.response.output && event.response.output.length > 0) {
          const outputItem: any = event.response.output[0];
          if (outputItem?.content && Array.isArray(outputItem.content)) {
            const textContent = outputItem.content.find(
              (c: any) => (c.type === 'audio' && c.transcript) || c.type === 'text'
            );
            if (textContent?.transcript) {
              text = textContent.transcript;
            } else if (textContent?.text) {
              text = textContent.text;
            }
          }
        }

        if (text) {
          this.addMessage('assistant', text);
        }

        this.currentResponseText = '';
        this.currentResponseId = '';
      },
      onError: async (args) => {
        console.log('[VoiceLive Chat] Error', args);
        this.addMessage('error', `${args.context}: ${args.error.message}`);
      },
    };

    this.subscription = this.session.subscribe(handlers);
    console.log('[VoiceLive Chat] Handlers subscribed, connecting...');

    // Connect first, then send session config (this is how startSession works internally)
    try {
      await this.session.connect();
      console.log('[VoiceLive Chat] WebSocket connected, sending session config...');

      // Send session configuration - this triggers avatar.connecting event if avatar is enabled
      await this.session.updateSession(sessionConfig);
      console.log('[VoiceLive Chat] Session config sent successfully');
    } catch (error) {
      console.error('[VoiceLive Chat] Failed to connect or configure:', error);
      throw error;
    }

    if (!config.avatar.enabled) {
      await this.pcmPlayer.resume();
    }

    this.setState({
      isConnected: true,
      statusText: config.avatar.enabled ? 'Connecting avatar...' : 'Ready',
    });
  }

  async disconnect() {
    this.setState({ isRecording: false, isSpeaking: false });

    try {
      this.closePeerConnection();
      this.pcmPlayer.stop();
      await this.subscription?.close();
      this.subscription = undefined;

      await this.session?.dispose();
      this.session = undefined;

      this.client = undefined;
    } finally {
      this.setState({ isConnected: false, isAvatarConnected: false, statusText: 'Disconnected' });
    }
  }

  async sendText(text: string) {
    if (!this.session) throw new Error('Not connected');
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message to chat
    this.addMessage('user', trimmed);

    await this.session.addConversationItem({
      type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text: trimmed }],
    } as any);

    await this.session.sendEvent({
      type: 'response.create',
      response: { modalities: ['text', 'audio'] },
    });
  }

  async sendAudio(pcm16leBytes: Uint8Array) {
    if (!this.session || !this.session.isConnected) return;
    await this.session.sendAudio(pcm16leBytes);
  }

  clearMessages() {
    this.setState({ messages: [] });
  }
}
