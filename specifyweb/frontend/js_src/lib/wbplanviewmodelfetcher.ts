/**
 *
 * Modifies the front-end data model using config from wbplanviewmodelconfig.ts
 * and caches it
 *
 * @module
 */

// TODO: consider transitioning to using schema.ts now that type support is improved
import ajax from './ajax';
import * as cache from './cache';
import type { RelationshipType } from './components/wbplanviewmapper';
import type { Tables } from './datamodel';
import schema, { fetchContext as fetchSchema } from './schema';
import type { Relationship } from './specifyfield';
import systemInfo from './systeminfo';
import { isTreeModel } from './treedefinitions';
import type { IR, R, RA, Writable } from './types';
import { camelToHuman } from './wbplanviewhelper';
import dataModelStorage from './wbplanviewmodel';
import type {
  FieldConfigOverwrite,
  TableConfigOverwrite,
} from './wbplanviewmodelconfig';
import {
  aliasRelationshipTypes,
  dataModelFetcherVersion,
  fetchingParameters,
  knownRelationshipTypes,
} from './wbplanviewmodelconfig';

export type DataModelField = DataModelNonRelationship | DataModelRelationship;

type DataModelFieldPrimer = {
  readonly label: string;
  readonly isHidden: boolean;
  readonly isRequired: boolean;
  readonly tableName?: string;
  readonly type?: RelationshipType;
  readonly foreignName?: string;
};

export type DataModelNonRelationship = DataModelFieldPrimer & {
  readonly isRelationship: false;
};

export type DataModelRelationship = DataModelFieldPrimer & {
  readonly isRelationship: true;
  readonly tableName: string;
  readonly type: RelationshipType;
  readonly foreignName?: string;
};

export type DataModelTable = {
  // Whether to show in the list of base tables in Workbench Mapper
  readonly isBaseTable: boolean;
  /*
   * If isBaseTable && !isCommonTable, table would be hidden from the list
   * of base tables, unless showAdvancedTables checkbox is checked
   */
  readonly isCommonTable: boolean;
  readonly fields: IR<DataModelField>;
};

export type OriginalRelationships = IR<IR<RA<string>>>;
type OriginalRelationshipsWritable = R<R<string[]>>;

function handleRelationshipType(
  relationshipType: RelationshipType,
  currentTableName: string,
  relationshipName: string,
  originalRelationships: OriginalRelationshipsWritable
): RelationshipType {
  if (knownRelationshipTypes.has(relationshipType)) return relationshipType;
  else {
    if (relationshipType in aliasRelationshipTypes) {
      originalRelationships[relationshipType] ??= {};
      originalRelationships[relationshipType][currentTableName] ??= [];
      originalRelationships[relationshipType][currentTableName].push(
        relationshipName
      );
      return aliasRelationshipTypes[relationshipType];
    } else throw new Error('Unknown relationship type detected');
  }
}

function handleRelationshipField(
  relationship: Relationship,
  baseField: DataModelFieldPrimer,
  fieldName: string,
  currentTableName: string,
  hiddenTables: Readonly<Set<string>>,
  originalRelationships: OriginalRelationshipsWritable
): DataModelRelationship | undefined {
  let foreignName = relationship.otherSideName;
  if (typeof foreignName !== 'undefined')
    foreignName = foreignName.toLowerCase();

  const tableName = relationship.relatedModelName.toLowerCase();
  const relationshipType = handleRelationshipType(
    relationship.type as RelationshipType,
    currentTableName,
    fieldName,
    originalRelationships
  );

  if (relationship.readOnly || tableHasOverwrite(tableName, 'remove'))
    return undefined;

  return {
    ...baseField,
    isRelationship: true,
    isHidden: baseField.isHidden || hiddenTables.has(tableName),
    tableName,
    type: relationshipType,
    foreignName,
  };
}

export const tableHasOverwrite = (
  tableName: string,
  overwriteName: TableConfigOverwrite
): boolean =>
  fetchingParameters.tableOverwrites[tableName] === overwriteName ||
  Object.entries(fetchingParameters.endsWithTableOverwrites).findIndex(
    ([label, action]) => tableName.endsWith(label) && action === overwriteName
  ) !== -1;

const fieldHasOverwrite = (
  tableName: string,
  fieldName: string,
  overwriteName: FieldConfigOverwrite
): boolean =>
  fetchingParameters.fieldOverwrites[tableName]?.[fieldName] ===
    overwriteName ||
  fetchingParameters.fieldOverwrites._common?.[fieldName] === overwriteName ||
  Object.entries(fetchingParameters.endsWithFieldOverwrites).findIndex(
    ([key, action]) => fieldName.endsWith(key) && action === overwriteName
  ) !== -1 ||
  (overwriteName === 'remove' &&
    (schema.frontEndFields[tableName as keyof Tables]?.has(
      fieldName as keyof Tables[keyof Tables]['fields']
    ) ??
      false));

/**
 * Schema hash is used for wiping schema cache after schema changes
 *
 * @remarks
 * Hash is calculated by summing the total number of records in the
 * SpAuditLog table for Schema Config tables
 */
