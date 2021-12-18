/**
 * Localization utilities and localization string resolver
 *
 * @module
 */

import React from 'react';

import type { IR, RR, RA } from '../types';
import { camelToHuman } from '../wbplanviewhelper';

export const languages = ['en-us', 'ru-ru', 'ca'] as const;
export type Language = typeof languages[number];
export const DEFAULT_LANGUAGE = 'en-us';
export const LANGUAGE: Language =
  (typeof document !== 'undefined' &&
  languages.includes(document.documentElement.lang as Language)
    ? (document.documentElement.lang as Language)
    : undefined) ?? DEFAULT_LANGUAGE;

type Line = string | JSX.Element;
// Wrap this in a Partial<> to allow skipping languages in the dictionary
export type Value =
  | (RR<Language, Line>
  | RR<Language, (...args: RA<never>) => Line>);
type GetValueType<VALUE extends Value> = VALUE extends (
  ...args: RA<never>
) => Line
  ? ReturnType<VALUE>[Language]
  : VALUE[Language];
export type Dictionary = IR<Value>;

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

export function createDictionary<DICT extends Dictionary>(dictionary: DICT) {
  const resolver = <KEY extends string & keyof typeof dictionary>(
    key: KEY
  ): GetValueType<typeof dictionary[typeof key]> =>
    key in dictionary
      ? dictionary[key][LANGUAGE] ?? assertExhaustive(key)
      : assertExhaustive(key);
  resolver.dictionary = dictionary;
  return resolver;
}

export const createHeader = (header: string): string =>
  header === '' ? '' : `<h2>${header}</h2>`;

export const createJsxHeader = (header: string): string | JSX.Element =>
  header === '' ? '' : <h2>{header}</h2>;

export const whitespaceSensitive = (string: string): string =>
  string
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/<br>\s?/, '\n');
