import type { SpecifyResource } from './legacytypes';
import { IR, RA } from './types';
import {
  Geography,
  GeographyTreeDef,
  GeologicTimePeriod,
  GeologicTimePeriodTreeDef,
  LithoStrat,
  LithoStratTreeDef,
  Storage,
  StorageTreeDef,
  Tables,
  Taxon,
  TaxonTreeDef,
} from './datamodel';

/* The dataModel types types were generated using this code snippet: */
/* eslint-disable multiline-comment-style*/
/* ;
import schema from './schema';

const javaTypeToTypeScript = {
  text: 'string',
  'java.lang.String': 'string',
  'java.lang.Byte': 'number',
  'java.lang.Short': 'number',
  'java.lang.Integer': 'number',
  'java.lang.Float': 'number',
  'java.lang.Double': 'number',
  'java.lang.Long': 'number',
  'java.math.BigDecimal': 'number',
  'java.lang.Boolean': 'boolean',
  'java.sql.Timestamp': 'string',
  'java.util.Calendar': 'string',
  'java.util.Date': 'string',
} as const;

function regenerate() {
  const index = `export type Tables = {${Object.keys(schema.models).map(
    (tableName) => `readonly ${tableName}: ${tableName}`
  )}};`;
  const models = Object.entries(schema.models)
    .map(([tableName, { fields }]) => {
      const groups = fields.reduce(
        (
          model,
          {
            isRequired,
            isRelationship,
            dependent,
            relatedModelName,
            type,
            name,
          }
        ) => {
          const field = `readonly ${name}:${
            isRelationship
              ? `${type.endsWith('-to-many') ? 'RA<' : ''}${relatedModelName}${
                  type.endsWith('-to-many') ? '>' : ''
                }`
              : javaTypeToTypeScript[type]
          }${
            (isRelationship && type.endsWith('-to-many')) || isRequired
              ? ''
              : '|null'
          };`;
          model[
            isRelationship
              ? `${type.endsWith('-to-many') ? 'toMany' : 'toOne'}${
                  dependent ? 'Dependent' : 'Independent'
                }`
              : 'fields'
          ] += field;
          return model;
        },
        {
          fields: '',
          toOneDependent: '',
          toOneIndependent: '',
          toManyDependent: '',
          toManyIndependent: '',
        }
      );
      return `export type ${tableName} = TableSchema & {${Object.entries(groups)
        .map(
          ([group, fields]) =>
            `readonly ${group}: ${
              fields.length === 0 ? 'IR<never>' : `{${fields}}`
            }`
        )
        .join(';')}}`;
    })
    .join(';');
  return `${index}${models}`;
}

*/
/* eslint-enable multiline-comment-style*/

export type SerializedModel<SCHEMA extends AnySchema> = UnFetchedRelationships<
  SCHEMA['toOneIndependent']
> & {
  [KEY in keyof SCHEMA['toManyDependent']]: RA<
    SerializedModel<SCHEMA['toManyDependent'][KEY][number]>
  >;
} & SCHEMA['toOneDependent'] &
  SCHEMA['fields'] & {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly resource_uri: string;
    readonly id: number;
  };

/** Like resource.toJSON(), but keys are converted to camel case */
export const serializeModel = <SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA>
): SerializedModel<SCHEMA> =>
  // @ts-expect-error
  Object.fromEntries(
    Object.entries(resource?.toJSON() ?? resource).map(
      ([lowercaseFieldName, value]) => [
        resource.specifyModel.fields.find(
          ({ name }) => name.toLowerCase() === lowercaseFieldName
        )?.name ?? lowercaseFieldName,
        typeof value === 'object' && value !== null
          ? serializeModel(value)
          : value,
      ]
    )
  );

/** Resolve table name from table schema */
export type TableName<SCHEMA extends AnySchema> = keyof {
  [TABLE_NAME in keyof Tables as Tables[TABLE_NAME] extends SCHEMA
    ? TABLE_NAME
    : never]: Tables[TABLE_NAME];
};

/** Replace relationship objects with api URLs */
export type UnFetchedRelationships<RELATIONSHIPS extends IR<AnySchema | null>> =
  {
    [KEY in keyof RELATIONSHIPS]:
      | string
      | Exclude<RELATIONSHIPS[KEY], AnySchema>;
  };

export type AnySchema = {
  readonly fields: IR<string | number | boolean | null>;
  readonly toOneDependent: IR<AnySchema | null>;
  readonly toOneIndependent: IR<AnySchema | null>;
  readonly toManyDependent: IR<RA<AnySchema>>;
  readonly toManyIndependent: IR<RA<AnySchema>>;
};

export type AnyTree = AnySchema &
  (Geography | Storage | Taxon | GeologicTimePeriod | LithoStrat);

export type AnyTreeDef = AnySchema &
  (
    | GeographyTreeDef
    | GeologicTimePeriodTreeDef
    | LithoStratTreeDef
    | StorageTreeDef
    | TaxonTreeDef
  );

export type KeysToLowerCase<T extends IR<unknown>> = {
  [KEY in keyof T as Lowercase<string & KEY>]: T[KEY];
};

/**
 * Back-end seems to accept keys in lower-case format only, so have to convert
 * them back
 */
export const keysToLowerCase = <T extends IR<unknown>>(object: T) =>
  Object.fromEntries(
    Object.entries(object).map(([key, value]) => [
      key.toLowerCase(),
      typeof value === 'object' && value !== null
        ? Array.isArray(value)
          ? value.map((item) => keysToLowerCase(item))
          : keysToLowerCase(value as IR<unknown>)
        : value,
    ])
  );
