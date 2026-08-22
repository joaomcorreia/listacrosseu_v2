export type SpokenLanguage = { code: string; name: string; localName?: string; flagCountryCode?: string };

// Stable BCP-47-style language identifiers. These are business spoken languages,
// not the languages used by the ListAcrossEU interface.
export const SPOKEN_LANGUAGES: SpokenLanguage[] = [
  ['af','Afrikaans'], ['am','Amharic'], ['ar','Arabic'], ['hy','Armenian'], ['az','Azerbaijani'],
  ['eu','Basque'], ['be','Belarusian'], ['bn','Bengali'], ['bs','Bosnian'], ['bg','Bulgarian'],
  ['ca','Catalan'], ['zh','Chinese'], ['hr','Croatian'], ['cs','Czech'], ['da','Danish'],
  ['nl','Dutch'], ['en','English'], ['et','Estonian'], ['fi','Finnish'], ['fr','French'],
  ['gl','Galician'], ['ka','Georgian'], ['de','German'], ['el','Greek'], ['gu','Gujarati'],
  ['he','Hebrew'], ['hi','Hindi'], ['hu','Hungarian'], ['is','Icelandic'], ['id','Indonesian'],
  ['ga','Irish'], ['it','Italian'], ['ja','Japanese'], ['kk','Kazakh'], ['ko','Korean'],
  ['lv','Latvian'], ['lt','Lithuanian'], ['lb','Luxembourgish'], ['mk','Macedonian'], ['ms','Malay'],
  ['mt','Maltese'], ['mn','Mongolian'], ['no','Norwegian'], ['fa','Persian'], ['pl','Polish'],
  ['pt','Portuguese'], ['pa','Punjabi'], ['ro','Romanian'], ['ru','Russian'], ['sr','Serbian'],
  ['sk','Slovak'], ['sl','Slovenian'], ['so','Somali'], ['es','Spanish'], ['sw','Swahili'],
  ['sv','Swedish'], ['tl','Tagalog'], ['ta','Tamil'], ['te','Telugu'], ['th','Thai'],
  ['tr','Turkish'], ['uk','Ukrainian'], ['ur','Urdu'], ['uz','Uzbek'], ['vi','Vietnamese'],
  ['cy','Welsh'], ['yi','Yiddish'],
].map(([code, name]) => ({ code, name }));

const FLAG_COUNTRY_CODES: Record<string, string> = {
  en: 'GB', nl: 'NL', pt: 'PT', fr: 'FR', de: 'DE', es: 'ES', it: 'IT',
  zh: 'CN', el: 'GR', ja: 'JP', ko: 'KR', tr: 'TR', pl: 'PL', ru: 'RU',
};

for (const language of SPOKEN_LANGUAGES) language.flagCountryCode = FLAG_COUNTRY_CODES[language.code];

const byCode = new Map(SPOKEN_LANGUAGES.map((language) => [language.code, language]));
const byName = new Map(SPOKEN_LANGUAGES.map((language) => [language.name.toLocaleLowerCase(), language.code]));

export function normalizeSpokenLanguages(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.map((value) => String(value).trim()).filter(Boolean).map((value) => byCode.has(value) ? value : byName.get(value.toLocaleLowerCase()) || value)));
}

export function spokenLanguageName(value: string): string {
  return byCode.get(value)?.name || value;
}

export function spokenLanguageDetails(value: string): SpokenLanguage | undefined {
  return byCode.get(value);
}
