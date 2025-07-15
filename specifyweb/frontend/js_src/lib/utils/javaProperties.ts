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

const regexForJavaProperty = (key: string): RegExp =>
  new RegExp(`^${escapeRegExp(key)}(?:\\s*[:=]|\\s)\\s*(.*)$`, 'mu');

const unescapeJavaProperty = (value: string): string =>
  JSON.parse(`"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`);

export const exportsForTests = {
  regexForJavaProperty,
  unescapeJavaProperty,
};
