/**
 * Piggy-back on Specify 6 UI localization
 *
 * This is needed as some .xml files depend on it
 *
 * REFACTOR: reduce reliance on this
 */

import { mappedFind } from '../../utils/utils';
import { load } from './index';
import { getProperty } from '../../utils/javaProperties';
import { LocalizedString } from 'typesafe-i18n';
import { LANGUAGE } from '../../localization/utils/config';

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

export const legacyLocalize = (key: string): LocalizedString =>
  (mappedFind(Object.values(bundles), (content) => getProperty(content, key)) ??
    key) as LocalizedString;
