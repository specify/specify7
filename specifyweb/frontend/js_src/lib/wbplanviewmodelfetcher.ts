/**
 *
 * Modifies the front-end data model using config from wbplanviewmodelconfig.ts
 * and caches it
 *
 * @module
 */

import type { RelationshipType } from './components/wbplanviewmapper';
import type { Tables } from './datamodel';
import { schema, fetchContext as fetchSchema } from './schema';
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

const getVisibleTables = (): Readonly<Set<string>> =>
  new Set(
    Object.entries(schema.models)
      .filter(
        ([tableName, tableData]) =>
          !tableData.isHidden() &&
          !tableData.system &&
          !tableHasOverwrite(tableName.toLowerCase(), 'remove')
      )
      .map(([tableName]) => tableName)
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
      .filter((tableData) => visibleTables.has(tableData.name))
      .map((tableData) => {
        const tableName = tableData.name.toLowerCase();

        const isTreeTable = isTreeModel(tableData.name);

        const fields: R<DataModelField> = {};

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

          if (field.isRelationship) {
            let foreignName = field.otherSideName;
            if (typeof foreignName === 'string')
              foreignName = foreignName.toLowerCase();

            if (field.readOnly || !visibleTables.has(field.relatedModelName))
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
      tableHasOverwrite(tableName, 'commonBaseTable'),
    ])
  );
