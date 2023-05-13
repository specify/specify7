import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { capitalize } from '../../utils/utils';
import type { LocalizationEntry } from '../utils';
import type { Language } from '../utils/config';
import type { DictionaryUsages } from '../utils/scanUsages';
import { syncStrings } from '../utils/sync';
import { schemaLocalizationFile } from './gatherLocalization';
import type { SchemaStrings } from './parser';
import type { SchemaLocation } from './traversal';

/**
 * Convert the extracted and post-processed schema localization strings to a .po
 * file for Weblate.
 */
export const schemaToPoFile = async (
  structure: SchemaStrings,
  languages: RA<string>,
  weblateDirectory: string | undefined,
  sourceFilePath: string
): Promise<DictionaryUsages[string]> => {
  const dictionaryUsages = {
    categoryName: schemaPathToComponentName(sourceFilePath),
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

  if (typeof weblateDirectory === 'string')
    await syncStrings(
      [dictionaryUsages],
      languages as RA<Language>,
      {
        languageCode: f.id,
        usage: ({ filePath }) => filePath,
        reference: f.undefined,
      },
      weblateDirectory
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
const pathPathJoin = '-';

function schemaPathToComponentName(sourceFilePath: string): string {
  if (sourceFilePath.includes(pathPathJoin))
    throw new Error(
      'Dash is not supported in path at the moment. ' +
        'Modify componentNameToSchemaPath if need to support them'
    );

  const parts = sourceFilePath.split('/').slice(0, -1);
  return `${schemaLocalizationName}${
    parts.length === 0 ? mainSchemaName : parts.join(pathPathJoin)
  }`;
}

export function componentNameToSchemaPath(componentName: string): string {
  if (!componentName.startsWith(schemaLocalizationName))
    throw new Error('Invalid schema localization component name');
  const trimmedName = componentName.slice(schemaLocalizationName.length);
  const parts =
    trimmedName === mainSchemaName ? [] : trimmedName.split(pathPathJoin);
  return [...parts, schemaLocalizationFile].join('/');
}

/**
 * Convert a place where the string is used to a user-friendly string
 */
const locationToString = (location: SchemaLocation): string =>
  `${capitalize(location.tableName)} ${
    location.fieldName === undefined
      ? ''
      : `- ${capitalize(location.fieldName)}`
  } [${capitalize(location.type)}]`;

export const exportsForTests = {
  schemaPathToComponentName,
  mainSchemaName,
  locationToString,
};
