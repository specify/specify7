import { load } from './initialcontext';
import { getProperty } from './props';
import type { RA } from './types';

const locale = 'en';
const bundles = {} as Record<typeof bundleNames[number], string>;

const bundleNames = [
  'resources',
  'views',
  'global_views',
  'expresssearch',
] as const;

export const fetchContext = Promise.all(
  bundleNames.map(async (bundle) =>
    load<string>(
      `/properties/${bundle}_${locale}.properties`,
      'text/plain'
    ).then((data) => {
      bundles[bundle] = data;
    })
  )
);

export function localize(key: string): string {
  for (const content of Object.values(bundles)) {
    const localized = getProperty(content, key);
    if (typeof localized === 'string') return localized;
  }
  return key;
}

export function localizeFrom(
  from: typeof bundleNames[number] | RA<typeof bundleNames[number]>,
  key: string,
  fallback?: string
): string {
  const list: RA<typeof bundleNames[number]> = Array.isArray(from)
    ? from
    : [from];
  for (const source of list) {
    const localized = getProperty(bundles[source], key);
    if (typeof localized === 'string') return localized;
  }
  return fallback ?? key;
}
