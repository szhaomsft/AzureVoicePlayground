import { VoiceInfo } from '../types/azure';

export async function fetchVoiceList(
  apiKey: string,
  region: string
): Promise<VoiceInfo[]> {
  try {
    console.log('Fetching voices with region:', region);

    // Use Azure REST API instead of SDK to avoid the locale.toLowerCase bug
    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;

    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched voices - total count:', data.length);
    console.log('First voice full structure:', JSON.stringify(data[0], null, 2));

    // Check for voices with different VoiceType values
    const voiceTypes = [...new Set(data.map((v: any) => v.VoiceType))];
    console.log('Available VoiceType values:', voiceTypes);

    // Sample voices from each type
    voiceTypes.forEach(type => {
      const sample = data.find((v: any) => v.VoiceType === type);
      if (sample) {
        console.log(`Sample ${type} voice:`, sample.ShortName, sample);
      }
    });

    const voices: VoiceInfo[] = data.map((voice: any) => {
      const isNeuralHD = voice.ShortName?.includes('HD') || voice.Name?.includes('HD');
      const keywords = voice.WordsPerMinute || voice.SecondaryLocaleList || [];

      // Gender can be 1 (Female), 2 (Male), or a string
      let gender: 'Female' | 'Male' = 'Female';
      if (typeof voice.Gender === 'number') {
        gender = voice.Gender === 1 ? 'Female' : 'Male';
      } else if (typeof voice.Gender === 'string') {
        gender = voice.Gender;
      }

      return {
        name: voice.ShortName || voice.Name || 'Unknown',
        locale: String(voice.Locale || 'en-US'),
        gender,
        description: `${voice.LocalName || voice.DisplayName || voice.Name || 'Unknown'} (${voice.Locale || 'Unknown'})`,
        styleList: voice.StyleList || [],
        isFeatured: isNeuralHD,
        voiceType: voice.VoiceType,
        isNeuralHD,
        keywords: Array.isArray(keywords) ? keywords : [],
        wordsPer: voice.WordsPerMinute,
        voiceTag: voice.VoiceTag || {},
      };
    });

    // Add hardcoded featured voices for East US region only (not in API yet)
    if (region.toLowerCase() === 'eastus' || region === 'East US') {
      console.log('Adding hardcoded MAI voices for East US region');

      voices.unshift(
        {
          name: 'en-us-phoebe:mai-voice-1',
          locale: 'en-US',
          gender: 'Female',
          description: 'Phoebe MAI Voice (en-US)',
          styleList: [],
          isFeatured: true,
          voiceType: 'Neural',
          isNeuralHD: true,
          keywords: ['MAI'],
          wordsPer: undefined,
        },
        {
          name: 'en-us-benjamin:mai-voice-1',
          locale: 'en-US',
          gender: 'Male',
          description: 'Benjamin MAI Voice (en-US)',
          styleList: [],
          isFeatured: true,
          voiceType: 'Neural',
          isNeuralHD: true,
          keywords: ['MAI'],
          wordsPer: undefined,
        }
      );
    }

    // Sort: Featured voices (hardcoded + Neural HD) first, then alphabetically
    voices.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.name.localeCompare(b.name);
    });

    console.log('Successfully processed voices:', voices.length);
    return voices;
  } catch (error) {
    console.error('Failed to fetch voices:', error);
    throw error;
  }
}

export function groupVoicesByLocale(voices: VoiceInfo[]): Map<string, VoiceInfo[]> {
  const grouped = new Map<string, VoiceInfo[]>();
  for (const voice of voices) {
    const existing = grouped.get(voice.locale) || [];
    existing.push(voice);
    grouped.set(voice.locale, existing);
  }
  return grouped;
}
