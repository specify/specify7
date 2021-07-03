/*
 *
 * Collection of various helper methods used during the mapping process
 *
 *
 */

import type { IR, RA } from './components/wbplanview';
import type { SplitMappingPath } from './wbplanviewmappinghelper';

/*
 * Generate field label from the database field name.
 * (Converts Camel Case to human-readable name and fixes some errors).
 * This method is only called if schema
 * localization does not have a label for a particular field
 *
 */
export const getFriendlyName = (
  // Original field name
  originalName: string
): string => {
  let name = originalName.replace(/[A-Z]/g, (letter) => ` ${letter}`);
  name = name.trim();
  name = capitalize(name);

  const regex = /(?<first>[A-Z]) (?<second>[ A-Z])/g;
  const substitution = `$1$2`;
  name = name.replace(regex, substitution);
  name = name.replace(regex, substitution);

  name = name.replace('Dna', 'DNA');

  return name;
};

export const capitalize = (string: string): string =>
  string.charAt(0).toUpperCase() + string.slice(1);

/*
 * Finds the point at which the source array begins to have values
 * different from the ones in the search array
 */
export function findArrayDivergencePoint<T>(
  // The source array to use in the comparison
  source: RA<T>,
  // The search array to use in the comparison
  search: RA<T>
): number /*
 * Returns 0 if search array is empty
 * Returns -1 if source array is empty / is smaller than the search array
 * Examples:
 *   If:
 *     source is ['Accession','Accession Agents','#1','Agent','First Name'] and
 *     search is []
 *   returns 0
 *   If:
 *     source is ['Accession','Accession Agents','#1','Agent','First Name'] and
 *     search is ['Accession','Accession Agents',]
 *   returns 2
 *   If
 *     source is ['Accession','Accession Agents','#1','Agent','First Name'] and
 *     search is ['Accession','Accession Agents','#1']
 *   returns 3
 * */ {
  if (source === null || search === null) return -1;

  const sourceLength = source.length;
  const searchLength = search.length;

  if (searchLength === 0) return 0;

  if (sourceLength === 0 || sourceLength < searchLength) return -1;

  let returnValue = undefined;

  Object.entries(source).some(([index, sourceValue]) => {
    const searchValue = search[Number(index)];

    if (typeof searchValue === 'undefined') {
      returnValue = Number(index);
      return true;
    }

    if (sourceValue !== searchValue) {
      returnValue = -1;
      return true;
    }

    return false;
  });

  return returnValue ?? searchLength - 1;
}

export const extractDefaultValues = (
  arrayOfSplitMappings: RA<SplitMappingPath>,
  visualizeEmptyString = false
): IR<string> =>
  Object.fromEntries(
    arrayOfSplitMappings
      .map(
        ({ headerName, columnOptions }) =>
          [
            headerName,
            columnOptions.default === '' && visualizeEmptyString
              ? '(empty string)'
              : columnOptions.default,
          ] as [string, string]
      )
      .filter(([, defaultValue]) => defaultValue !== null)
  );

export const upperToKebab = (value: string): string =>
  value.toLowerCase().split('_').join('-');

export const camelToKebab = (value: string): string =>
  value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

export const camelToHuman = (value: string): string =>
  value.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
