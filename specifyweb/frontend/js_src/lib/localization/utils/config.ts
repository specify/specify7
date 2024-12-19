import { readCookie } from '../../utils/ajax/cookies';
import { f } from '../../utils/functools';
import { setDevelopmentGlobal } from '../../utils/types';

/**
 * A mapping between Django language code and Weblate language code
 * (weblate uses unconventional codes)
 *
 * To add new language, read the documentation in ../README.md
 *
 */
export const languageCodeMapper = {
  /*
   * IMPORTANT
   * On any changes here, also update the "LANGUAGES" array in
   * /specifyweb/settings/__init__.py. Otherwise, Django won't let users select
   * newly added language
   */
  'en-us': 'en_US',
  'ru-ru': 'ru',
  'uk-ua': 'uk',
  'fr-fr': 'fr',
  'es-es': 'es',
  'de-ch': 'de_CH',
  'pt-br': 'pt_BR',
} as const;

export const languages = Object.keys(languageCodeMapper);

/**
 * If user choose any language not in this list, a warning would be shown
 * saying the localization is not yet complete.
 */
export const completeLanguages = new Set(['en-us', 'ru-ru']);

/**
 * These languages are available in development only. Used for testing
 */
export const devLanguages = {
  /**
   * Like 'en-us', but every value is prepended with an underscore. Useful for
   * detecting localized strings
   */
  underscore: 'Underscore',
  /**
   * Print the string key rather than localized string
   */
  raw: 'Raw',
  /**
   * Like 'en-us', but every value is printed twice. Useful for testing
   * UI overflow and ensuring against languages with long words
   */
  double: 'Double',
};

export type Language = (typeof languages)[number];

export const DEFAULT_LANGUAGE = 'en-us';

/*
 * Django does not allow invalid language codes, so can't read them from
 * <html lang="..."> tag. Instead, we read them from cookies directly
 */
const cookieLanguage = readCookie('language');
export const devLanguage = f.includes(Object.keys(devLanguages), cookieLanguage)
  ? cookieLanguage
  : undefined;

export const LANGUAGE: Language =
  (typeof document === 'object' &&
  f.includes(languages, document.documentElement.lang)
    ? document.documentElement.lang
    : undefined) ?? DEFAULT_LANGUAGE;

setDevelopmentGlobal('_devLanguage', devLanguage);
setDevelopmentGlobal('_language', LANGUAGE);

/**
 * Which branch the strings are coming from.
 * If modifying this, also update the trigger in the GitHub Action on
 * this branch and on the weblate-localization branch
 */
export const syncBranch = 'production';

export const weblateBranch = 'weblate-localization';
