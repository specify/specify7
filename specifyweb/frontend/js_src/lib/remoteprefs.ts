import { load } from './initialcontext';
import type { IR, R } from './types';

const prefs: R<string> = {};

export const fetchContext = load<string>(
  '/context/remoteprefs.properties',
  'text/plain'
).then((text) =>
  text
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .forEach((line) => {
      const match = /([^=]+)=(.+)/.exec(line);
      if (match) prefs[match[1]] = match[2];
    })
);

export function getPref(key: string, defaultValue: string): string {
  return prefs[key] ?? defaultValue;
}

export function getBoolPref(key: string, defaultValue: boolean): boolean {
  const value = prefs[key] as string | undefined;
  if (typeof value === 'string')
    if (value.toLowerCase() === 'true') return true;
    else if (value.toLowerCase() === 'false') return false;
  return defaultValue;
}

export function getIntPref(key: string): number | undefined {
  const value = prefs[key] as string | undefined;
  const parsed = Number.parseInt(value ?? '');
  return Number.isNaN(parsed) ? undefined : parsed;
}

export default prefs as IR<string>;
