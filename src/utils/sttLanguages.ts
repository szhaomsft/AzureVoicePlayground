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

// Languages supported by Realtime API (145 locales)
export const REALTIME_LANGUAGES: STTLanguage[] = [
  { code: 'af-ZA', name: 'Afrikaans', nativeName: 'Afrikaans (South Africa)', region: 'ZA' },
  { code: 'am-ET', name: 'Amharic', nativeName: 'Amharic (Ethiopia)', region: 'ET' },
  { code: 'ar-AE', name: 'Arabic', nativeName: 'العربية (الإمارات)', region: 'AE' },
  { code: 'ar-BH', name: 'Arabic', nativeName: 'العربية (البحرين)', region: 'BH' },
  { code: 'ar-DZ', name: 'Arabic', nativeName: 'العربية (الجزائر)', region: 'DZ' },
  { code: 'ar-EG', name: 'Arabic', nativeName: 'العربية (مصر)', region: 'EG' },
  { code: 'ar-IL', name: 'Arabic', nativeName: 'العربية (إسرائيل)', region: 'IL' },
  { code: 'ar-IQ', name: 'Arabic', nativeName: 'العربية (العراق)', region: 'IQ' },
  { code: 'ar-JO', name: 'Arabic', nativeName: 'العربية (الأردن)', region: 'JO' },
  { code: 'ar-KW', name: 'Arabic', nativeName: 'العربية (الكويت)', region: 'KW' },
  { code: 'ar-LB', name: 'Arabic', nativeName: 'العربية (لبنان)', region: 'LB' },
  { code: 'ar-LY', name: 'Arabic', nativeName: 'العربية (ليبيا)', region: 'LY' },
  { code: 'ar-MA', name: 'Arabic', nativeName: 'العربية (المغرب)', region: 'MA' },
  { code: 'ar-OM', name: 'Arabic', nativeName: 'العربية (عمان)', region: 'OM' },
  { code: 'ar-PS', name: 'Arabic', nativeName: 'العربية (فلسطين)', region: 'PS' },
  { code: 'ar-QA', name: 'Arabic', nativeName: 'العربية (قطر)', region: 'QA' },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية (السعودية)', region: 'SA' },
  { code: 'ar-SY', name: 'Arabic', nativeName: 'العربية (سوريا)', region: 'SY' },
  { code: 'ar-TN', name: 'Arabic', nativeName: 'العربية (تونس)', region: 'TN' },
  { code: 'ar-YE', name: 'Arabic', nativeName: 'العربية (اليمن)', region: 'YE' },
  { code: 'as-IN', name: 'Assamese', nativeName: 'অসমীয়া (ভাৰত)', region: 'IN' },
  { code: 'az-AZ', name: 'Azerbaijani', nativeName: 'Azərbaycan (Azərbaycan)', region: 'AZ' },
  { code: 'bg-BG', name: 'Bulgarian', nativeName: 'Български (България)', region: 'BG' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা (ভারত)', region: 'IN' },
  { code: 'bs-BA', name: 'Bosnian', nativeName: 'Bosanski (Bosna i Hercegovina)', region: 'BA' },
  { code: 'ca-ES', name: 'Catalan', nativeName: 'Català (Espanya)', region: 'ES' },
  { code: 'cs-CZ', name: 'Czech', nativeName: 'Čeština (Česká republika)', region: 'CZ' },
  { code: 'cy-GB', name: 'Welsh', nativeName: 'Cymraeg (Y Deyrnas Unedig)', region: 'GB' },
  { code: 'da-DK', name: 'Danish', nativeName: 'Dansk (Danmark)', region: 'DK' },
  { code: 'de-AT', name: 'German', nativeName: 'Deutsch (Österreich)', region: 'AT' },
  { code: 'de-CH', name: 'German', nativeName: 'Deutsch (Schweiz)', region: 'CH' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch (Deutschland)', region: 'DE' },
  { code: 'el-GR', name: 'Greek', nativeName: 'Ελληνικά (Ελλάδα)', region: 'GR' },
  { code: 'en-AU', name: 'English', nativeName: 'English (Australia)', region: 'AU' },
  { code: 'en-CA', name: 'English', nativeName: 'English (Canada)', region: 'CA' },
  { code: 'en-GB', name: 'English', nativeName: 'English (United Kingdom)', region: 'GB' },
  { code: 'en-GH', name: 'English', nativeName: 'English (Ghana)', region: 'GH' },
  { code: 'en-HK', name: 'English', nativeName: 'English (Hong Kong SAR)', region: 'HK' },
  { code: 'en-IE', name: 'English', nativeName: 'English (Ireland)', region: 'IE' },
  { code: 'en-IN', name: 'English', nativeName: 'English (India)', region: 'IN' },
  { code: 'en-KE', name: 'English', nativeName: 'English (Kenya)', region: 'KE' },
  { code: 'en-NG', name: 'English', nativeName: 'English (Nigeria)', region: 'NG' },
  { code: 'en-NZ', name: 'English', nativeName: 'English (New Zealand)', region: 'NZ' },
  { code: 'en-PH', name: 'English', nativeName: 'English (Philippines)', region: 'PH' },
  { code: 'en-SG', name: 'English', nativeName: 'English (Singapore)', region: 'SG' },
  { code: 'en-TZ', name: 'English', nativeName: 'English (Tanzania)', region: 'TZ' },
  { code: 'en-US', name: 'English', nativeName: 'English (United States)', region: 'US' },
  { code: 'en-ZA', name: 'English', nativeName: 'English (South Africa)', region: 'ZA' },
  { code: 'es-AR', name: 'Spanish', nativeName: 'Español (Argentina)', region: 'AR' },
  { code: 'es-BO', name: 'Spanish', nativeName: 'Español (Bolivia)', region: 'BO' },
  { code: 'es-CL', name: 'Spanish', nativeName: 'Español (Chile)', region: 'CL' },
  { code: 'es-CO', name: 'Spanish', nativeName: 'Español (Colombia)', region: 'CO' },
  { code: 'es-CR', name: 'Spanish', nativeName: 'Español (Costa Rica)', region: 'CR' },
  { code: 'es-CU', name: 'Spanish', nativeName: 'Español (Cuba)', region: 'CU' },
  { code: 'es-DO', name: 'Spanish', nativeName: 'Español (República Dominicana)', region: 'DO' },
  { code: 'es-EC', name: 'Spanish', nativeName: 'Español (Ecuador)', region: 'EC' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español (España)', region: 'ES' },
  { code: 'es-GQ', name: 'Spanish', nativeName: 'Español (Guinea Ecuatorial)', region: 'GQ' },
  { code: 'es-GT', name: 'Spanish', nativeName: 'Español (Guatemala)', region: 'GT' },
  { code: 'es-HN', name: 'Spanish', nativeName: 'Español (Honduras)', region: 'HN' },
  { code: 'es-MX', name: 'Spanish', nativeName: 'Español (México)', region: 'MX' },
  { code: 'es-NI', name: 'Spanish', nativeName: 'Español (Nicaragua)', region: 'NI' },
  { code: 'es-PA', name: 'Spanish', nativeName: 'Español (Panamá)', region: 'PA' },
  { code: 'es-PE', name: 'Spanish', nativeName: 'Español (Perú)', region: 'PE' },
  { code: 'es-PR', name: 'Spanish', nativeName: 'Español (Puerto Rico)', region: 'PR' },
  { code: 'es-PY', name: 'Spanish', nativeName: 'Español (Paraguay)', region: 'PY' },
  { code: 'es-SV', name: 'Spanish', nativeName: 'Español (El Salvador)', region: 'SV' },
  { code: 'es-US', name: 'Spanish', nativeName: 'Español (Estados Unidos)', region: 'US' },
  { code: 'es-UY', name: 'Spanish', nativeName: 'Español (Uruguay)', region: 'UY' },
  { code: 'es-VE', name: 'Spanish', nativeName: 'Español (Venezuela)', region: 'VE' },
  { code: 'et-EE', name: 'Estonian', nativeName: 'Eesti (Eesti)', region: 'EE' },
  { code: 'eu-ES', name: 'Basque', nativeName: 'Euskara (Espainia)', region: 'ES' },
  { code: 'fa-IR', name: 'Persian', nativeName: 'فارسی (ایران)', region: 'IR' },
  { code: 'fi-FI', name: 'Finnish', nativeName: 'Suomi (Suomi)', region: 'FI' },
  { code: 'fil-PH', name: 'Filipino', nativeName: 'Filipino (Pilipinas)', region: 'PH' },
  { code: 'fr-BE', name: 'French', nativeName: 'Français (Belgique)', region: 'BE' },
  { code: 'fr-CA', name: 'French', nativeName: 'Français (Canada)', region: 'CA' },
  { code: 'fr-CH', name: 'French', nativeName: 'Français (Suisse)', region: 'CH' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français (France)', region: 'FR' },
  { code: 'ga-IE', name: 'Irish', nativeName: 'Gaeilge (Éire)', region: 'IE' },
  { code: 'gl-ES', name: 'Galician', nativeName: 'Galego (España)', region: 'ES' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી (ભારત)', region: 'IN' },
  { code: 'he-IL', name: 'Hebrew', nativeName: 'עברית (ישראל)', region: 'IL' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी (भारत)', region: 'IN' },
  { code: 'hr-HR', name: 'Croatian', nativeName: 'Hrvatski (Hrvatska)', region: 'HR' },
  { code: 'hu-HU', name: 'Hungarian', nativeName: 'Magyar (Magyarország)', region: 'HU' },
  { code: 'hy-AM', name: 'Armenian', nativeName: 'Հայերեն (Հայաստան)', region: 'AM' },
  { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia (Indonesia)', region: 'ID' },
  { code: 'is-IS', name: 'Icelandic', nativeName: 'Íslenska (Ísland)', region: 'IS' },
  { code: 'it-CH', name: 'Italian', nativeName: 'Italiano (Svizzera)', region: 'CH' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano (Italia)', region: 'IT' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語 (日本)', region: 'JP' },
  { code: 'jv-ID', name: 'Javanese', nativeName: 'Jawa (Indonesia)', region: 'ID' },
  { code: 'ka-GE', name: 'Georgian', nativeName: 'ქართული (საქართველო)', region: 'GE' },
  { code: 'kk-KZ', name: 'Kazakh', nativeName: 'Қазақ (Қазақстан)', region: 'KZ' },
  { code: 'km-KH', name: 'Khmer', nativeName: 'ខ្មែរ (កម្ពុជា)', region: 'KH' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ (ಭಾರತ)', region: 'IN' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어 (대한민국)', region: 'KR' },
  { code: 'lo-LA', name: 'Lao', nativeName: 'ລາວ (ລາວ)', region: 'LA' },
  { code: 'lt-LT', name: 'Lithuanian', nativeName: 'Lietuvių (Lietuva)', region: 'LT' },
  { code: 'lv-LV', name: 'Latvian', nativeName: 'Latviešu (Latvija)', region: 'LV' },
  { code: 'mk-MK', name: 'Macedonian', nativeName: 'Македонски (Северна Македонија)', region: 'MK' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം (ഇന്ത്യ)', region: 'IN' },
  { code: 'mn-MN', name: 'Mongolian', nativeName: 'Монгол (Монгол)', region: 'MN' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी (भारत)', region: 'IN' },
  { code: 'ms-MY', name: 'Malay', nativeName: 'Bahasa Melayu (Malaysia)', region: 'MY' },
  { code: 'mt-MT', name: 'Maltese', nativeName: 'Malti (Malta)', region: 'MT' },
  { code: 'my-MM', name: 'Burmese', nativeName: 'မြန်မာ (မြန်မာ)', region: 'MM' },
  { code: 'nb-NO', name: 'Norwegian Bokmål', nativeName: 'Norsk Bokmål (Norge)', region: 'NO' },
  { code: 'ne-NP', name: 'Nepali', nativeName: 'नेपाली (नेपाल)', region: 'NP' },
  { code: 'nl-BE', name: 'Dutch', nativeName: 'Nederlands (België)', region: 'BE' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands (Nederland)', region: 'NL' },
  { code: 'or-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ (ଭାରତ)', region: 'IN' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ (ਭਾਰਤ)', region: 'IN' },
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski (Polska)', region: 'PL' },
  { code: 'ps-AF', name: 'Pashto', nativeName: 'پښتو (افغانستان)', region: 'AF' },
  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português (Brasil)', region: 'BR' },
  { code: 'pt-PT', name: 'Portuguese', nativeName: 'Português (Portugal)', region: 'PT' },
  { code: 'ro-RO', name: 'Romanian', nativeName: 'Română (România)', region: 'RO' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский (Россия)', region: 'RU' },
  { code: 'si-LK', name: 'Sinhala', nativeName: 'සිංහල (ශ්‍රී ලංකාව)', region: 'LK' },
  { code: 'sk-SK', name: 'Slovak', nativeName: 'Slovenčina (Slovensko)', region: 'SK' },
  { code: 'sl-SI', name: 'Slovenian', nativeName: 'Slovenščina (Slovenija)', region: 'SI' },
  { code: 'so-SO', name: 'Somali', nativeName: 'Soomaali (Soomaaliya)', region: 'SO' },
  { code: 'sq-AL', name: 'Albanian', nativeName: 'Shqip (Shqipëri)', region: 'AL' },
  { code: 'sr-RS', name: 'Serbian', nativeName: 'Српски (Србија)', region: 'RS' },
  { code: 'sv-SE', name: 'Swedish', nativeName: 'Svenska (Sverige)', region: 'SE' },
  { code: 'sw-KE', name: 'Swahili', nativeName: 'Kiswahili (Kenya)', region: 'KE' },
  { code: 'sw-TZ', name: 'Swahili', nativeName: 'Kiswahili (Tanzania)', region: 'TZ' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ் (இந்தியா)', region: 'IN' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు (భారతదేశం)', region: 'IN' },
  { code: 'th-TH', name: 'Thai', nativeName: 'ไทย (ประเทศไทย)', region: 'TH' },
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe (Türkiye)', region: 'TR' },
  { code: 'uk-UA', name: 'Ukrainian', nativeName: 'Українська (Україна)', region: 'UA' },
  { code: 'ur-IN', name: 'Urdu', nativeName: 'اردو (بھارت)', region: 'IN' },
  { code: 'uz-UZ', name: 'Uzbek', nativeName: 'Oʻzbek (Oʻzbekiston)', region: 'UZ' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt (Việt Nam)', region: 'VN' },
  { code: 'wuu-CN', name: 'Chinese (Wu)', nativeName: '中文 (吴语)', region: 'CN' },
  { code: 'yue-CN', name: 'Chinese (Cantonese)', nativeName: '中文 (粤语)', region: 'CN' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)', nativeName: '中文 (简体)', region: 'CN' },
  { code: 'zh-CN-shandong', name: 'Chinese (Jilu Mandarin)', nativeName: '中文 (冀鲁官话)', region: 'CN' },
  { code: 'zh-CN-sichuan', name: 'Chinese (Southwestern Mandarin)', nativeName: '中文 (西南官话)', region: 'CN' },
  { code: 'zh-HK', name: 'Chinese (Cantonese)', nativeName: '中文 (香港)', region: 'HK' },
  { code: 'zh-TW', name: 'Chinese (Taiwanese Mandarin)', nativeName: '中文 (繁體)', region: 'TW' },
  { code: 'zu-ZA', name: 'Zulu', nativeName: 'isiZulu (South Africa)', region: 'ZA' },
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
