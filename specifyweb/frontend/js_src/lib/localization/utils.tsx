/**
 * Localization utilities and localization string resolver
 *
 * @module
 */

import type { IR, RA, RR } from '../types';
import { camelToHuman } from '../helpers';
import { f } from '../functools';

export const languages = ['en-us', 'ru-ru', 'ca', 'es-es'] as const;

// Catalonian is not yet ready for production
export const enabledLanguages =
  process.env.NODE_ENV === 'production' ? ['en-us', 'ru-ru'] : languages;
export type Language = typeof languages[number];
export const DEFAULT_LANGUAGE = 'en-us';
export const LANGUAGE: Language =
  (typeof document === 'object' &&
  f.includes(languages, document.documentElement.lang)
    ? document.documentElement.lang
    : undefined) ?? DEFAULT_LANGUAGE;

type Line = string | JSX.Element;
export type Value =
  | RR<Language, Line>
  | RR<Language, (...args: RA<never>) => Line>;
type GetValueType<VALUE extends Value> = VALUE extends RR<
  Language,
  infer ValueType
>
  ? ValueType
  : never;
export type Dictionary = IR<Value>;

/**
 * Handle case when localization string is not found.
 * This should never happen if:
 *   all typescript errors are fixed
 *   and ./tests/testlocalization.ts did not find any errors
 */
function assertExhaustive(key: string): never {
  /*
   * If a .ts or .tsx file tries to access a non-existing key, a
   * build-time error would be thrown.
   * For .js and .jsx files, some errors may be shown in the editor depending on
   * the IDE. The rest would be thrown at runtime.
   * For templates (.html), no errors would be shown, and thus this exception
   * may be thrown at runtime.
   * To prevent runtime errors, a ../tests/testlocalization.ts script has been
   * added. It checks both for nonexistent key usages, invalid usages and unused
   * keys. It also warns about duplicate key values.
   */
  const errorMessage = `
    Trying to access the value for a non-existent localization key "${key}"`;
  if (process.env.NODE_ENV === 'production') {
    console.error(errorMessage);
    // Convert a camel case key to a human readable form
    const value: any = camelToHuman(key);

    /*
     * Since the language key normally resolves to either function or string,
     * we need to create a "Frankenstein" function that also behaves like a
     * string
     */
    const defaultValue: any = (): string => value;
    Object.getOwnPropertyNames(Object.getPrototypeOf(value)).forEach(
      (proto) => {
        defaultValue[proto] =
          typeof value[proto] === 'function'
            ? value[proto].bind(value)
            : value[proto];
      }
    );
    return defaultValue as never;
  } else throw new Error(errorMessage);
}

/**
 * Wrap localization strings in a resolver.
 * Localization string may accept some arguments.
 */
export function createDictionary<DICT extends Dictionary>(dictionary: DICT) {
  const resolver = <KEY extends string & keyof typeof dictionary>(
    key: KEY
  ): GetValueType<typeof dictionary[typeof key]> =>
    key in dictionary
      ? (dictionary[key][LANGUAGE] as GetValueType<
          typeof dictionary[typeof key]
        >) ?? assertExhaustive(key)
      : assertExhaustive(key);
  resolver.dictionary = dictionary;
  return resolver;
}

/**
 * Make whitespace insensitive string suitable to go into a
 * whitespace sensitive place (e.g [title] attribute)
 *
 * New lines are ignored. To provide an explicit new line, use <br>
 */
export const whitespaceSensitive = (string: string): string =>
  string
    .trim()
    .split('\n')
    .map(f.trim)
    .filter(Boolean)
    .join(' ')
    .replace(/<br>\s?/, '\n');
