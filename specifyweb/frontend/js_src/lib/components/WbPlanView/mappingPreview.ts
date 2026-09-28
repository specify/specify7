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
import { strictGetTable, tables } from '../DataModel/tables';
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

  const appendToManyIndex = (
    mappingPath: MappingPath,
    preview: string
  ): string => {
    const toManyLocation = Array.from(mappingPath)
      .reverse()
      .findIndex(valueIsToManyIndex);
    const toManyIndex = mappingPath[mappingPath.length - 1 - toManyLocation];
    const toManyIndexFormatted =
      toManyIndex !== undefined && getNumberFromToManyIndex(toManyIndex) > 1
        ? toManyIndex
        : undefined;

    return filterArray([preview, toManyIndexFormatted])
      .filter(Boolean)
      .join(' - ');
  };

  const agentFieldPreview = getAgentFieldPreview(baseTableName, mappingPath);
  if (agentFieldPreview !== undefined)
    return appendToManyIndex(mappingPath, agentFieldPreview);
  const finalMappingElement = mappingLineData.at(-1);
  const pathFields = mappingPath
    .slice(0, -1)
    .filter(
      (part) =>
        !valueIsToManyIndex(part) &&
        !valueIsTreeRank(part) &&
        !valueIsPartialField(part)
    );
  if (
    mappingPath.at(-1) === formattedEntry &&
    pathFields.at(-1)?.toLowerCase() === 'agent'
  ) {
    const parentLabel = finalMappingElement?.selectLabel;
    if (parentLabel !== undefined)
      return appendToManyIndex(mappingPath, `${parentLabel} - Agent`);
  }

  if (
    mappingPath.at(-1) === formattedEntry &&
    finalMappingElement?.tableName?.toLowerCase() === 'agent'
  ) {
    const parentField = mappingLineData
      .slice(0, -1)
      .reverse()
      .map((mappingElement) => Object.values(mappingElement.fieldsData)[0])
      .find((field) =>
        typeof field?.optionLabel === 'string'
          ? !field.optionLabel.startsWith('#')
          : false
      );
    const parentLabel =
      typeof parentField?.optionLabel === 'string'
        ? parentField.optionLabel
        : undefined;
    if (parentLabel?.toLowerCase().endsWith(' agent'))
      return appendToManyIndex(mappingPath, parentLabel);
    if (parentLabel !== undefined)
      return appendToManyIndex(mappingPath, `${parentLabel} - Agent`);
  }

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
      databaseFieldName === 'name')
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
      !nonGenericFields.has(baseFieldName));

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

  // Special case for disambiguation: Host taxon under specific base tables
  const baseTables = [
    'CollectionObject',
    'CollectingEventAttribute',
    'Determination',
    'Taxon',
  ];
  const hostTaxonNames = [
    'host taxon',
    tables[baseTableName]
      ?.getField('hostTaxon')
      ?.localization.name?.trim()
      ?.toLowerCase(),
  ].filter(Boolean);
  const isHostTaxonCase =
    baseTables.includes(baseTableName) &&
    hostTaxonNames.includes((parentTableOrTreeName ?? '').trim().toLowerCase());

  return filterArray([
    ...(isHostTaxonCase ? ['Host'] : []),
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

function getAgentFieldPreview(
  baseTableName: keyof Tables,
  mappingPath: MappingPath
): string | undefined {
  let table = strictGetTable(baseTableName);
  let agentPrefix: string | undefined;
  let finalFieldLabel: string | undefined;
  let parentRelationshipLabel: string | undefined;

  for (const [index, part] of mappingPath.entries()) {
    if (
      valueIsToManyIndex(part) ||
      valueIsTreeRank(part) ||
      valueIsPartialField(part) ||
      part === formattedEntry
    )
      continue;

    const field = table.getField(part);
    if (field === undefined) continue;

    if (field.isRelationship) {
      if (field.relatedTable.name.toLowerCase() === 'agent') {
        agentPrefix =
          field.label.toLowerCase() === 'agent'
            ? parentRelationshipLabel
            : field.label.replace(/\s+Agent$/u, '');
      } else {
        parentRelationshipLabel = field.label;
      }
      table = field.relatedTable;
    } else if (index === mappingPath.length - 1) {
      finalFieldLabel = field.label;
    }
  }

  return agentPrefix !== undefined && finalFieldLabel !== undefined
    ? `${agentPrefix} - ${finalFieldLabel}`
    : undefined;
}
