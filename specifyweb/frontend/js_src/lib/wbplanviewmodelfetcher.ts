/**
 *
 * Modifies the front-end data model using config from wbplanviewmodelconfig.ts
 * and caches it
 *
 * TODO: consider converting all fieldNames and tableNames to camelCase
 *
 * @module
 */

import type { RelationshipType } from './components/wbplanviewmapper';
import type { Tables } from './datamodel';
import { fetchContext as fetchSchema, schema } from './schema';
import { isTreeModel } from './treedefinitions';
import type { IR, R } from './types';
import { camelToHuman } from './wbplanviewhelper';
import dataModelStorage from './wbplanviewmodel';
import type {
  FieldConfigOverwrite,
  TableConfigOverwrite,
} from './wbplanviewmodelconfig';
import { fetchingParameters } from './wbplanviewmodelconfig';

export type DataModelField = DataModelNonRelationship | DataModelRelationship;

type DataModelFieldPrimer = {
  readonly label: string;
  readonly isHidden: boolean;
  readonly isRequired: boolean;
  readonly isReadOnly: boolean;
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

export const getTableOverwrite = (
  tableName: string
): TableConfigOverwrite | undefined =>
  fetchingParameters.tableOverwrites[tableName] ??
  Object.entries(fetchingParameters.endsWithTableOverwrites).find(([label]) =>
    tableName.endsWith(label)
  )?.[1];

const getFieldOverwrite = (
  tableName: string,
  fieldName: string
): FieldConfigOverwrite | undefined =>
  fetchingParameters.fieldOverwrites[tableName]?.[fieldName] ??
  fetchingParameters.fieldOverwrites._common?.[fieldName] ??
  Object.entries(fetchingParameters.endsWithFieldOverwrites).find(([key]) =>
    fieldName.endsWith(key)
  )?.[1] ??
  (schema.frontEndFields[tableName as keyof Tables]?.has(
    fieldName as keyof Tables[keyof Tables]['fields']
  ) === true
    ? 'remove'
    : undefined);

const getVisibleTables = (): Readonly<Set<string>> =>
  new Set(
    Object.entries(schema.models)
      .filter(
        ([tableName, tableData]) =>
          !tableData.isHidden() &&
          !tableData.system &&
          getTableOverwrite(tableName.toLowerCase()) !== 'remove'
      )
      .map(([tableName]) => tableName.toLowerCase())
  );

/*
 * Makes changes to the front-end schema to adapt it for usage in the workbench:
 *  - Removes/hides tables
 *  - Removes/hides/unRequires fields
 *  - Replaces zero-to-one relationship with one-to-many
 * See more details in WbPlanViewModelConfig.ts
 */
async function fetchDataModel(): Promise<void> {
  if (typeof dataModelStorage.tables === 'object') return;

  await fetchSchema;

  const visibleTables = getVisibleTables();

  dataModelStorage.tables = Object.fromEntries(
    Object.values(schema.models)
      .filter((tableData) => visibleTables.has(tableData.name.toLowerCase()))
      .map((tableData) => {
        const tableName = tableData.name.toLowerCase();

        const isTreeTable = isTreeModel(tableData.name);

        const fields: R<DataModelField> = {};

        tableData.fields.forEach((field) => {
          if (isTreeTable && field.isRelationship) return;

          const label = field.getLocalizedName() ?? camelToHuman(field.name);
          const fieldName = field.name.toLowerCase();

          const fieldOverwrite = getFieldOverwrite(tableName, fieldName);

          let isRequired = fieldOverwrite !== 'optional' && field.isRequired;
          let isHidden = field.isHidden();

          // Overwritten hidden fields are made not required
          if (fieldOverwrite === 'hidden') {
            isRequired = false;
            isHidden = true;
          }
          // Other required fields are unhidden
          else if (isHidden && isRequired) isHidden = false;

          const baseField: DataModelFieldPrimer = {
            label,
            isHidden,
            isRequired,
            isReadOnly: field.readOnly || fieldOverwrite === 'readOnly',
          };

          if (field.isRelationship) {
            let foreignName = field.otherSideName;
            if (typeof foreignName === 'string')
              foreignName = foreignName.toLowerCase();

            if (!visibleTables.has(field.relatedModelName.toLowerCase()))
              return;

            fields[fieldName] = {
              ...baseField,
              isRelationship: true,
              tableName: field.relatedModelName.toLowerCase(),
              type: field.type === 'zero-to-one' ? 'one-to-many' : field.type,
              foreignName,
            };
          } else
            fields[fieldName] = {
              ...baseField,
              isRelationship: false,
            };
        });

        return [tableName, fields] as const;
      })
  );
}

export const dataModelPromise = fetchDataModel().then(() => dataModelStorage);

export const getBaseTables = (): IR<boolean> =>
  Object.fromEntries(
    Array.from(getVisibleTables(), (tableName) => [
      tableName,
      getTableOverwrite(tableName) === 'commonBaseTable',
    ])
  );
