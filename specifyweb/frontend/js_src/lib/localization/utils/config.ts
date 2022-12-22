import { f } from '../../utils/functools';

/**
 * A mapping between Django language code and Weblate language code
 * (weblate uses unconventional codes)
 *
 * To add new language, define it in this list.
 */
export const languageCodeMapper = {
  'en-us': 'en_US',
  'ru-ru': 'rus_RU',
} as const;

export const languages = Object.keys(languageCodeMapper);

/** This allows to hide unfinished localizations in production */
export const enabledLanguages =
  process.env.NODE_ENV === 'development' ? languages : ['en-us', 'ru-ru'];

export type Language = typeof languages[number];

export const DEFAULT_LANGUAGE = 'en-us';

export const LANGUAGE: Language =
  (typeof document === 'object' &&
  f.includes(languages, document.documentElement.lang)
    ? document.documentElement.lang
    : undefined) ?? DEFAULT_LANGUAGE;

/**
 * Which branch the strings are coming from.
 * If modifying this, also update the trigger in the GitHub Action on
 * this branch and on the weblate-localization branch
 */
export const syncBranch = 'production';

export const weblateBranch = 'weblate-localization';
