/**
 * Generate a short human-friendly column header name out of mapping path
 *
 * @remarks
 * Used by WbPlanView to assign names to newly added headers
 *
 * @module
 */

import type { MappingPath } from './components/wbplanviewmapper';
import type { Tables } from './datamodel';
import { camelToHuman } from './helpers';
import { getModel } from './schema';
import { defined, filterArray } from './types';
import {
  anyTreeRank,
  formatTreeRank,
  getNameFromTreeRankName,
  getNumberFromToManyIndex,
  valueIsToManyIndex,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import { getMappingLineData } from './wbplanviewnavigator';

/** Use table name instead of field name for the following fields: */
const fieldsToHide: Set<string> = new Set(['name', 'fullName', 'localityName']);

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
const genericTables: Set<string> = new Set(['referenceWork']);

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

/**
 * Generate a short and human friendly label from a potentially long
 * mapping path
 */
export function generateMappingPathPreview(
  baseTableName: keyof Tables,
  mappingPath: MappingPath
): string {
  const mappingLineData = getMappingLineData({
    baseTableName,
    mappingPath,
    generateFieldData: 'selectedOnly',
    scope: 'queryBuilder',
  });

  const fieldLabels = [
    mappingLineData[0].selectLabel ?? '',
    ...mappingLineData.map((mappingElementData) =>
      Object.keys(mappingElementData.fieldsData)[0] ===
      formatTreeRank(anyTreeRank)
        ? defined(getModel(defined(mappingElementData.tableName))).label
        : (Object.values(mappingElementData.fieldsData)[0]
            ?.optionLabel as string)
    ),
  ];

  const toManyLocation = Array.from(mappingPath)
    .reverse()
    .findIndex(valueIsToManyIndex);

  const toManyIndex = mappingPath[mappingPath.length - 1 - toManyLocation];
  const toManyIndexNumber = toManyIndex
    ? getNumberFromToManyIndex(toManyIndex)
    : 1;
  const toManyIndexFormatted = toManyIndexNumber > 1 ? toManyIndex : undefined;

  const [databaseFieldName, databaseTableOrRankName, databaseParentTableName] =
    mappingPathSubset([baseTableName, ...mappingPath]);
  const [
    fieldName = camelToHuman(databaseFieldName),
    tableOrRankName = camelToHuman(
      getNameFromTreeRankName(databaseTableOrRankName)
    ),
    parentTableName = camelToHuman(databaseParentTableName),
  ] = mappingPathSubset(fieldLabels);

  const fieldNameFormatted = fieldsToHide.has(databaseFieldName)
    ? undefined
    : fieldName;
  const fieldIsGeneric =
    (genericFields.has(databaseFieldName) &&
      fieldNameFormatted?.split(' ').length === 1) ||
    (fieldNameFormatted?.split(' ').length === 1 &&
      !nonGenericFields.has(databaseFieldName));
  const tableNameNonEmpty =
    fieldNameFormatted === undefined
      ? tableOrRankName || fieldName
      : fieldIsGeneric
      ? tableOrRankName
      : undefined;
  const tableNameFormatted = tablesToHide.has(databaseTableOrRankName)
    ? [parentTableName || tableNameNonEmpty]
    : genericTables.has(databaseTableOrRankName)
    ? [parentTableName, tableNameNonEmpty]
    : [tableNameNonEmpty];

  return filterArray([
    ...(valueIsTreeRank(databaseTableOrRankName)
      ? [
          databaseTableOrRankName === formatTreeRank(anyTreeRank)
            ? parentTableName
            : tableOrRankName,
        ]
      : tableNameFormatted),
    fieldNameFormatted,
    toManyIndexFormatted,
  ]).join(' ');
}
