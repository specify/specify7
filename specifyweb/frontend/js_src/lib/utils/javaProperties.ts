/**
 * Parsers for Java *.properties files
 */

import { f } from './functools';
import { escapeRegExp } from './utils';

export const getProperty = (
  properties: string,
  key: string
): string | undefined =>
  f.maybe(
    regexForJavaProperty(key).exec(properties)?.[1],
    unescapeJavaProperty
  );

export const regexForJavaProperty = (key: string): RegExp =>
  new RegExp(`^${escapeRegExp(key)}\\s*[\\s=:]\\s*(.*)$`, 'mu');

export const unescapeJavaProperty = (value: string): string =>
  JSON.parse(`"${value.replaceAll(/"/gu, '\\"')}"`);
