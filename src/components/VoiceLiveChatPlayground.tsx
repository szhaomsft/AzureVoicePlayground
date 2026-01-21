import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  DEFAULT_CHAT_CONFIG,
  CHAT_MODEL_OPTIONS,
  RECOGNITION_LANGUAGES,
  CHAT_VOICES,
  VIDEO_AVATARS,
  PHOTO_AVATARS,
  type VoiceLiveChatConfig,
  type ChatMessage,
  type AvatarType,
} from '../lib/voiceLive/chatDefaults';
import { VoiceLiveChatClient, type ChatState } from '../lib/voiceLive/chatClient';
import { ChatAudioHandler } from '../lib/voiceLive/audio/chatAudioHandler';

interface VoiceLiveChatPlaygroundProps {
  endpoint: string;
  apiKey: string;
}

export function VoiceLiveChatPlayground({ endpoint, apiKey }: VoiceLiveChatPlaygroundProps) {
  const [config, setConfig] = useState<VoiceLiveChatConfig>(() => {
    const raw = localStorage.getItem('voicelive.chat.config');
    if (!raw) return { ...DEFAULT_CHAT_CONFIG };
    try {
      const parsed = JSON.parse(raw) as Partial<VoiceLiveChatConfig>;
      return { ...DEFAULT_CHAT_CONFIG, ...parsed };
    } catch {
      return { ...DEFAULT_CHAT_CONFIG };
    }
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAvatarConnected, setIsAvatarConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [statusText, setStatusText] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [avatarStream, setAvatarStream] = useState<MediaStream | null>(null);

  const chatClientRef = useRef<VoiceLiveChatClient | null>(null);
  const audioHandlerRef = useRef<ChatAudioHandler | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleAvatarTrack = useCallback((event: RTCTrackEvent) => {
    console.log('[Playground] Received avatar track:', event.track.kind, 'streams:', event.streams.length);
    if (event.track.kind === 'video' && event.streams[0]) {
      console.log('[Playground] Setting avatar video stream');
      setAvatarStream(event.streams[0]);
    }
  }, []);

  // Set video srcObject when stream changes
  useEffect(() => {
    if (videoRef.current && avatarStream) {
      console.log('[Playground] Attaching stream to video element');
      videoRef.current.srcObject = avatarStream;
    }
  }, [avatarStream]);

  // Initialize chat client
  if (!chatClientRef.current) {
    chatClientRef.current = new VoiceLiveChatClient({
      onState: (state: ChatState) => {
        console.log('[Playground] State update received, sessionId:', state.sessionId);
        setIsConnected(state.isConnected);
        setIsRecording(state.isRecording);
        setIsSpeaking(state.isSpeaking);
        setIsAvatarConnected(state.isAvatarConnected);
        setMessages(state.messages);
        setStatusText(state.statusText);
        setSessionId(state.sessionId);
      },
      onAvatarTrack: handleAvatarTrack,
    });
  }

  const chatClient = chatClientRef.current;

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem('voicelive.chat.config', JSON.stringify(config));
  }, [config]);

  // Cleanup on unmount - disconnect when switching playgrounds
  useEffect(() => {
    return () => {
      const client = chatClientRef.current;
      const audioHandler = audioHandlerRef.current;

      if (client?.snapshot.isConnected) {
        console.log('[VoiceLive Chat] Disconnecting on unmount');
        client.disconnect().catch(console.error);
      }

      if (audioHandler) {
        audioHandler.close().catch(console.error);
      }
    };
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Set up audio handler circle element
  useEffect(() => {
    if (audioHandlerRef.current && circleRef.current) {
      audioHandlerRef.current.setCircleElement(circleRef.current);
    }
  }, []);

  // Helper to update circle with playback animation
  const updateCircleForPlayback = useCallback((volume: number) => {
    // Update playing state based on volume
    setIsPlaying(volume > 0);

    if (!circleRef.current) return;

    const minSize = 120;
    const size = minSize + volume * 0.8;
    const intensity = Math.min(volume / 128, 1);

    // Purple to pink gradient for playback
    const hue1 = 260 + intensity * 20;
    const hue2 = 300 + intensity * 30;
    const saturation = 60 + intensity * 40;
    const lightness = 70 - intensity * 20;
    const gradient = `linear-gradient(135deg, hsl(${hue1}, ${saturation}%, ${lightness}%), hsl(${hue2}, ${saturation}%, ${lightness}%))`;

    circleRef.current.style.background = gradient;
    circleRef.current.style.width = `${size}px`;
    circleRef.current.style.height = `${size}px`;
    circleRef.current.style.boxShadow = `0 0 ${20 + intensity * 30}px rgba(168, 85, 247, ${0.3 + intensity * 0.4})`;
  }, []);

  // Set up playback volume callback
  useEffect(() => {
    chatClient.setPlaybackVolumeCallback(updateCircleForPlayback);
    return () => {
      chatClient.setPlaybackVolumeCallback(null);
    };
  }, [chatClient, updateCircleForPlayback]);

  async function handleConnect() {
    if (isConnected) return;

    setStatusText('Connecting...');
    try {
      await chatClient.connect({ ...config, endpoint, apiKey });
      setStatusText('Connected');

      // Start recording automatically
      await startRecording();
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error('[Playground] Connection error:', errorMsg);
      setStatusText(`Error: ${errorMsg}`);
    }
  }

  async function handleDisconnect() {
    setStatusText('Disconnecting...');
    try {
      await stopRecording();
      await chatClient.disconnect();
      setAvatarStream(null);
      setStatusText('Disconnected');
    } catch (e) {
      setStatusText(e instanceof Error ? e.message : String(e));
    }
  }

  async function startRecording() {
    if (isRecording) return;
    if (!chatClient.snapshot.isConnected) {
      setStatusText('Connect first');
      return;
    }

    if (!audioHandlerRef.current) {
      audioHandlerRef.current = new ChatAudioHandler();
      if (circleRef.current) {
        audioHandlerRef.current.setCircleElement(circleRef.current);
      }
    }

    try {
      await audioHandlerRef.current.startRecording((chunk) => {
        void chatClient.sendAudio(chunk);
      });
      setIsRecording(true);
    } catch (e) {
      setStatusText(e instanceof Error ? e.message : String(e));
    }
  }

  async function stopRecording() {
    if (!audioHandlerRef.current) return;

    try {
      audioHandlerRef.current.stopRecording();
      setIsRecording(false);
    } catch (e) {
      console.error('Error stopping recording:', e);
    }
  }

  async function handleSendText() {
    if (!textInput.trim()) return;
    if (!isConnected) {
      setStatusText('Connect first');
      return;
    }

    try {
      await chatClient.sendText(textInput);
      setTextInput('');
    } catch (e) {
      setStatusText(e instanceof Error ? e.message : String(e));
    }
  }

  function handleClearChat() {
    chatClient.clearMessages();
    setMessages([]);
  }

  function getMessageStyle(type: ChatMessage['type']) {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-900 ml-auto';
      case 'assistant':
        return 'bg-gray-100 text-gray-900 mr-auto';
      case 'status':
        return 'bg-yellow-100 text-yellow-800 mx-auto';
      case 'error':
        return 'bg-red-100 text-red-800 mx-auto';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {/* Left side - Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Voice Live Chat</h1>
              <p className="text-teal-100 mt-1">
                Real-time voice conversation with AI
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                  isConnected ? 'bg-green-500/20 text-green-100' : 'bg-white/20 text-white/80'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-white/60'}`} />
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              {isRecording && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-500/20 text-red-100">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  Recording
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Audio visualization circle - fixed height at top, doesn't scroll */}
        {!config.avatar.enabled && (
          <div className="flex-shrink-0 flex flex-col items-center py-4 bg-white border-b border-gray-100" style={{ height: '200px' }}>
            <div
              ref={circleRef}
              className="rounded-full transition-all duration-150 ease-out flex items-center justify-center"
              style={{
                width: '120px',
                height: '120px',
                backgroundColor: '#e5e7eb',
              }}
            >
              {isPlaying ? (
                /* Speaker icon when AI is speaking */
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              ) : (
                /* Mic icon when recording/idle */
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              )}
            </div>
            {!isConnected && (
              <p className="text-sm text-gray-400 mt-2">Click Start to begin conversation</p>
            )}
          </div>
        )}

        {/* Avatar Video Display - fixed height at top when avatar is enabled */}
        {config.avatar.enabled && (
          <div className="flex-shrink-0 flex flex-col items-center py-4 bg-white border-b border-gray-100" style={{ height: '480px' }}>
            <div
              className="rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center"
              style={{ width: '400px', height: '400px' }}
            >
              {avatarStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p>{isConnected ? 'Connecting avatar...' : 'Avatar will appear here'}</p>
                </div>
              )}
            </div>
            {isAvatarConnected && (
              <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Avatar Connected
              </span>
            )}
          </div>
        )}

        {/* Session ID Header - show when connected */}
        {isConnected && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-mono text-gray-500">Session: {sessionId || 'Loading...'}</p>
          </div>
        )}

        {/* Chat Messages - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-sm">Speak naturally and the AI will respond</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${getMessageStyle(msg.type)}`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Text Input & Status */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendText();
                }
              }}
              placeholder="Type a message (or just speak)..."
              disabled={!isConnected}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendText}
              disabled={!isConnected || !textInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
            <button
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Clear chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500">{statusText || 'Ready'}</p>
        </div>
      </div>

      {/* Right side - Configuration Panel */}
      <div className="w-full md:w-80 flex-shrink-0 bg-gray-50 border-l border-gray-200 p-6 flex flex-col overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Configuration</h2>

        <div className="space-y-4 flex-1">
          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <select
              value={config.model}
              onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))}
              disabled={isConnected}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              {CHAT_MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Voice */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
            <select
              value={config.voice}
              onChange={(e) => setConfig((c) => ({ ...c, voice: e.target.value }))}
              disabled={isConnected}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              {CHAT_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Recognition Language - only show for text models (non-realtime) */}
          {!config.model.includes('realtime') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recognition Language</label>
              <select
                value={config.recognitionLanguage}
                onChange={(e) => setConfig((c) => ({ ...c, recognitionLanguage: e.target.value }))}
                disabled={isConnected}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                {RECOGNITION_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Function Calling */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={config.enableFunctionCalling}
                onChange={(e) => setConfig((c) => ({ ...c, enableFunctionCalling: e.target.checked }))}
                disabled={isConnected}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Function Calling</span>
            </label>

            {config.enableFunctionCalling && (
              <div className="space-y-2 pl-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.functions.enableDateTime}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        functions: { ...c.functions, enableDateTime: e.target.checked },
                      }))
                    }
                    disabled={isConnected}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700">getCurrentDateTime()</span>
                </label>
                <p className="text-xs text-gray-500 ml-6">Get current date, time, and timezone</p>

                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={config.functions.enableWeatherForecast}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        functions: { ...c.functions, enableWeatherForecast: e.target.checked },
                      }))
                    }
                    disabled={isConnected}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700">getWeatherForecast()</span>
                </label>
                <p className="text-xs text-gray-500 ml-6">Get 7-day weather forecast (10s delay)</p>
              </div>
            )}
          </div>

          {/* Avatar Settings */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={config.avatar.enabled}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    avatar: { ...c.avatar, enabled: e.target.checked },
                  }))
                }
                disabled={isConnected}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Avatar</span>
            </label>

            {config.avatar.enabled && (
              <div className="space-y-3 pl-1">
                {/* Avatar Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Avatar Type</label>
                  <select
                    value={config.avatar.type}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        avatar: {
                          ...c.avatar,
                          type: e.target.value as AvatarType,
                          character: e.target.value === 'photo' ? PHOTO_AVATARS[0].id : VIDEO_AVATARS[0].character,
                          style: e.target.value === 'video' ? VIDEO_AVATARS[0].style : undefined,
                        },
                      }))
                    }
                    disabled={isConnected}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                      <option value="video">Video Avatar</option>
                      <option value="photo">Photo Avatar (VASA-1)</option>
                    </select>
                  </div>

                  {/* Avatar Character */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {config.avatar.type === 'photo' ? 'Photo Avatar' : 'Video Avatar'}
                    </label>
                    <select
                      value={
                        config.avatar.type === 'photo'
                          ? config.avatar.character
                          : `${config.avatar.character}-${config.avatar.style}`
                      }
                      onChange={(e) => {
                        if (config.avatar.type === 'photo') {
                          setConfig((c) => ({
                            ...c,
                            avatar: { ...c.avatar, character: e.target.value, style: undefined },
                          }));
                        } else {
                          const selected = VIDEO_AVATARS.find((a) => a.id === e.target.value);
                          if (selected) {
                            setConfig((c) => ({
                              ...c,
                              avatar: { ...c.avatar, character: selected.character, style: selected.style },
                            }));
                          }
                        }
                      }}
                      disabled={isConnected}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      {config.avatar.type === 'photo'
                        ? PHOTO_AVATARS.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))
                        : VIDEO_AVATARS.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>
              )}
          </div>

          {/* Connect/Disconnect Button */}
          <div className="pt-2">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={!endpoint || !apiKey}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start Conversation
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z" />
                </svg>
                Stop
              </button>
            )}
          </div>

          {/* Mic Toggle (when connected) */}
          {isConnected && (
            <div className="pt-2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-colors ${
                  isRecording
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                {isRecording ? 'Mute Microphone' : 'Unmute Microphone'}
              </button>
            </div>
          )}

          {/* Speaking Indicator */}
          {isConnected && isSpeaking && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm text-blue-700">Speaking detected...</span>
            </div>
          )}

          {/* Advanced Settings */}
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700"
            >
              <span>Advanced Settings</span>
              <svg
                className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">System Instructions</label>
                  <textarea
                    value={config.instructions}
                    onChange={(e) => setConfig((c) => ({ ...c, instructions: e.target.value }))}
                    disabled={isConnected}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="You are a helpful assistant..."
                  />
                </div>

                {/* Turn Detection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Turn Detection</label>
                  <select
                    value={config.turnDetectionType}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        turnDetectionType: e.target.value as 'server_vad' | 'azure_semantic_vad',
                      }))
                    }
                    disabled={isConnected}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="server_vad">Server VAD</option>
                    <option value="azure_semantic_vad">Azure Semantic VAD</option>
                  </select>
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature: {config.temperature.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => setConfig((c) => ({ ...c, temperature: parseFloat(e.target.value) }))}
                    disabled={isConnected}
                    className="w-full"
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.removeFillerWords}
                      onChange={(e) => setConfig((c) => ({ ...c, removeFillerWords: e.target.checked }))}
                      disabled={isConnected || config.turnDetectionType !== 'azure_semantic_vad'}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Remove filler words</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.useNoiseSuppression}
                      onChange={(e) => setConfig((c) => ({ ...c, useNoiseSuppression: e.target.checked }))}
                      disabled={isConnected}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Noise suppression</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.useEchoCancellation}
                      onChange={(e) => setConfig((c) => ({ ...c, useEchoCancellation: e.target.checked }))}
                      disabled={isConnected}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Echo cancellation</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
