import React from 'react';

import type { IR, RA } from '../types';
import { camelToHuman } from '../wbplanviewhelper';

type Value = string | JSX.Element;
type Dictionary = IR<Value | ((...args: RA<never>) => Value)>;

function assertExhaustive(key: string): never {
  /*
   * If a .ts or .tsx file tries to access a non-existing key, a
   * build-time error would be thrown.
   * For .js and .jsx files, some errors may be shown in the editor depending on
   * the IDE. The rest would be thrown at runtime.
   * For templates (.html), no errors would be shown, and thus this exception
   * may be thrown at runtime.
   * To prevent runtime errors, a ../tests/testlocalization.ts script has been
   * added. It checks both for invalid key usages, invalid usages and unused
   * keys
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

export const createDictionary =
  <DICT extends Dictionary>(dictionary: DICT) =>
  <KEY extends string & keyof typeof dictionary>(
    key: KEY
  ): typeof dictionary[typeof key] =>
    key in dictionary ? dictionary[key] : assertExhaustive(key);

export const createHeader = (header: string): string =>
  header === '' ? '' : `<h2>${header}</h2>`;

export const createJsxHeader = (header: string): string | JSX.Element =>
  header === '' ? '' : <h2>{header}</h2>;
