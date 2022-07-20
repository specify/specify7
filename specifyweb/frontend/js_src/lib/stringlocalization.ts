/**
 * Piggy-back on Specify 6 UI localization
 *
 * This is needed as some .xml files depend on it
 *
 * REFACTOR: reduce reliance on this
 */

import { mappedFind } from './helpers';
import { load } from './initialcontext';
import { LANGUAGE } from './localization/utils';
import { getProperty } from './props';

const bundleLanguages = ['en', 'ru', 'uk', 'pt'];
const locale =
  bundleLanguages.find((language) => LANGUAGE.startsWith(language)) ?? 'en';
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

export const legacyLocalize = (key: string): string =>
  mappedFind(Object.values(bundles), (content) => getProperty(content, key)) ??
  key;