const getSchemaHash = async (): Promise<number> =>
  Promise.all(
    [
      schema.models.SpLocaleContainerItem.tableId,
      schema.models.SpLocaleContainerItem.tableId,
      schema.models.SpLocaleItemStr.tableId,
    ].map(async (tableNumber) =>
      ajax<{ readonly meta: { readonly total_count: number } }>(
        `/api/specify/spauditlog/?limit=1&tablenum=${tableNumber}`,
        { headers: { Accept: 'application/json' } }
      ).then(({ data: { meta } }) => meta.total_count)
    )
  ).then((counts) => counts.reduce((sum, count) => sum + count, 0));

/* Fetches the data model */
async function fetchDataModel(ignoreCache = false): Promise<void> {
  if (!ignoreCache && typeof dataModelStorage.tables !== 'undefined') return;

  if (typeof dataModelStorage.currentCollectionId === 'undefined')
    dataModelStorage.currentCollectionId = await cache.getCurrentCollectionId();

  await fetchSchema;
  const schemaHash = await getSchemaHash();

  const cacheVersion = [
    dataModelFetcherVersion,
    dataModelStorage.currentCollectionId,
    systemInfo.schema_version,
    schemaHash,
  ].join('_');

  if (!ignoreCache) {
    const tables = cache.get('wbPlanViewDataModel', 'tables', {
      version: cacheVersion,
    });
    const originalRelationships = cache.get(
      'wbPlanViewDataModel',
      'originalRelationships',
      { version: cacheVersion }
    );

    if (
      typeof tables === 'object' &&
      typeof originalRelationships === 'object'
    ) {
      dataModelStorage.tables = tables;
      dataModelStorage.originalRelationships = originalRelationships;
      return;
    }
  }

  const originalRelationships: OriginalRelationshipsWritable = {};

  const hiddenTables = new Set(
    Object.values(schema.models)
      .map(
        (tableData) =>
          [tableData.name.toLowerCase(), tableData.isHidden()] as const
      )
      .filter(([_tableName, isHidden]) => isHidden)
      .map(([tableName]) => tableName)
  );

  const tables = Object.values(schema.models).reduce<
    R<Writable<DataModelTable>>
  >((tables, tableData) => {
    const tableName = tableData.name.toLowerCase();

    const isTreeTable = isTreeModel(tableData.name);

    const fields: R<DataModelField> = {};

    if (tableData.system || tableHasOverwrite(tableName, 'remove'))
      return tables;

    tableData.fields.forEach((field) => {
      if (isTreeTable && field.isRelationship) return;

      const label = field.getLocalizedName() ?? camelToHuman(field.name);
      const fieldName = field.name.toLowerCase();

      if (fieldHasOverwrite(tableName, fieldName, 'remove')) return;

      let isRequired = field.isRequired;
      let isHidden = field.isHidden();

      /*
       * Required fields should not be hidden, unless they are present in
       * this list
       */
      if (fieldHasOverwrite(tableName, fieldName, 'hidden')) {
        isRequired = false;
        isHidden = true;
      }
      // Un-hide required fields
      else if (isHidden && isRequired) isHidden = false;

      if (fieldHasOverwrite(tableName, fieldName, 'optional'))
        isRequired = false;

      const baseField: DataModelFieldPrimer = {
        label,
        isHidden,
        isRequired,
      };

      const fieldData = field.isRelationship
        ? handleRelationshipField(
            field,
            baseField,
            fieldName,
            tableName,
            hiddenTables,
            originalRelationships
          )
        : { ...baseField, isRelationship: false };

      if (typeof fieldData === 'undefined') return;

      fields[fieldName] = fieldData;
    });

    const orderedFields = Object.fromEntries(
      Object.entries(fields)
        .sort(
          (
            [, { isRelationship, label }],
            [
              ,
              {
                isRelationship: secondIsRelationship,
                label: secondFriendlyName,
              },
            ]
          ) =>
            isRelationship === secondIsRelationship
              ? label.localeCompare(secondFriendlyName)
              : isRelationship
              ? 1
              : -1
        )
        .map(([fieldName]) => [fieldName, fields[fieldName]])
    );

    const isBaseTable =
      !tableHasOverwrite(tableName, 'hidden') && !hiddenTables.has(tableName);

    tables[tableName] = {
      fields: orderedFields,
      isBaseTable,
      isCommonTable: tableHasOverwrite(tableName, 'commonBaseTable'),
    };

    return tables;
  }, {});

  // Remove relationships to system tables
  Object.entries(tables).forEach(([tableName, tableData]) => {
    tables[tableName].fields = Object.fromEntries([
      ...Object.entries(tableData.fields).filter(
        ([, { isRelationship }]) => !isRelationship
      ),
      ...(
        Object.entries(tableData.fields).filter(
          ([, { isRelationship }]) => isRelationship
        ) as [fieldName: string, relationshipData: DataModelRelationship][]
      ).filter(
        ([, { tableName: relationshipTableName }]) =>
          typeof tables[relationshipTableName] !== 'undefined'
      ),
    ]);
  });

  dataModelStorage.tables = cache.set('wbPlanViewDataModel', 'tables', tables, {
    version: cacheVersion,
    overwrite: true,
  });
  dataModelStorage.originalRelationships = cache.set(
    'wbPlanViewDataModel',
    'originalRelationships',
    originalRelationships,
    {
      version: cacheVersion,
      overwrite: true,
    }
  );
}

export const dataModelPromise = fetchDataModel().then(() => dataModelStorage);
