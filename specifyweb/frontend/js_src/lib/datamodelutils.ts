import type { Tables } from './datamodel';
import type { SpecifyResource } from './legacytypes';
import {
  getResourceApiUrl,
  parseResourceUrl,
  resourceToJson,
} from './resource';
import { getModel } from './schema';
import type { IR, RA } from './types';
import { defined } from './types';
import { parserFromType } from './uiparse';

/**
 * The dataModel types in ./datamodel.ts were generated using this code
 * snippet.
 * After schema changes, uncomment it, run the regenerateSchema() function,
 * paste the content into ./datamodel.js and run Prettier on that file
 */
`
import { regenerate } from './tests/updatedatamodel';
// Call this function from the console once front-end is loaded
window.regenerateSchema = (): void => {
  document.body.textContent = regenerate();
};
`;

/**
 * Represents a schema for any table
 *
 * @remarks
 * This type is not meant for objects to be created directly of it
 * Instead, use it in place of "any" as a generic argument to
 * SpecifyResource, SpecifyModel, Collection, SerializedResource or
 * SerializedModel when you don't care about a particular table.
 *
 * When need to work with a particular schema, import the necessary
 * schema form ./datamodel.ts and use it in place of AnySchema
 *
 * Note: typing support is not ideal when using AnySchema, as false type errors
 * may occur, thus prefer using specific table schema (or union of schemas)
 * whenever possible. Alternatively, your type/function can accept
 * a generic argument that extends AnySchema
 */
export type AnySchema = {
  readonly tableName: keyof Tables;
  readonly fields: IR<string | number | boolean | null>;
  readonly toOneDependent: IR<AnySchema | null>;
  readonly toOneIndependent: IR<AnySchema | null>;
  readonly toManyDependent: IR<RA<AnySchema>>;
  readonly toManyIndependent: IR<RA<AnySchema>>;
};

/** A union of all field names of a given schema */
export type TableFields<SCHEMA extends AnySchema> = string &
  (
    | keyof SCHEMA['fields']
    | keyof SCHEMA['toOneDependent']
    | keyof SCHEMA['toOneIndependent']
    | keyof SCHEMA['toManyDependent']
    | keyof SCHEMA['toManyIndependent']
  );

/**
 * Represents any tree table schema
 *
 * @remarks
 * All tables that contain independent -to-one called "definitionItem"
 * Intended to be used in place of AnySchema when a tree table is needed,
 * but don't know/don't care which particular tree table
 *
 */
export type AnyTree = Extract<
  Tables[keyof Tables],
  {
    readonly toOneIndependent: {
      readonly definitionItem: AnySchema;
    };
  }
>;

/**
 * Filter table schemas down to schemas for tables whose names end with a
 * particular substring
 */
export type FilterTablesByEndsWith<ENDS_WITH extends string> = Tables[Extract<
  keyof Tables,
  `${string}${ENDS_WITH}`
>];

export const resourceTypeEndsWith = <ENDS_WITH extends string>(
  resource: SpecifyResource<AnySchema>,
  endsWith: ENDS_WITH
  // @ts-expect-error
): resource is SpecifyResource<FilterTablesByEndsWith<ENDS_WITH>> =>
  resource.specifyModel.name.endsWith(endsWith);

/**
 * A record set information object attached to resources when fetched in a
 * context of a RecordSet (the recordset=<ID> GET parameter was passed when
 * fetching the resource)
 *
 */
export type RecordSetInfo = {
  readonly index: number;
  readonly next: string | null;
  readonly previous: string | null;
  readonly recordsetid: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly total_count: number;
};

/**
 * Meta-fields present in all resources
 */
export type CommonFields = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly resource_uri: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly recordset_info?: RecordSetInfo;
  // TODO: This field is undefined for newly created resources. Improve typing
  readonly id: number;
};

/**
 * A representation of an object of a particular schema as received from the
 * back-end or returned by `resourceToJson(resource)`
 */
export type SerializedModel<SCHEMA extends AnySchema> = KeysToLowerCase<
  SerializedResource<SCHEMA>
>;

