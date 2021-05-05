/*
 *
 * Collection of various helper methods used during the mapping process
 *
 *
 */

'use strict';

import type { IR, RA } from './components/wbplanview';
import type {
  FullMappingPath,
  MappingLine,
  MappingPath,
  MappingType,
} from './components/wbplanviewmapper';
import type { ColumnOptions } from './uploadplantomappingstree';
import {
  mappingPathToString,
  valueIsReferenceItem,
  valueIsTreeRank,
} from './wbplanviewmodelhelper';
import { getMappingLineData } from './wbplanviewnavigator';

/*
 * Get a friendly name from the field. (Converts Camel Case to human-readable
 * name and fixes some errors). This method is only called if schema
 * localization does not have a friendly name for this field
 *
 */
export const getFriendlyName = (
  // Original field name
  originalName: string
): string => {
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
 *Finds the point at which the source array begins to have values
 *different from the ones in the search array
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

/*
 * Takes an array of mappings with headers and returns the indexes of the
 * duplicate headers (if three lines have the same mapping, the indexes of
 * the second and the third lines are returned)
 *
 */
export const findDuplicateMappings = (
  // Array of mappings as returned by mappings.getArrayOfMappings()
  arrayOfMappings: RA<MappingPath>,
  focusedLine: number | false
): RA<number> => /*
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

  arrayOfMappings.reduce<string[]>(
    (dictionaryOfMappings, mappingPath, index) => {
      const stringMappingPath = mappingPathToString(mappingPath);

      if (dictionaryOfMappings.includes(stringMappingPath))
        duplicateIndexes.push(
          focusedLine && focusedLine === index
            ? dictionaryOfMappings.indexOf(stringMappingPath)
            : index
        );
      else dictionaryOfMappings.push(stringMappingPath);

      return dictionaryOfMappings;
    },
    []
  );

  return duplicateIndexes;
};

export type SplitMappingPath = {
  readonly mappingPath: MappingPath;
  readonly mappingType: MappingType;
  readonly headerName: string;
  readonly columnOptions: ColumnOptions;
};

export const splitFullMappingPathComponents = (
  fullMappingPath: FullMappingPath
): SplitMappingPath => ({
  mappingPath: fullMappingPath.slice(0, -3) as MappingPath,
  mappingType: fullMappingPath[fullMappingPath.length - 3] as MappingType,
  headerName: fullMappingPath[fullMappingPath.length - 2] as string,
  columnOptions: fullMappingPath[fullMappingPath.length - 1] as ColumnOptions,
});

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

export function generateMappingPathPreview(
  baseTableName: string,
  mappingPath: MappingPath
): [string, string] {
  const mappingLineData = getMappingLineData({
    baseTableName,
    mappingPath,
    customSelectType: 'OPENED_LIST',
    showHiddenFields: false,
  })
    .map((mappingElementData, index) => ({
      mappingElementData,
      mappingPathPart: mappingPath[index],
    }))
    .slice(-2)
    .map(
      ({ mappingElementData, mappingPathPart }) =>
        (Object.values(mappingElementData.fieldsData).find(
          ({ isDefault }) => isDefault
        )?.fieldFriendlyName as string) ?? mappingPathPart
    )
    .reverse();

  const databaseFieldName = mappingPath.slice(-1)[0];
  const [fieldName, possibleTableName] = mappingLineData;

  if (mappingLineData.length === 1) return [databaseFieldName, fieldName];

  if (valueIsTreeRank(possibleTableName))
    return [
      databaseFieldName,
      databaseFieldName === 'name'
        ? possibleTableName
        : `${possibleTableName} ${fieldName}`,
    ];
  else if (valueIsReferenceItem(mappingPath.slice(-2)[0]))
    return [databaseFieldName, `${fieldName} ${possibleTableName}`];
  else return [databaseFieldName, `${fieldName}`];
}

export function renameNewlyCreatedHeaders(
  baseTableName: string,
  headers: RA<string>,
  lines: RA<MappingLine>
): RA<MappingLine> {
  const generatedHeaderPreviews = Object.fromEntries(
    lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => !headers.includes(line.headerName))
      .map(({ line, index }) => [
        index,
        generateMappingPathPreview(baseTableName, line.mappingPath)[1],
      ])
  );

  const newHeaders = lines.map(
    ({ headerName }, index) => generatedHeaderPreviews[index] ?? headerName
  );

  const uniqueHeaders = uniquifyHeaders(
    newHeaders,
    Object.keys(generatedHeaderPreviews).map((index) => Number.parseInt(index))
  );

  return lines.map((line, index) => ({
    ...line,
    headerName: uniqueHeaders[index],
  }));
}

const formatUniqueifiedHeader = (
  headers: RA<string>,
  header: string,
  initialIndex: number
): string =>
  `${header} (${
    initialIndex +
    ([...Array.from({ length: 2 ** 10 })]
      .map((_, index) => index)
      .find(
        (index) => !headers.includes(`${header} (${initialIndex + index})`)
      ) ?? 2 ** 10 + Math.floor(Math.random() * 2 ** 11))
  })`;

export const uniquifyHeaders = (
  headers: RA<string>,
  headersToUniquify: RA<number> | false = false
): RA<string> =>
  headers
    .map((header) => (header ? header : '(no header)'))
    .map((header, index, headers) =>
      headers.indexOf(header) === index ||
      (Array.isArray(headersToUniquify) && !headersToUniquify.includes(index))
        ? header
        : formatUniqueifiedHeader(
            headers,
            header,
            headers
              .slice(0, index)
              .reduce(
                (numberOfOccurrences, headerOccurrence) =>
                  header === headerOccurrence
                    ? numberOfOccurrences + 1
                    : numberOfOccurrences,
                0
              ) + 1
          )
    );
