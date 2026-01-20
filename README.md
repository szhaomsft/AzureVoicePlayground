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
| **Voice Live Chat** | Real-time voice conversation with AI. Supports avatars (video/photo), VAD, and 14+ languages |
| **Voice Live Translator** | Real-time voice translation with metrics dashboard (latency, tokens, cost) |

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Azure SDKs**:
  - `@azure/ai-voicelive` - Real-time voice chat/translation
  - `microsoft-cognitiveservices-speech-sdk` - TTS, multi-talker, voice conversion
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

## URL Routing

Direct links to playgrounds via URL hash:
- `#text-to-speech`
- `#voice-creation`
- `#multi-talker`
- `#voice-changer`
- `#voice-live-chat`
- `#voice-live-translator`

## Project Structure

```
src/
├── components/     # React components for each playground
├── hooks/          # Custom hooks (useAzureTTS, useSettings, etc.)
├── lib/            # API clients (personalVoice, voiceLive, multiTalker)
├── types/          # TypeScript type definitions
└── App.tsx         # Main app with routing
```

## License

MIT
