/*
 *
 * Collection of various helper methods used during the mapping process
 *
 * */

'use strict';

import { ColumnOptions } from './uploadplantomappingstree';
import { mappingPathToString } from './wbplanviewmodelhelper';
import {
  FullMappingPath,
  MappingPath,
  MappingType,
} from './components/wbplanviewmapper';

/*
 * Get a friendly name from the field. (Converts Camel Case to human-readable
 * name and fixes some errors). This method is only called if schema
 * localization does not have a friendly name for this field
 * */
export const getFriendlyName = (
  originalName: string // Original field name
): string /* Human friendly field name */ => {
  let name = originalName.replace(/[A-Z]/g, (letter) => ` ${letter}`);
  name = name.trim();
  name = name.charAt(0).toUpperCase() + name.slice(1);

  const regex = /(?<first>[A-Z]) (?<second>[ A-Z])/g;
  const subst = `$1$2`;
  name = name.replace(regex, subst);
  name = name.replace(regex, subst);

  name = name.replace('Dna', 'DNA');

  return name;
};

/*
  Finds the point at which the source array begins to have values
  different from the ones in the search array
*/
export function findArrayDivergencePoint<T>(
  source: T[], // the source array to use in the comparison
  search: T[] // the search array to use in the comparison
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
    const searchValue = search[~~index];

    if (typeof searchValue === 'undefined') {
      returnValue = ~~index;
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

/*
 * Takes an array of mappings with headers and returns the indexes of the
 * duplicate headers (if three lines have the same mapping, the indexes of
 * the second and the third lines are returned)
 * */
export const findDuplicateMappings = (
  // array of mappings as returned by mappings.getArrayOfMappings()
  arrayOfMappings: MappingPath[],
  focusedLine: number | false
): number[] => /*
 * Array of duplicate indexes
 * Example:
 *   if
 *     arrayOfMappings is [
 *       ['Accession','Accession Number','existing header,'Accession #;],
 *       ['Catalog Number','existing header','cat num'],
 *       ['Accession','Accession Number'],
 *     ]
 *     hasHeaders is True
 *   then return [2]
 *   if
 *     arrayOfMappings is [
 *       ['Start Date'],
 *       ['End Date'],
 *       ['Start Date'],
 *       ['Start Date'],
 *     ]
 *     hasHeaders is False
 *   then return [2,3]
 * */ {
  const duplicateIndexes: number[] = [];

  arrayOfMappings.reduce(
    (dictionaryOfMappings: string[], mappingPath, index) => {
      const stringMappingPath = mappingPathToString(mappingPath);

      if (dictionaryOfMappings.indexOf(stringMappingPath) === -1)
        dictionaryOfMappings.push(stringMappingPath);
      else
        duplicateIndexes.push(
          focusedLine && focusedLine === index
            ? dictionaryOfMappings.indexOf(stringMappingPath)
            : index
        );

      return dictionaryOfMappings;
    },
    []
  );

  return duplicateIndexes;
};

export const fullMappingPathParser = (
  fullMappingPath: FullMappingPath
): [string[], MappingType, string, ColumnOptions] =>
  [fullMappingPath.slice(0, -3), ...fullMappingPath.slice(-3)] as [
    MappingPath,
    MappingType,
    string,
    ColumnOptions
  ];
