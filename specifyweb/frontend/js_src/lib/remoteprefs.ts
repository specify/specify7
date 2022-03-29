import { f } from './functools';
import { load } from './initialcontext';
import type { IR, R } from './types';

const preferences: R<string> = {};

export const fetchContext = load<string>(
  '/context/remoteprefs.properties',
  'text/plain'
).then((text) =>
  text
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .forEach((line) => {
      const match = /([^=]+)=(.+)/.exec(line);
      if (match) preferences[match[1]] = match[2];
    })
);

export function getPref(key: string, defaultValue: string): string {
  return preferences[key] ?? defaultValue;
}

export function getBoolPref(key: string, defaultValue: boolean): boolean {
  const value = preferences[key] as string | undefined;
  if (typeof value === 'string')
    if (value.toLowerCase() === 'true') return true;
    else if (value.toLowerCase() === 'false') return false;
  return defaultValue;
}

export const getIntPref = (key: string): number | undefined =>
  f.parseInt(preferences[key] ?? '');

export const remotePrefs: IR<string> = preferences;
