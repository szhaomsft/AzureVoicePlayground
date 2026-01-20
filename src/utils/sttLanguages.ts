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

// Languages supported by Fast Transcription API
export const FAST_TRANSCRIPTION_LANGUAGES: STTLanguage[] = [
  { code: 'en-US', name: 'English', nativeName: 'English (United States)', region: 'US' },
  { code: 'en-GB', name: 'English', nativeName: 'English (United Kingdom)', region: 'GB' },
  { code: 'en-AU', name: 'English', nativeName: 'English (Australia)', region: 'AU' },
  { code: 'en-CA', name: 'English', nativeName: 'English (Canada)', region: 'CA' },
  { code: 'en-IN', name: 'English', nativeName: 'English (India)', region: 'IN' },
  { code: 'en-IE', name: 'English', nativeName: 'English (Ireland)', region: 'IE' },
  { code: 'en-NZ', name: 'English', nativeName: 'English (New Zealand)', region: 'NZ' },
  { code: 'en-SG', name: 'English', nativeName: 'English (Singapore)', region: 'SG' },
  { code: 'en-ZA', name: 'English', nativeName: 'English (South Africa)', region: 'ZA' },
  { code: 'en-HK', name: 'English', nativeName: 'English (Hong Kong)', region: 'HK' },
  { code: 'en-PH', name: 'English', nativeName: 'English (Philippines)', region: 'PH' },

  { code: 'zh-CN', name: 'Chinese', nativeName: '中文 (简体)', region: 'CN' },
  { code: 'zh-HK', name: 'Chinese', nativeName: '中文 (香港)', region: 'HK' },

  { code: 'es-ES', name: 'Spanish', nativeName: 'Español (España)', region: 'ES' },
  { code: 'es-MX', name: 'Spanish', nativeName: 'Español (México)', region: 'MX' },
  { code: 'es-AR', name: 'Spanish', nativeName: 'Español (Argentina)', region: 'AR' },
  { code: 'es-CO', name: 'Spanish', nativeName: 'Español (Colombia)', region: 'CO' },
  { code: 'es-CL', name: 'Spanish', nativeName: 'Español (Chile)', region: 'CL' },

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
  { code: 'ar-AE', name: 'Arabic', nativeName: 'العربية (الإمارات)', region: 'AE' },

  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी (भारत)', region: 'IN' },
  { code: 'th-TH', name: 'Thai', nativeName: 'ไทย (ประเทศไทย)', region: 'TH' },
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe (Türkiye)', region: 'TR' },
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski (Polska)', region: 'PL' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands (Nederland)', region: 'NL' },
  { code: 'sv-SE', name: 'Swedish', nativeName: 'Svenska (Sverige)', region: 'SE' },
  { code: 'da-DK', name: 'Danish', nativeName: 'Dansk (Danmark)', region: 'DK' },
  { code: 'fi-FI', name: 'Finnish', nativeName: 'Suomi (Suomi)', region: 'FI' },
  { code: 'nb-NO', name: 'Norwegian', nativeName: 'Norsk Bokmål (Norge)', region: 'NO' },
  { code: 'cs-CZ', name: 'Czech', nativeName: 'Čeština (Česká republika)', region: 'CZ' },
  { code: 'hu-HU', name: 'Hungarian', nativeName: 'Magyar (Magyarország)', region: 'HU' },
  { code: 'ro-RO', name: 'Romanian', nativeName: 'Română (România)', region: 'RO' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt (Việt Nam)', region: 'VN' },
  { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia (Indonesia)', region: 'ID' },
  { code: 'ms-MY', name: 'Malay', nativeName: 'Bahasa Melayu (Malaysia)', region: 'MY' },
  { code: 'el-GR', name: 'Greek', nativeName: 'Ελληνικά (Ελλάδα)', region: 'GR' },
  { code: 'he-IL', name: 'Hebrew', nativeName: 'עברית (ישראל)', region: 'IL' },
  { code: 'uk-UA', name: 'Ukrainian', nativeName: 'Українська (Україна)', region: 'UA' },
  { code: 'bg-BG', name: 'Bulgarian', nativeName: 'Български (България)', region: 'BG' },
  { code: 'hr-HR', name: 'Croatian', nativeName: 'Hrvatski (Hrvatska)', region: 'HR' },
  { code: 'sk-SK', name: 'Slovak', nativeName: 'Slovenčina (Slovensko)', region: 'SK' },
  { code: 'sl-SI', name: 'Slovenian', nativeName: 'Slovenščina (Slovenija)', region: 'SI' },
  { code: 'et-EE', name: 'Estonian', nativeName: 'Eesti (Eesti)', region: 'EE' },
  { code: 'lv-LV', name: 'Latvian', nativeName: 'Latviešu (Latvija)', region: 'LV' },
  { code: 'lt-LT', name: 'Lithuanian', nativeName: 'Lietuvių (Lietuva)', region: 'LT' },
  { code: 'fa-IR', name: 'Persian', nativeName: 'فارسی (ایران)', region: 'IR' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা (ভারত)', region: 'IN' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ் (இந்தியா)', region: 'IN' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు (భారతదేశం)', region: 'IN' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी (भारत)', region: 'IN' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી (ભારત)', region: 'IN' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ (ಭಾರತ)', region: 'IN' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം (ഇന്ത്യ)', region: 'IN' },
  { code: 'af-ZA', name: 'Afrikaans', nativeName: 'Afrikaans (Suid-Afrika)', region: 'ZA' },
  { code: 'fil-PH', name: 'Filipino', nativeName: 'Filipino (Pilipinas)', region: 'PH' },
  { code: 'ca-ES', name: 'Catalan', nativeName: 'Català (Espanya)', region: 'ES' },
];

// Languages supported by Realtime API (broader support - 140+ locales)
export const REALTIME_LANGUAGES: STTLanguage[] = [
  { code: 'en-US', name: 'English', nativeName: 'English (United States)', region: 'US' },
  { code: 'en-GB', name: 'English', nativeName: 'English (United Kingdom)', region: 'GB' },
  { code: 'en-AU', name: 'English', nativeName: 'English (Australia)', region: 'AU' },
  { code: 'en-CA', name: 'English', nativeName: 'English (Canada)', region: 'CA' },
  { code: 'en-IN', name: 'English', nativeName: 'English (India)', region: 'IN' },
  { code: 'en-IE', name: 'English', nativeName: 'English (Ireland)', region: 'IE' },
  { code: 'en-NZ', name: 'English', nativeName: 'English (New Zealand)', region: 'NZ' },
  { code: 'en-SG', name: 'English', nativeName: 'English (Singapore)', region: 'SG' },
  { code: 'en-ZA', name: 'English', nativeName: 'English (South Africa)', region: 'ZA' },
  { code: 'en-HK', name: 'English', nativeName: 'English (Hong Kong)', region: 'HK' },
  { code: 'en-PH', name: 'English', nativeName: 'English (Philippines)', region: 'PH' },

  { code: 'zh-CN', name: 'Chinese', nativeName: '中文 (简体)', region: 'CN' },
  { code: 'zh-TW', name: 'Chinese', nativeName: '中文 (繁體)', region: 'TW' },
  { code: 'zh-HK', name: 'Chinese', nativeName: '中文 (香港)', region: 'HK' },
  { code: 'yue-CN', name: 'Chinese', nativeName: '中文 (粤语)', region: 'CN' },
  { code: 'wuu-CN', name: 'Chinese', nativeName: '中文 (吴语)', region: 'CN' },

  { code: 'es-ES', name: 'Spanish', nativeName: 'Español (España)', region: 'ES' },
  { code: 'es-MX', name: 'Spanish', nativeName: 'Español (México)', region: 'MX' },
  { code: 'es-AR', name: 'Spanish', nativeName: 'Español (Argentina)', region: 'AR' },
  { code: 'es-CO', name: 'Spanish', nativeName: 'Español (Colombia)', region: 'CO' },
  { code: 'es-CL', name: 'Spanish', nativeName: 'Español (Chile)', region: 'CL' },
  { code: 'es-US', name: 'Spanish', nativeName: 'Español (Estados Unidos)', region: 'US' },

  { code: 'fr-FR', name: 'French', nativeName: 'Français (France)', region: 'FR' },
  { code: 'fr-CA', name: 'French', nativeName: 'Français (Canada)', region: 'CA' },
  { code: 'fr-BE', name: 'French', nativeName: 'Français (Belgique)', region: 'BE' },
  { code: 'fr-CH', name: 'French', nativeName: 'Français (Suisse)', region: 'CH' },

  { code: 'de-DE', name: 'German', nativeName: 'Deutsch (Deutschland)', region: 'DE' },
  { code: 'de-AT', name: 'German', nativeName: 'Deutsch (Österreich)', region: 'AT' },
  { code: 'de-CH', name: 'German', nativeName: 'Deutsch (Schweiz)', region: 'CH' },

  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語 (日本)', region: 'JP' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어 (대한민국)', region: 'KR' },

  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português (Brasil)', region: 'BR' },
  { code: 'pt-PT', name: 'Portuguese', nativeName: 'Português (Portugal)', region: 'PT' },

  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano (Italia)', region: 'IT' },
  { code: 'it-CH', name: 'Italian', nativeName: 'Italiano (Svizzera)', region: 'CH' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский (Россия)', region: 'RU' },

  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية (السعودية)', region: 'SA' },
  { code: 'ar-EG', name: 'Arabic', nativeName: 'العربية (مصر)', region: 'EG' },
  { code: 'ar-AE', name: 'Arabic', nativeName: 'العربية (الإمارات)', region: 'AE' },
  { code: 'ar-DZ', name: 'Arabic', nativeName: 'العربية (الجزائر)', region: 'DZ' },
  { code: 'ar-MA', name: 'Arabic', nativeName: 'العربية (المغرب)', region: 'MA' },
  { code: 'ar-TN', name: 'Arabic', nativeName: 'العربية (تونس)', region: 'TN' },
  { code: 'ar-YE', name: 'Arabic', nativeName: 'العربية (اليمن)', region: 'YE' },

  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी (भारत)', region: 'IN' },
  { code: 'th-TH', name: 'Thai', nativeName: 'ไทย (ประเทศไทย)', region: 'TH' },
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe (Türkiye)', region: 'TR' },
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski (Polska)', region: 'PL' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands (Nederland)', region: 'NL' },
  { code: 'nl-BE', name: 'Dutch', nativeName: 'Nederlands (België)', region: 'BE' },
  { code: 'sv-SE', name: 'Swedish', nativeName: 'Svenska (Sverige)', region: 'SE' },
  { code: 'da-DK', name: 'Danish', nativeName: 'Dansk (Danmark)', region: 'DK' },
  { code: 'fi-FI', name: 'Finnish', nativeName: 'Suomi (Suomi)', region: 'FI' },
  { code: 'nb-NO', name: 'Norwegian', nativeName: 'Norsk Bokmål (Norge)', region: 'NO' },
  { code: 'cs-CZ', name: 'Czech', nativeName: 'Čeština (Česká republika)', region: 'CZ' },
  { code: 'hu-HU', name: 'Hungarian', nativeName: 'Magyar (Magyarország)', region: 'HU' },
  { code: 'ro-RO', name: 'Romanian', nativeName: 'Română (România)', region: 'RO' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt (Việt Nam)', region: 'VN' },
  { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia (Indonesia)', region: 'ID' },
  { code: 'ms-MY', name: 'Malay', nativeName: 'Bahasa Melayu (Malaysia)', region: 'MY' },
  { code: 'el-GR', name: 'Greek', nativeName: 'Ελληνικά (Ελλάδα)', region: 'GR' },
  { code: 'he-IL', name: 'Hebrew', nativeName: 'עברית (ישראל)', region: 'IL' },
  { code: 'uk-UA', name: 'Ukrainian', nativeName: 'Українська (Україна)', region: 'UA' },
  { code: 'bg-BG', name: 'Bulgarian', nativeName: 'Български (България)', region: 'BG' },
  { code: 'hr-HR', name: 'Croatian', nativeName: 'Hrvatski (Hrvatska)', region: 'HR' },
  { code: 'sk-SK', name: 'Slovak', nativeName: 'Slovenčina (Slovensko)', region: 'SK' },
  { code: 'sl-SI', name: 'Slovenian', nativeName: 'Slovenščina (Slovenija)', region: 'SI' },
  { code: 'et-EE', name: 'Estonian', nativeName: 'Eesti (Eesti)', region: 'EE' },
  { code: 'lv-LV', name: 'Latvian', nativeName: 'Latviešu (Latvija)', region: 'LV' },
  { code: 'lt-LT', name: 'Lithuanian', nativeName: 'Lietuvių (Lietuva)', region: 'LT' },
  { code: 'fa-IR', name: 'Persian', nativeName: 'فارسی (ایران)', region: 'IR' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা (ভারত)', region: 'IN' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ் (இந்தியா)', region: 'IN' },
  { code: 'ta-LK', name: 'Tamil', nativeName: 'தமிழ் (இலங்கை)', region: 'LK' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు (భారతదేశం)', region: 'IN' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी (भारत)', region: 'IN' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી (ભારત)', region: 'IN' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ (ಭಾರತ)', region: 'IN' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം (ഇന്ത്യ)', region: 'IN' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ (ਭਾਰਤ)', region: 'IN' },
  { code: 'as-IN', name: 'Assamese', nativeName: 'অসমীয়া (ভাৰত)', region: 'IN' },
  { code: 'or-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ (ଭାରତ)', region: 'IN' },
  { code: 'af-ZA', name: 'Afrikaans', nativeName: 'Afrikaans (Suid-Afrika)', region: 'ZA' },
  { code: 'zu-ZA', name: 'Zulu', nativeName: 'isiZulu (iNingizimu Afrika)', region: 'ZA' },
  { code: 'fil-PH', name: 'Filipino', nativeName: 'Filipino (Pilipinas)', region: 'PH' },
  { code: 'ca-ES', name: 'Catalan', nativeName: 'Català (Espanya)', region: 'ES' },
  { code: 'bs-BA', name: 'Bosnian', nativeName: 'Bosanski (Bosna i Hercegovina)', region: 'BA' },
  { code: 'sr-RS', name: 'Serbian', nativeName: 'Српски (Србија)', region: 'RS' },
  { code: 'km-KH', name: 'Khmer', nativeName: 'ខ្មែរ (កម្ពុជា)', region: 'KH' },
  { code: 'si-LK', name: 'Sinhala', nativeName: 'සිංහල (ශ්‍රී ලංකාව)', region: 'LK' },
  { code: 'ne-NP', name: 'Nepali', nativeName: 'नेपाली (नेपाल)', region: 'NP' },
  { code: 'sw-KE', name: 'Swahili', nativeName: 'Kiswahili (Kenya)', region: 'KE' },
  { code: 'sw-TZ', name: 'Swahili', nativeName: 'Kiswahili (Tanzania)', region: 'TZ' },
];

// Legacy - keep for backward compatibility
export const STT_LANGUAGES = REALTIME_LANGUAGES;

/**
 * Get all supported languages including auto-detect for a specific model
 */
export function getAllLanguages(model?: 'realtime' | 'fast-transcription'): STTLanguage[] {
  const languages = model === 'fast-transcription' ? FAST_TRANSCRIPTION_LANGUAGES : REALTIME_LANGUAGES;
  return [AUTO_DETECT, ...languages];
}

/**
 * Find language by code
 */
export function getLanguageByCode(code: string): STTLanguage | undefined {
  if (code === 'auto') {
    return AUTO_DETECT;
  }
  // Search in both lists
  return FAST_TRANSCRIPTION_LANGUAGES.find(lang => lang.code === code) ||
         REALTIME_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Search languages by name
 */
export function searchLanguages(query: string, model?: 'realtime' | 'fast-transcription'): STTLanguage[] {
  const languages = model === 'fast-transcription' ? FAST_TRANSCRIPTION_LANGUAGES : REALTIME_LANGUAGES;
  const lowerQuery = query.toLowerCase();
  return languages.filter(lang =>
    lang.name.toLowerCase().includes(lowerQuery) ||
    lang.nativeName.toLowerCase().includes(lowerQuery) ||
    lang.code.toLowerCase().includes(lowerQuery)
  );
}
