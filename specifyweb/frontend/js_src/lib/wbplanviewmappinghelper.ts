/*
 * Returns whether relationship is a -to-many
 *	(e.x. one-to-many or many-to-many)
 *
 */

import type { RA } from './components/wbplanview';
import type {
  FullMappingPath,
  MappingLine,
  MappingPath,
  MappingType,
  RelationshipType,
} from './components/wbplanviewmapper';
import type { ColumnOptions } from './uploadplantomappingstree';
import dataModelStorage from './wbplanviewmodel';
import { getMappingLineData } from './wbplanviewnavigator';
import { uniquifyHeaders } from './wbplanviewutils';

export const relationshipIsToMany = (
  relationshipType?: RelationshipType | ''
): boolean => (relationshipType ?? '').includes('-to-many');

/* Returns whether a value is a -to-many reference item (e.x #1, #2, etc...) */
export const valueIsReferenceItem = (value?: string): boolean =>
  value?.slice(0, dataModelStorage.referenceSymbol.length) ===
    dataModelStorage.referenceSymbol || false;

/* Returns whether a value is a tree rank name (e.x $Kingdom, $Order) */
export const valueIsTreeRank = (value: string): boolean =>
  value?.startsWith(dataModelStorage.treeSymbol) || false;

/*
 * Returns index from a complete reference item value (e.x #1 => 1)
 * Opposite of formatReferenceItem
 *
 */
export const getIndexFromReferenceItemName = (value: string): number =>
  Number(value.slice(dataModelStorage.referenceSymbol.length));

/*
 * Returns tree rank name from a complete tree rank name
 * (e.x $Kingdom => Kingdom)
 * Opposite of formatTreeRank
 *
 */
export const getNameFromTreeRankName = (value: string): string =>
  value.slice(dataModelStorage.treeSymbol.length);

/*
 * Returns a complete reference item from an index (e.x 1 => #1)
 * Opposite of getIndexFromReferenceItemName
 *
 */
export const formatReferenceItem = (index: number): string =>
  `${dataModelStorage.referenceSymbol}${index}`;

/*
 * Returns a complete tree rank name from a tree rank name
 * (e.x Kingdom => $Kingdom)
 * Opposite of getNameFromTreeRankName
 *
 */
export const formatTreeRank = (rankName: string): string =>
  `${dataModelStorage.treeSymbol}${rankName}`;

export const mappingPathToString = (mappingPath: MappingPath): string =>
  mappingPath.join(dataModelStorage.pathJoinSymbol);

export const splitJoinedMappingPath = (string: string): MappingPath =>
  string.split(dataModelStorage.pathJoinSymbol);

export function generateMappingPathPreview(
  baseTableName: string,
  mappingPath: MappingPath
): [string, string] {
  const mappingLineData = getMappingLineData({
    baseTableName,
    mappingPath,
    iterate: true,
  })
    .map((mappingElementData, index) => ({
      mappingElementData,
      mappingPathPart: mappingPath[index],
    }))
    .slice(-2);

  const fieldLabels = mappingLineData.map(
    ({ mappingElementData, mappingPathPart }) =>
      (Object.values(mappingElementData.fieldsData).find(
        ({ isDefault }) => isDefault
      )?.fieldFriendlyName as string) ?? mappingPathPart
  );

  const toManyLocation = Array.from(mappingPath)
    .reverse()
    .findIndex((mappingPathPart) => valueIsReferenceItem(mappingPathPart));
  let toManyIndexString = '';
  if (toManyLocation > 1) {
    const toManyIndex = mappingPath[mappingPath.length - 1 - toManyLocation];
    const toManyIndexNumber = getIndexFromReferenceItemName(toManyIndex);
    if (toManyIndexNumber > 1) toManyIndexString = ` ${toManyIndex}`;
  }
  const [possibleDataBaseTableName, databaseFieldName] = mappingPath.slice(-2);
  const [possibleTableName, fieldName] = fieldLabels.slice(-2);

  if (mappingLineData.length === 1)
    return [possibleDataBaseTableName, possibleTableName];

  if (valueIsTreeRank(possibleDataBaseTableName))
    return [
      databaseFieldName,
      databaseFieldName === 'name'
        ? possibleTableName
        : `${possibleTableName} ${fieldName}${toManyIndexString}`,
    ];
  else if (valueIsReferenceItem(possibleDataBaseTableName))
    return [databaseFieldName, `${fieldName} ${possibleTableName}`];
  else
    return [
      databaseFieldName,
      mappingLineData.slice(-1)[0].mappingElementData.tableName === 'agent'
        ? `${possibleTableName} ${fieldName}${toManyIndexString}`
        : `${fieldName}${toManyIndexString}`,
    ];
}

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

// Find the index of a subArray in array. On failure returns -1
export const findSubArray = (array: RA<string>, subArray: RA<string>): number =>
  array.findIndex((_, index) =>
    mappingPathToString(array.slice(index)).startsWith(
      mappingPathToString(subArray)
    )
  );

/*
 * Takes an array of mappings with headers and returns the indexes of the
 * duplicate headers
 * Example:
 * if three lines have the same mapping, the indexes of the second and the
 *  third lines are returned
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
