/**
 * Parsers for Java *.properties files
 */

import { escapeRegExp } from './utils';

function reForKey(key: string): RegExp {
  return new RegExp(`^${escapeRegExp(key)}\\s*[\\s=:]\\s*(.*)$`, 'm');
}

function unescape(value: string): string {
  return JSON.parse(`"${value.replaceAll(/"/g, '\\"')}"`);
}

export function getProperty(
  properties: string,
  key: string
): string | undefined {
  const match = reForKey(key).exec(properties);
  if (match) {
    console.debug('found value:', match[1], 'for key:', key);
    return match[1] && unescape(match[1]);
  } else {
    console.debug('properties set does not include', key);
    return undefined;
  }
}
