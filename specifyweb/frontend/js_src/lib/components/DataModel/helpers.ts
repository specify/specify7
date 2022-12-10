import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { isTreeResource } from '../InitialContext/treeRanks';
import type {
  AnySchema,
  AnyTree,
  SerializedModel,
  SerializedResource,
} from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { parseResourceUrl, resourceToJson } from './resource';
import { strictGetModel } from './schema';
import type { Tables } from './types';
import { addMissingFields } from './addMissingFields';

/** Like resource.toJSON(), but keys are converted to camel case */
export const serializeResource = <SCHEMA extends AnySchema>(
  resource: SerializedModel<SCHEMA> | SpecifyResource<SCHEMA>
): SerializedResource<SCHEMA> =>
  serializeModel<SCHEMA>(
    typeof resource.toJSON === 'function'
      ? resourceToJson(resource as SpecifyResource<SCHEMA>)
      : (resource as SerializedModel<SCHEMA>),
    (resource as SpecifyResource<SCHEMA>)?.specifyModel?.name
  );

export const specialFields = new Set([
  'id',
  'resource_uri',
  'recordset_info',
  '_tableName',
]);

/** Recursive helper for serializeResource */
function serializeModel<SCHEMA extends AnySchema>(
  resource: SerializedModel<SCHEMA>,
  tableName?: keyof Tables
): SerializedResource<SCHEMA> {
  const model = strictGetModel(
    defined(
      (tableName as SCHEMA['tableName']) ??
        resource._tableName ??
        parseResourceUrl((resource.resource_uri as string) ?? '')?.[0],
      `Unable to serialize resource because table name is unknown.` +
        (process.env.NODE_ENV === 'test'
          ? `\nMake sure your test file calls requireContext();`
          : '')
    )
  );
  const fields = [...model.fields.map(({ name }) => name), model.idField.name];

  return addMissingFields(
    model.name,
    Object.fromEntries(
      Object.entries(resource).map(([lowercaseFieldName, value]) => {
        let camelFieldName = fields.find(
          (fieldName) => fieldName.toLowerCase() === lowercaseFieldName
        );
        if (camelFieldName === undefined) {
          camelFieldName = lowercaseFieldName;
          if (!specialFields.has(lowercaseFieldName))
            console.warn(
              `Trying to serialize unknown field ${lowercaseFieldName} for table ${model.name}`,
              resource
            );
        }
        if (
          typeof value === 'object' &&
          value !== null &&
          !specialFields.has(camelFieldName)
        ) {
          const field = model.getField(lowercaseFieldName);
          const tableName =
            field === undefined || !field.isRelationship
              ? undefined
              : field.relatedModel.name;
          return [
            camelFieldName,
            Array.isArray(value)
              ? value.map((value) =>
                  serializeModel(
                    value as unknown as SerializedModel<SCHEMA>,
                    tableName
                  )
                )
              : serializeModel(value as SerializedModel<AnySchema>, tableName),
          ];
        } else return [camelFieldName, value];
      })
    )
  ) as SerializedResource<SCHEMA>;
}

export const isResourceOfType = <TABLE_NAME extends keyof Tables>(
  resource: SpecifyResource<AnySchema>,
  tableName: TABLE_NAME
  // @ts-expect-error
): resource is SpecifyResource<Tables[TABLE_NAME]> =>
  resource.specifyModel.name === tableName;

export const toTable = <TABLE_NAME extends keyof Tables>(
  resource: SpecifyResource<AnySchema>,
  tableName: TABLE_NAME
): SpecifyResource<Tables[TABLE_NAME]> | undefined =>
  resource.specifyModel.name === tableName ? resource : undefined;

export const toResource = <TABLE_NAME extends keyof Tables>(
  resource: SerializedResource<AnySchema>,
  tableName: TABLE_NAME
): SerializedResource<Tables[TABLE_NAME]> | undefined =>
  resource._tableName === tableName
    ? (resource as SerializedResource<Tables[TABLE_NAME]>)
    : undefined;

export const toTreeTable = (
  resource: SpecifyResource<AnySchema>
): SpecifyResource<AnyTree> | undefined =>
  isTreeResource(resource) ? resource : undefined;

export const toTables = <TABLE_NAME extends keyof Tables>(
  resource: SpecifyResource<AnySchema>,
  tableNames: RA<TABLE_NAME>
): SpecifyResource<Tables[TABLE_NAME]> | undefined =>
  f.includes(tableNames, resource.specifyModel.name) ? resource : undefined;
