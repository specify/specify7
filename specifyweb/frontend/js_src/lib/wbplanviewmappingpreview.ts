/**
 * Generate a short human-friendly column header name out of mapping path
 *
 * @remarks
 * Used by WbPlanView to assign names to newly added headers
 *
 * @module
 */

import type { MappingPath } from './components/wbplanviewmapper';
import type { RA } from './types';
import { camelToHuman } from './wbplanviewhelper';
import {
  getNumberFromToManyIndex,
  valueIsToManyIndex,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import { getMappingLineData } from './wbplanviewnavigator';

/** Use table name instead of field name for the following fields: */
const fieldsToHide: Set<string> = new Set(['name', 'fullname', 'localityname']);

/**
 * Use table name alongside field label (if field label consists of a single
 * word) for the following fields:
 */
const genericFields: Set<string> = new Set([]);

/**
 * If field label consists of a single word, it would be treated as generic
 * (the table name would be used alongside field label). The following
 * fields are exempt from such behaviour:
 */
const nonGenericFields: Set<string> = new Set([
  'latitude1',
  'longitude1',
  'latitude2',
  'longitude2',
]);

/** Use parent table label instead of this table label (if possible) */
const tablesToHide: Set<string> = new Set(['agent', 'addresses']);

/** Use both parent table label and this table label (if possible) */
const genericTables: Set<string> = new Set(['referencework']);

/**
 * NOTE: subset is reversed so that array destructuring works right for mapping
 * paths shorter than 3 elements
 */
const mappingPathSubset = (mappingPath: MappingPath): MappingPath => [
  ...mappingPath
    .filter((mappingPathPart) => !valueIsToManyIndex(mappingPathPart))
    .reverse(),
  ...Array.from<string>({ length: 3 }).fill(''),
];

const formatResponse = (fields: RA<string | RA<string>>): string =>
  fields
    .flat()
    .filter((field) => field)
    .join(' ');

export function generateMappingPathPreview(
  baseTableName: string,
  mappingPath: MappingPath
): string {
  const mappingLineData = getMappingLineData({
    baseTableName,
    mappingPath,
    generateFieldData: 'selectedOnly',
  });

  const fieldLabels = [
    mappingLineData[0].selectLabel ?? '',
    ...mappingLineData.map(
      (mappingElementData) =>
        Object.values(mappingElementData.fieldsData)[0]?.optionLabel as string
    ),
  ];

  const toManyLocation = Array.from(mappingPath)
    .reverse()
    .findIndex((mappingPathPart) => valueIsToManyIndex(mappingPathPart));

  const toManyIndex = mappingPath[mappingPath.length - 1 - toManyLocation];
  const toManyIndexNumber = toManyIndex
    ? getNumberFromToManyIndex(toManyIndex)
    : 1;
  const toManyIndexFormatted = toManyIndexNumber > 1 ? toManyIndex : '';

  const [databaseFieldName, databaseTableOrRankName, databaseParentTableName] =
    mappingPathSubset([baseTableName, ...mappingPath]);
  const [
    fieldName = camelToHuman(databaseFieldName),
    tableOrRankName = camelToHuman(databaseTableOrRankName),
    parentTableName = camelToHuman(databaseParentTableName),
  ] = mappingPathSubset(fieldLabels);

  const fieldNameFormatted = fieldsToHide.has(databaseFieldName)
    ? ''
    : fieldName;
  const fieldIsGeneric =
    (genericFields.has(databaseFieldName) &&
      fieldNameFormatted.split(' ').length === 1) ||
    (fieldNameFormatted.split(' ').length === 1 &&
      !nonGenericFields.has(databaseFieldName));
  const tableNameNonEmpty =
    fieldNameFormatted === ''
      ? tableOrRankName || fieldName
      : fieldIsGeneric
      ? tableOrRankName
      : '';
  const tableNameFormatted = tablesToHide.has(databaseTableOrRankName)
    ? parentTableName || tableNameNonEmpty
    : genericTables.has(databaseTableOrRankName)
    ? [parentTableName, tableNameNonEmpty]
    : tableNameNonEmpty;

  return formatResponse([
    valueIsTreeRank(databaseTableOrRankName)
      ? tableOrRankName
      : tableNameFormatted,
    fieldNameFormatted,
    toManyIndexFormatted,
  ]);
}
