/**
 * Generate a short human-friendly column header name out of mapping path
 *
 * @remarks
 * Used by WbPlanView to assign names to newly added headers
 *
 * @module
 */

import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { camelToHuman } from '../../utils/utils';
import { strictGetTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import type { MappingPath } from './Mapper';
import {
  anyTreeRank,
  formattedEntry,
  formatTreeRank,
  getNameFromTreeRankName,
  getNumberFromToManyIndex,
  parsePartialField,
  valueIsPartialField,
  valueIsToManyIndex,
  valueIsTreeDefinition,
  valueIsTreeRank,
} from './mappingHelpers';
import { getMappingLineData } from './navigator';
import { navigatorSpecs } from './navigatorSpecs';

/** Use table name instead of field name for the following fields: */
const fieldsToHide = new Set<string>(['localityName', formattedEntry]);

/**
 * Use table name alongside field label (if field label consists of a single
 * word) for the following fields:
 */
const genericFields = new Set<string>([
  'timestampCreated',
  'timestampModified',
  'createdByAgent',
  'modifiedByAgent',
  'guid',
  'version',
  'id',
]);

/**
 * If field label consists of a single word, it would be treated as generic
 * (the table name would be used alongside field label). The following
 * fields are exempt from such behaviour:
 */
const nonGenericFields = new Set<string>([
  'latitude1',
  'longitude1',
  'latitude2',
  'longitude2',
  'action',
  'fields',
]);

/** Use parent table label instead of this table label (if possible) */
const tablesToHide = new Set<string>(['agent', 'addresses']);

/** Use both parent table label and this table label (if possible) */
const genericTables = new Set<string>(['referenceWork']);

/**
 * NOTE: subset is reversed so that array destructuring works right for mapping
 * paths shorter than 3 elements
 */
const mappingPathSubset = <T extends string | undefined>(
  mappingPath: RA<T | string>
): RA<T | string> => [
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
  if (mappingPath.length === 0) return strictGetTable(baseTableName).label;

  // Get labels for the fields
  const mappingLineData = getMappingLineData({
    baseTableName,
    mappingPath,
    generateFieldData: 'selectedOnly',
    spec: navigatorSpecs.permissive,
  });

  // Extract labels from mappingLineData
  const fieldLabels = [
    mappingLineData[0].selectLabel ?? '',
    ...mappingLineData.map((mappingElementData) => {
      const entry = Object.entries(mappingElementData.fieldsData)[0];
      if (entry === undefined) return undefined;
      const [fieldName, { optionLabel }] = entry;
      return fieldName === formatTreeRank(anyTreeRank)
        ? strictGetTable(mappingElementData.tableName!).label
        : (optionLabel as string);
    }),
  ];

  // Extract last number of path if any (i.e: Collection Object -> Collector -> #1 -> Address -> #2 -> Name)
  const toManyLocation = Array.from(mappingPath)
    .reverse()
    .findIndex(valueIsToManyIndex);

  // Convert toManyLocation to a number
  const toManyIndex = mappingPath[mappingPath.length - 1 - toManyLocation];
  const toManyIndexNumber = toManyIndex
    ? getNumberFromToManyIndex(toManyIndex)
    : 1;
  const toManyIndexFormatted = toManyIndexNumber > 1 ? toManyIndex : undefined;

  const [
    databaseFieldName,
    databaseTableOrRankName,
    databaseParentTableOrTreeName,
  ] = mappingPathSubset([baseTableName, ...mappingPath]);

  // Attributes parts of filedLables to each variable or creates one if empty
  const [
    fieldName = camelToHuman(databaseFieldName),
    tableOrRankName = camelToHuman(
      getNameFromTreeRankName(databaseTableOrRankName)
    ),
    parentTableOrTreeName = camelToHuman(databaseParentTableOrTreeName),
  ] = mappingPathSubset(fieldLabels);

  const isAnyRank = databaseTableOrRankName === formatTreeRank(anyTreeRank);

  // Show filedname or not
  const fieldNameFormatted =
    fieldsToHide.has(databaseFieldName) ||
    (databaseTableOrRankName !== 'CollectionObject' && 
      databaseTableOrRankName !== 'childCog' &&
      databaseFieldName === 'name' &&
      !isAnyRank)
      ? undefined
      : fieldName;

  // Extract the first part of fieldName (i.e: timestampCreated-fulldate)
  const baseFieldName = valueIsPartialField(databaseFieldName)
    ? parsePartialField(databaseFieldName)[0]
    : databaseFieldName;
  // Treat fields whose label is single word as generic
  const fieldIsGeneric =
    genericFields.has(baseFieldName) ||
    (fieldNameFormatted?.split(' ').length === 1 &&
      !nonGenericFields.has(baseFieldName) && 
      databaseTableOrRankName !== 'childCog'
    );

  const tableNameNonEmpty =
    fieldNameFormatted === undefined
      ? tableOrRankName || fieldName
      : fieldIsGeneric
        ? tableOrRankName
        : undefined;

  const tableNameFormatted =
    tablesToHide.has(databaseTableOrRankName) &&
    databaseFieldName !== formattedEntry
      ? [parentTableOrTreeName || tableNameNonEmpty]
      : genericTables.has(databaseTableOrRankName)
        ? [parentTableOrTreeName, tableNameNonEmpty]
        : [tableNameNonEmpty];

  return filterArray([
    ...(valueIsTreeRank(databaseTableOrRankName)
      ? [isAnyRank ? parentTableOrTreeName : tableOrRankName]
      : tableNameFormatted),
    fieldNameFormatted,
    ...(valueIsTreeRank(databaseTableOrRankName) &&
    valueIsTreeDefinition(databaseParentTableOrTreeName)
      ? [parentTableOrTreeName]
      : []),
    toManyIndexFormatted,
  ])
    .filter(Boolean)
    .join(' - ');
}
