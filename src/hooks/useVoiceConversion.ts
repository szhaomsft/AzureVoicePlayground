import { useState, useCallback } from 'react';
import { ConversionState, BlobStorageConfig, VoiceConversionVoice } from '../types/voiceConversion';
import { uploadToBlob, validateBlobConfig } from '../utils/blobStorage';

interface UseVoiceConversionProps {
  apiKey: string;
  region: string;
}

interface UseVoiceConversionResult {
  state: ConversionState;
  error: string;
  resultAudioData: ArrayBuffer | null;
  convert: (file: File, targetVoice: VoiceConversionVoice, blobConfig: BlobStorageConfig) => Promise<void>;
  reset: () => void;
}

export function useVoiceConversion({ apiKey, region }: UseVoiceConversionProps): UseVoiceConversionResult {
  const [state, setState] = useState<ConversionState>('idle');
  const [error, setError] = useState<string>('');
  const [resultAudioData, setResultAudioData] = useState<ArrayBuffer | null>(null);

  const reset = useCallback(() => {
    setState('idle');
    setError('');
    setResultAudioData(null);
  }, []);

  const convert = useCallback(
    async (file: File, targetVoice: VoiceConversionVoice, blobConfig: BlobStorageConfig) => {
      // Validate inputs
      if (!apiKey) {
        setError('Azure API Key is required');
        setState('error');
        return;
      }

      if (!region) {
        setError('Azure Region is required');
        setState('error');
        return;
      }

      const blobError = validateBlobConfig(blobConfig);
      if (blobError) {
        setError(blobError);
        setState('error');
        return;
      }

      // Validate file size (< 100 MB)
      const maxSize = 100 * 1024 * 1024; // 100 MB
      if (file.size > maxSize) {
        setError('File size must be less than 100 MB');
        setState('error');
        return;
      }

      try {
        // Step 1: Upload audio to blob storage
        setState('uploading');
        setError('');
        console.log('Uploading audio to blob storage...');

        const audioUrl = await uploadToBlob(file, blobConfig);
        console.log('Audio uploaded, URL:', audioUrl.split('?')[0]);

        // Step 2: Build SSML for voice conversion
        setState('converting');
        console.log('Starting voice conversion...');

        // XML-escape the URL (especially important for SAS token with & characters)
        const escapedUrl = audioUrl
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

        const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US"><voice name="${targetVoice.name}"><mstts:voiceconversion url="${escapedUrl}"/></voice></speak>`;

        console.log('SSML:', ssml);

        // Step 3: Call Azure TTS API with SSML
        const ttsEndpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

        const response = await fetch(ttsEndpoint, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
            'User-Agent': 'AzureVoicePlayground',
          },
          body: ssml,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Voice conversion failed: ${response.status} ${response.statusText}. ${errorText}`);
        }

        // Step 4: Get the result audio
        const audioData = await response.arrayBuffer();
        console.log('Voice conversion completed, audio size:', audioData.byteLength);

        setResultAudioData(audioData);
        setState('idle');
      } catch (err) {
        console.error('Voice conversion error:', err);
        setError(err instanceof Error ? err.message : 'Voice conversion failed');
        setState('error');
      }
    },
    [apiKey, region]
  );

  return {
    state,
    error,
    resultAudioData,
    convert,
    reset,
  };
}
