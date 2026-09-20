# Speech to Text

## Overview

Speech to Text is a foundational capability in the Azure Voice Playground that converts spoken audio into written text using Microsoft's advanced neural speech recognition technology. Whether you're transcribing meetings, creating captions for videos, or building voice-controlled applications, Speech to Text provides accurate, real-time transcription across more than 100 languages and dialects.

The Azure Speech to Text service leverages deep neural networks trained on vast amounts of speech data to deliver human-level accuracy. With features like speaker diarization, custom vocabulary, and streaming recognition, it's designed to handle everything from casual conversations to specialized domain terminology in medical, legal, and technical fields.

## Key Features

- **Real-time Streaming Transcription**: Get live transcription results as speech is detected, with interim results that update as more context becomes available
- **100+ Languages and Dialects**: Comprehensive language support covering major world languages and regional variants
- **Speaker Diarization**: Automatically identify and label different speakers in a conversation, perfect for meetings and interviews
- **Custom Speech Models**: Train custom models with your domain-specific vocabulary, acronyms, and product names for higher accuracy
- **Phrase Lists**: Boost recognition of specific words and phrases without full model training
- **Multiple Input Sources**: Support for microphone input, audio file upload (WAV, MP3, M4A, and more), and streaming audio
- **Automatic Punctuation**: Intelligent punctuation and capitalization for readable transcripts
- **Profanity Filtering**: Configurable content filtering for family-friendly applications
- **Word-level Timestamps**: Precise timing information for each recognized word, essential for subtitling
- **Confidence Scores**: Per-word and per-phrase confidence metrics to identify uncertain transcriptions

## Use Cases

### Meeting Transcription and Note-Taking
Transform business meetings, team calls, and interviews into searchable text documents. Speaker diarization identifies who said what, making it easy to create meeting minutes, action items, and follow-up notes without manual transcription.

### Call Center Analytics and Compliance
Automatically transcribe customer service calls for quality assurance, compliance monitoring, and sentiment analysis. Extract key topics, detect customer issues, and identify training opportunities across thousands of conversations.

### Accessibility and Real-time Captions
Provide live captions for presentations, videos, and live events to make content accessible to deaf and hard-of-hearing audiences. Real-time transcription with low latency ensures captions stay synchronized with speech.

### Voice Commands and Dictation
Build voice-controlled applications and dictation systems that accurately capture spoken instructions. From smart home control to hands-free document creation, speech recognition enables natural voice interfaces.

### Media Subtitling and Closed Captions
Generate subtitles and closed captions for video content at scale. Word-level timestamps ensure precise synchronization, while multi-language support enables global content distribution.

### Medical and Legal Transcription
Create accurate transcripts of medical dictation, legal proceedings, and specialized consultations. Custom speech models can be trained on domain-specific terminology for higher accuracy in professional settings.

## How It Works

Using Speech to Text in Azure Voice Playground is straightforward and intuitive:

1. **Configure Your Connection**: Enter your Azure Speech API key and select your region in the settings panel to connect to your Azure subscription.

2. **Select Your Input Source**: Choose between microphone input for live transcription or upload an audio file for batch processing. Supported formats include WAV, MP3, M4A, FLAC, and OGG.

3. **Choose Your Language**: Select the primary language of your audio content. The service supports automatic language detection if you're unsure.

4. **Start Transcription**: Click the Record button for microphone input or Upload for files. For real-time transcription, you'll see words appear on screen as they're recognized.

5. **View Results**: The transcription appears in real-time with interim results that refine as more context becomes available. Final results include punctuation and proper formatting.

6. **Export and Use**: Copy the transcribed text, download as a document, or use the timestamps for subtitle generation.

## Azure Services Used

The Speech to Text playground integrates with several Azure AI capabilities:

- **Azure Cognitive Services Speech SDK**: The primary SDK for real-time speech recognition with streaming support
- **Speech-to-Text REST API**: HTTP-based API for batch transcription of audio files
- **Custom Speech Service**: Create and deploy custom speech recognition models
- **Speaker Recognition**: Identify individual speakers in multi-party conversations

The playground demonstrates best practices for implementing speech recognition including proper audio configuration, error handling, and result processing.

## Getting Started

1. **Create an Azure Account**: Sign up for a free Azure account at azure.microsoft.com if you don't have one
2. **Create a Speech Resource**: In the Azure portal, create a new Speech service resource and copy your API key and region
3. **Open Azure Voice Playground**: Navigate to the Speech to Text section from the left navigation
4. **Enter Your Credentials**: Input your Speech API key and region in the settings panel
5. **Test It Out**: Click the microphone button and start speaking to see real-time transcription

For best results, use a quality microphone in a quiet environment. The service automatically adapts to different audio conditions, but clear audio input produces more accurate results.

## Learn More

- [Azure Speech to Text Documentation](https://learn.microsoft.com/azure/ai-services/speech-service/speech-to-text)
- [Speech to Text Quickstart](https://learn.microsoft.com/azure/ai-services/speech-service/get-started-speech-to-text)
- [Language Support](https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=stt)
- [Custom Speech Overview](https://learn.microsoft.com/azure/ai-services/speech-service/custom-speech-overview)
- [Speech SDK Reference](https://learn.microsoft.com/azure/ai-services/speech-service/speech-sdk)
- [Azure Speech Pricing](https://azure.microsoft.com/pricing/details/cognitive-services/speech-services/)
