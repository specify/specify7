import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { camelToHuman, capitalize } from '../../utils/utils';
import type { LocalizationEntry } from '../utils';
import type { Language } from '../utils/config';
import type { DictionaryUsages } from '../utils/scanUsages';
import { syncStrings } from '../utils/sync';
import type { SchemaStrings } from './parser';
import type { SchemaLocation } from './traversal';

/**
 * Convert the extracted and post-processed schema localization strings to a .po
 * file for Weblate.
 */
export const schemaToPoFile = async (
  structure: SchemaStrings,
  languages: RA<string>,
  sourceFilePath: string
): Promise<DictionaryUsages[string]> => {
  const dictionaryUsages = {
    categoryName: pathToName(sourceFilePath),
    strings: Object.fromEntries(
      Object.entries(structure).map(
        ([key, { strings, locations }]) =>
          [
            key,
            {
              strings: strings as LocalizationEntry,
              usages: locations.map((location) => ({
                filePath: locationToString(location),
                lineNumber: 0,
              })),
            },
          ] as const
      )
    ),
  };

  await syncStrings(
    [dictionaryUsages],
    languages as RA<Language>,
    {
      languageCode: f.id,
      usage: ({ filePath }) => filePath,
      reference: f.undefined,
    },
    './'
  );

  return dictionaryUsages;
};

/**
 * The name of the component for the main schema localization file. All other
 * files will use discipline name as their name
 */
const mainSchemaName = 'main';

/**
 * All schema localization components will start with this name to easier
 * differentiate them
 */
export const schemaLocalizationName = 'schema-localization-';
const pathToName = (sourceFilePath: string): string =>
  `${schemaLocalizationName}${camelToHuman(
    sourceFilePath.includes('/') ? sourceFilePath.split('/')[0] : mainSchemaName
  )}`;

/**
 * Convert a place where the string is used to a user-friendly string
 */
const locationToString = (location: SchemaLocation): string =>
  `${capitalize(location.tableName)} ${
    location.fieldName === undefined
      ? ''
      : `- ${capitalize(location.fieldName)}`
  } [${capitalize(location.type)}]`;
