# Azure Voice Playground

A feature-rich web application showcasing Microsoft Azure's voice and speech AI capabilities. Built with React, TypeScript, and Tailwind CSS.

**Live Demo**: [https://szhaomsft.github.io/AzureVoicePlayground/](https://szhaomsft.github.io/AzureVoicePlayground/)

## Features

### Content Generation

| Feature | Description |
|---------|-------------|
| **Voice Creation** | Create custom AI voices from audio samples. Record consent and voice samples, train personal voice models |
| **Text to Speech** | Convert text to speech with 400+ premium Azure voices. Supports word highlighting, SSML, and voice filtering |
| **Podcast Generator** | Generate multi-speaker podcast-style audio. AI script generation from URLs (HTML/PDF) via Azure OpenAI |
| **Voice Changer** | Transform audio to different voices using 28+ conversion targets including Turbo models |

### Voice Agent

| Feature | Description |
|---------|-------------|
| **Voice Live Chat** | Real-time voice conversation with AI. Supports avatars (video/photo), client-side VAD, 14+ languages, and accurate response latency tracking |
| **Voice Live Translator** | Real-time voice translation with metrics dashboard (latency, tokens, cost) |

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Azure SDKs**:
  - `@azure/ai-voicelive` - Real-time voice chat/translation
  - `microsoft-cognitiveservices-speech-sdk` - TTS, multi-talker, voice conversion
- **AI Libraries**:
  - `@ricky0123/vad-web` - Client-side Voice Activity Detection for accurate latency measurement
- **Other**: PDF.js for document extraction, gh-pages for deployment

## Azure Services Used

- Azure Speech Services (TTS, Voice List, Multi-talker, Voice Conversion, Personal Voice)
- Azure Voice Live (Real-time chat, Translation, Avatars via WebRTC)
- Azure OpenAI (Optional - podcast script generation)
- Azure Blob Storage (Optional - voice changer audio storage)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Configuration

Configure in the sidebar settings panel:

**Content Generation:**
- Azure Speech API Key
- Region (40+ regions supported)

**Voice Agent:**
- Voice Live Endpoint
- Voice Live API Key

**Optional:**
- Azure OpenAI endpoint/key (for podcast AI generation)
- Azure Blob Storage connection (for voice changer)

## Performance Metrics

### Response Latency Tracking

Voice Live Chat playground features accurate response latency measurement with client-side VAD:

**Components of Total Latency:**
1. **VAD Delay** (~500ms): Time from user's last speech to VAD detecting speech end
2. **Service Latency**: Time from VAD detection to audio playback start
3. **Total User-Perceived Latency**: VAD delay + service latency

**VAD Configuration:**
- Model: v5 (ONNX Runtime with WASM backend)
- Silence threshold: 500ms (`redemptionMs`)
- Speech detection threshold: 0.8 (`positiveSpeechThreshold`)
- Pre-speech padding: 100ms
- Minimum speech duration: 250ms
- Initial audio buffer: 50ms for smooth playback

**Measurement Accuracy:**
- Uses Web Audio API's audio context timing for precise scheduling
- Tracks actual playback start time, not just when audio chunks arrive
- VAD pauses during assistant playback to prevent false detection
- Latency displayed in message format: `Xms (service) + Yms (VAD) = Zms (total)`

Enable in settings: ☑️ **Show response latency**

## URL Routing

Direct links to playgrounds via URL hash:
- `#text-to-speech`
- `#voice-creation`
- `#multi-talker`
- `#voice-changer`
- `#podcast-agent`
- `#voice-live-chat`
- `#voice-live-translator`

## Project Structure

```
src/
├── components/          # React components for each playground
│   ├── VoiceLiveChatPlayground.tsx      # Azure Voice Live with VAD
│   ├── VoiceLiveTranslatorPlayground.tsx
│   ├── PodcastAgentPlayground.tsx
│   ├── TextToSpeechPlayground.tsx
│   ├── MultiTalkerPlayground.tsx
│   ├── VoiceChangerPlayground.tsx
│   └── VoiceCreationPlayground.tsx
├── hooks/               # Custom hooks
│   ├── useAzureTTS.ts
│   ├── useSettings.ts
│   ├── useHistoryStorage.ts
│   └── ...
├── lib/                 # API clients and utilities
│   ├── voiceLive/
│   │   ├── chatClient.ts          # Voice Live WebRTC client
│   │   └── audio/pcmPlayer.ts     # PCM audio playback with timing
│   ├── podcast/podcastClient.ts
│   ├── personalVoice/
│   └── multiTalker/
├── types/               # TypeScript type definitions
│   ├── azure.ts
│   ├── podcast.ts
│   └── ...
└── App.tsx              # Main app with routing
```

## License

MIT
