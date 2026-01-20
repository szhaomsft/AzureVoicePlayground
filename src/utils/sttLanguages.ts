// Language codes and metadata for Speech-to-Text

export interface STTLanguage {
  code: string;
  name: string;
  nativeName: string;
  region?: string;
}

export const AUTO_DETECT: STTLanguage = {
  code: 'auto',
  name: 'Auto-detect',
  nativeName: 'Auto-detect language'
};

export const STT_LANGUAGES: STTLanguage[] = [
  { code: 'en-US', name: 'English', nativeName: 'English (United States)', region: 'US' },
  { code: 'en-GB', name: 'English', nativeName: 'English (United Kingdom)', region: 'GB' },
  { code: 'en-AU', name: 'English', nativeName: 'English (Australia)', region: 'AU' },
  { code: 'en-CA', name: 'English', nativeName: 'English (Canada)', region: 'CA' },
  { code: 'en-IN', name: 'English', nativeName: 'English (India)', region: 'IN' },

  { code: 'zh-CN', name: 'Chinese', nativeName: '中文 (简体)', region: 'CN' },
  { code: 'zh-TW', name: 'Chinese', nativeName: '中文 (繁體)', region: 'TW' },
  { code: 'zh-HK', name: 'Chinese', nativeName: '中文 (香港)', region: 'HK' },

  { code: 'es-ES', name: 'Spanish', nativeName: 'Español (España)', region: 'ES' },
  { code: 'es-MX', name: 'Spanish', nativeName: 'Español (México)', region: 'MX' },
  { code: 'es-AR', name: 'Spanish', nativeName: 'Español (Argentina)', region: 'AR' },

  { code: 'fr-FR', name: 'French', nativeName: 'Français (France)', region: 'FR' },
  { code: 'fr-CA', name: 'French', nativeName: 'Français (Canada)', region: 'CA' },

  { code: 'de-DE', name: 'German', nativeName: 'Deutsch (Deutschland)', region: 'DE' },
  { code: 'de-AT', name: 'German', nativeName: 'Deutsch (Österreich)', region: 'AT' },
  { code: 'de-CH', name: 'German', nativeName: 'Deutsch (Schweiz)', region: 'CH' },

  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語 (日本)', region: 'JP' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어 (대한민국)', region: 'KR' },

  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português (Brasil)', region: 'BR' },
  { code: 'pt-PT', name: 'Portuguese', nativeName: 'Português (Portugal)', region: 'PT' },

  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano (Italia)', region: 'IT' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский (Россия)', region: 'RU' },

  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية (السعودية)', region: 'SA' },
  { code: 'ar-EG', name: 'Arabic', nativeName: 'العربية (مصر)', region: 'EG' },

  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी (भारत)', region: 'IN' },
  { code: 'th-TH', name: 'Thai', nativeName: 'ไทย (ประเทศไทย)', region: 'TH' },
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe (Türkiye)', region: 'TR' },
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski (Polska)', region: 'PL' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands (Nederland)', region: 'NL' },
  { code: 'sv-SE', name: 'Swedish', nativeName: 'Svenska (Sverige)', region: 'SE' },
  { code: 'da-DK', name: 'Danish', nativeName: 'Dansk (Danmark)', region: 'DK' },
  { code: 'fi-FI', name: 'Finnish', nativeName: 'Suomi (Suomi)', region: 'FI' },
  { code: 'no-NO', name: 'Norwegian', nativeName: 'Norsk (Norge)', region: 'NO' },
  { code: 'cs-CZ', name: 'Czech', nativeName: 'Čeština (Česká republika)', region: 'CZ' },
  { code: 'hu-HU', name: 'Hungarian', nativeName: 'Magyar (Magyarország)', region: 'HU' },
  { code: 'ro-RO', name: 'Romanian', nativeName: 'Română (România)', region: 'RO' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt (Việt Nam)', region: 'VN' },
  { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia (Indonesia)', region: 'ID' },
  { code: 'ms-MY', name: 'Malay', nativeName: 'Bahasa Melayu (Malaysia)', region: 'MY' },
  { code: 'el-GR', name: 'Greek', nativeName: 'Ελληνικά (Ελλάδα)', region: 'GR' },
  { code: 'he-IL', name: 'Hebrew', nativeName: 'עברית (ישראל)', region: 'IL' },
  { code: 'uk-UA', name: 'Ukrainian', nativeName: 'Українська (Україна)', region: 'UA' },
];

/**
 * Get all supported languages including auto-detect
 */
export function getAllLanguages(): STTLanguage[] {
  return [AUTO_DETECT, ...STT_LANGUAGES];
}

/**
 * Find language by code
 */
export function getLanguageByCode(code: string): STTLanguage | undefined {
  if (code === 'auto') {
    return AUTO_DETECT;
  }
  return STT_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Search languages by name
 */
export function searchLanguages(query: string): STTLanguage[] {
  const lowerQuery = query.toLowerCase();
  return STT_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(lowerQuery) ||
    lang.nativeName.toLowerCase().includes(lowerQuery) ||
    lang.code.toLowerCase().includes(lowerQuery)
  );
}
