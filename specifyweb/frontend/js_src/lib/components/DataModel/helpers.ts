import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { parserFromType } from '../../utils/uiParse';
import { isTreeResource } from '../InitialContext/treeRanks';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import type {
  AnySchema,
  AnyTree,
  SerializedModel,
  SerializedResource,
} from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { parseResourceUrl, resourceToJson } from './resource';
import { getModel } from './schema';
import type { Tables } from './types';

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

const specialFields = new Set([
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
  const model = defined(
    getModel(
      defined(
        (tableName as SCHEMA['tableName']) ??
          resource._tablename ??
          parseResourceUrl((resource.resource_uri as string) ?? '')?.[0]
      )
    )
  );
  const fields = model.fields.map(({ name }) => name);

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
        if (typeof value === 'object' && value !== null) {
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

/**
 * This function can:
 * Set missing required fields to literals.
 * Set missing optional fields to null
 * Set missing -to-many relationships to null
 * Set missing dependent -to-one relationships to new objects
 * Do all of these recursively
 */
export const addMissingFields = <TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME,
  record: Partial<SerializedResource<Tables[TABLE_NAME]>>,
  {
    requiredFields = 'set',
    optionalFields = 'define',
    toManyRelationships = 'set',
    requiredRelationships = 'set',
    optionalRelationships = 'define',
  }: {
    readonly requiredFields?: 'define' | 'omit' | 'set';
    readonly optionalFields?: 'define' | 'omit' | 'set';
    readonly toManyRelationships?: 'define' | 'omit' | 'set';
    readonly requiredRelationships?: 'define' | 'omit' | 'set';
    readonly optionalRelationships?: 'define' | 'omit' | 'set';
  } = {}
): SerializedResource<Tables[TABLE_NAME]> =>
  f.var(defined(getModel(tableName)), (model) => ({
    // This is needed to preserve unknown fields
    ...record,
    ...(Object.fromEntries(
      filterArray(
        model.fields.map((field) =>
          (
            field.isRelationship
              ? relationshipIsToMany(field)
                ? toManyRelationships === 'omit' ||
                  field.type === 'many-to-many'
                : (field.isRequired
                    ? requiredRelationships
                    : optionalRelationships) === 'omit'
              : field.isRequired
              ? requiredFields
              : optionalFields
          )
            ? undefined
            : [
                field.name,
                field.isRelationship
                  ? relationshipIsToMany(field)
                    ? field.isDependent()
                      ? (
                          record[field.name as keyof typeof record] as
                            | RA<Partial<SerializedResource<AnySchema>>>
                            | undefined
                        )?.map((record) =>
                          addMissingFields(field.relatedModel.name, record, {
                            requiredFields,
                            optionalFields,
                            toManyRelationships,
                            requiredRelationships,
                            optionalRelationships,
                          })
                        ) ?? (toManyRelationships === 'set' ? [] : null)
                      : record[field.name as keyof typeof record] ?? null
                    : record[field.name as keyof typeof record] ??
                      (field.isDependent() &&
                      (field.isRequired
                        ? requiredRelationships === 'set'
                        : optionalRelationships === 'set')
                        ? addMissingFields(
                            field.relatedModel.name,
                            (record[
                              field.name as keyof typeof record
                            ] as Partial<SerializedResource<AnySchema>>) ?? {},
                            {
                              requiredFields,
                              optionalFields,
                              toManyRelationships,
                              requiredRelationships,
                              optionalRelationships,
                            }
                          )
                        : null)
                  : record[field.name as keyof typeof record] ??
                    (field.name === 'version'
                      ? 1
                      : (
                          field.isRequired
                            ? requiredFields === 'set'
                            : optionalFields === 'set'
                        )
                      ? parserFromType(field.type).value
                      : null),
              ]
        )
      )
    ) as SerializedResource<Tables[TABLE_NAME]>),
    /*
     * REFACTOR: convert all usages of this to camel case
     */
    resource_uri: record.resource_uri,
    // REFACTOR: consider replacing this with a symbol
    _tableName: tableName,
  }));

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
