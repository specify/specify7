/**
 * Collection of various helper methods used during the mapping process
 *
 * @module
 */

import type { IR, RA } from './types';
import type { SplitMappingPath } from './wbplanviewmappinghelper';

export const capitalize = (string: string): string =>
  string.charAt(0).toUpperCase() + string.slice(1);

/**
 * Finds the point at which the source array begins to have values
 * different from the ones in the search array
 *
 * @example
 * Returns 0 if search array is empty
 * Returns -1 if source array is empty / is shorter than the search array
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
 *     search is ['Accession','Accession Agents','#2']
 *   returns -1
 *
 */
export function findArrayDivergencePoint<T>(
  // The source array to use in the comparison
  source: RA<T>,
  // The search array to use in the comparison
  search: RA<T>
): number {
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
  splitMappingPaths: RA<SplitMappingPath>,
  emptyStringReplacement = ''
): IR<string> =>
  Object.fromEntries(
    splitMappingPaths
      .map(
        ({ headerName, columnOptions }) =>
          [
            headerName,
            columnOptions.default === ''
              ? emptyStringReplacement
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
  capitalize(value.replace(/([a-z])([A-Z])/g, '$1 $2')).replace(/Dna\b/, 'DNA');

/**
 * Scale a number from original range into new range
 */
export const spanNumber =
  (
    minInput: number,
    maxInput: number,
    minOutput: number,
    maxOutput: number
  ): ((input: number) => number) =>
  (input: number): number =>
    ((input - minInput) / (maxInput - minInput)) * (maxOutput - minOutput) +
    minOutput;
