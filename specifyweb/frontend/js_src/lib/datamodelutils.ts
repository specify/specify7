import type { Tables } from './datamodel';
import type { SpecifyResource } from './legacytypes';
import { parseResourceUrl } from './resourceapi';
import { getModel } from './schema';
import type { IR, RA } from './types';
import { defined } from './types';

/* The dataModel types types were generated using this code snippet: */
/* eslint-disable multiline-comment-style*/
/* ;
import { schema } from './schema';

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
          tableName,
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
              typeof fields === 'string'
                ? fields
                : fields.length === 0
                ? 'RR<never, never>'
                : `{${fields}}`
            }`
        )
        .join(';')}}`;
    })
    .join(';');
  return `${index}${models}`;
}

*/
/* eslint-enable multiline-comment-style*/

export type AnySchema = {
  readonly tableName: keyof Tables;
  readonly fields: IR<unknown>;
  readonly toOneDependent: IR<AnySchema | null>;
  readonly toOneIndependent: IR<AnySchema | null>;
  readonly toManyDependent: IR<RA<AnySchema>>;
  readonly toManyIndependent: IR<RA<AnySchema>>;
};

export type ToMany = AnySchema['toManyDependent'];

// All tables that contain independent -to-one called "definitionItem"
export type AnyTree = Extract<
  Tables[keyof Tables],
  {
    readonly toOneIndependent: {
      readonly definitionItem: AnySchema;
    };
  }
>;

export type FilterTablesByEndsWith<ENDS_WITH extends string> = Tables[Extract<
  keyof Tables,
  `${string}${ENDS_WITH}`
>];

export type CommonFields = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly resource_uri: string;
  readonly id: number;
};

export type SerializedModel<SCHEMA extends AnySchema> = KeysToLowerCase<
  SerializedResource<SCHEMA>
>;

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
        | Exclude<SCHEMA['toOneDependent'][KEY], AnySchema>
    : KEY extends keyof SCHEMA['toOneIndependent']
    ? string | Exclude<SCHEMA['toOneIndependent'][KEY], AnySchema>
    : KEY extends keyof SCHEMA['toManyDependent']
    ? RA<SerializedResource<SCHEMA['toManyDependent'][KEY][number]>>
    : KEY extends keyof SCHEMA['toManyIndependent']
    ? string
    : never;
};

export type KeysToLowerCase<DICTIONARY extends IR<unknown>> = {
  [KEY in keyof DICTIONARY as Lowercase<KEY & string>]: DICTIONARY[KEY];
};

/** Like resource.toJSON(), but keys are converted to camel case */
export const serializeResource = <SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA>
): SerializedResource<SCHEMA> =>
  serializeModel<SCHEMA>(
    resource?.toJSON() ?? resource,
    resource?.specifyModel.name
  );

const serializeModel = <SCHEMA extends AnySchema>(
  resource: SerializedModel<SCHEMA>,
  tableName?: keyof Tables
): SerializedResource<SCHEMA> =>
  Object.fromEntries(
    Object.entries(resource).map(([lowercaseFieldName, value]) => [
      defined(
        getModel(
          defined(tableName ?? parseResourceUrl(resource.resource_uri)?.[0])
        )
      ).fields.find(({ name }) => name.toLowerCase() === lowercaseFieldName)
        ?.name ?? lowercaseFieldName,
      typeof value === 'object' && value !== null
        ? Array.isArray(value)
          ? value.map((value) => serializeModel(value))
          : serializeModel(value as SerializedModel<AnySchema>)
        : value,
    ])
  ) as SerializedResource<SCHEMA>;