/**
 * Like SerializedModel, but keys are in camelCase instead of lowercase
 *
 * This allows IDE's grammar checker to detect typos and prevent bugs
 */
export type SerializedResource<SCHEMA extends AnySchema> = {
  readonly [KEY in
    | keyof CommonFields
    | keyof SCHEMA['fields']
    | keyof SCHEMA['toOneDependent']
    | keyof SCHEMA['toOneIndependent']
    | keyof SCHEMA['toManyDependent']
    | keyof SCHEMA['toManyIndependent']]: KEY extends keyof CommonFields
    ? CommonFields[KEY]
    : KEY extends keyof SCHEMA['fields']
    ? SCHEMA['fields'][KEY]
    : KEY extends keyof SCHEMA['toOneDependent']
    ?
        | Partial<
            SerializedResource<Exclude<SCHEMA['toOneDependent'][KEY], null>>
          >
        | Exclude<SCHEMA['toOneDependent'][KEY], SCHEMA>
    : KEY extends keyof SCHEMA['toOneIndependent']
    ? string | Exclude<SCHEMA['toOneIndependent'][KEY], SCHEMA>
    : KEY extends keyof SCHEMA['toManyDependent']
    ? RA<SerializedResource<SCHEMA['toManyDependent'][KEY][number]>>
    : KEY extends keyof SCHEMA['toManyIndependent']
    ? string
    : never;
};

/** Convert type's keys to lowercase */
export type KeysToLowerCase<DICTIONARY extends IR<unknown>> = {
  [KEY in keyof DICTIONARY as Lowercase<
    KEY & string
  >]: DICTIONARY[KEY] extends IR<unknown>
    ? KeysToLowerCase<DICTIONARY[KEY]>
    : DICTIONARY[KEY];
};

/** Like resource.toJSON(), but keys are converted to camel case */
export const serializeResource = <SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA> | SerializedModel<SCHEMA>
): SerializedResource<SCHEMA> =>
  serializeModel<SCHEMA>(
    typeof resource.toJSON === 'function'
      ? resourceToJson(resource as SpecifyResource<SCHEMA>)
      : (resource as SerializedModel<SCHEMA>),
    (resource as SpecifyResource<SCHEMA>)?.specifyModel?.name
  );

const specialFields = new Set(['id', 'resource_uri', 'recordset_info']);

/** Recursive helper for serializeResource */
function serializeModel<SCHEMA extends AnySchema>(
  resource: SerializedModel<SCHEMA>,
  tableName?: keyof Tables
): SerializedResource<SCHEMA> {
  const model = defined(
    getModel(
      defined(
        tableName ??
          parseResourceUrl(resource.resource_uri?.toString() ?? '')?.[0]
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
        if (typeof camelFieldName === 'undefined') {
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
            typeof field === 'undefined' || !field.isRelationship
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
    ) as SerializedResource<SCHEMA>
  );
}

/** Set missing required fields to literals. Set missing optional fields to null */
export const addMissingFields = <SCHEMA extends AnySchema>(
  tableName: SCHEMA['tableName'],
  record: Partial<SerializedResource<SCHEMA>>,
  setOptionalToo = false
): SerializedResource<SCHEMA> => ({
  ...(Object.fromEntries(
    defined(getModel(tableName)).literalFields.map(
      ({ name, isRequired, type }) => [
        name,
        isRequired || setOptionalToo ? parserFromType(type).value : null,
      ]
    )
  ) as SerializedResource<SCHEMA>),
  resource_uri: getResourceApiUrl(tableName, 0),
  ...record,
});

/** Recursively convert keys on an object to lowercase */
export const keysToLowerCase = <OBJECT extends IR<unknown>>(
  resource: OBJECT
): KeysToLowerCase<OBJECT> =>
  Object.fromEntries(
    Object.entries(resource).map(([key, value]) => [
      key.toLowerCase(),
      Array.isArray(value)
        ? value.map(keysToLowerCase)
        : typeof value === 'object' && value !== null
        ? keysToLowerCase(value as IR<unknown>)
        : value,
    ])
  ) as unknown as KeysToLowerCase<OBJECT>;
