import type { IR, RA, ValueOf } from '../../utils/types';
import type { Preparation, Tables } from './types';

/**
 * Represents a schema for any table
 *
 * @remarks
 * This type is not meant for objects to be created directly of it.
 * Instead, use it in place of "any" as a generic argument to
 * SpecifyResource, SpecifyTable, Collection, SerializedResource or
 * SerializedRecord when you don't care about a particular table.
 *
 * When need to work with a particular schema, import the necessary
 * schema form ./dataModel.ts and use it in place of AnySchema
 *
 * Note: typing support is not ideal when using AnySchema, as false type errors
 * may occur, thus prefer using specific table schema (or union of schemas)
 * whenever possible. Alternatively, your type/function can accept
 * a generic argument that extends AnySchema
 */
export type AnySchema = {
  readonly tableName: keyof Tables;
  readonly fields: IR<boolean | number | string | null>;
  readonly toOneDependent: IR<AnySchema | null>;
  readonly toOneIndependent: IR<AnySchema | null>;
  readonly toManyDependent: IR<RA<AnySchema>>;
  readonly toManyIndependent: IR<RA<AnySchema>>;
};

/** A union of all field names of a given schema */
export type TableFields<SCHEMA extends AnySchema> = string &
  (
    | keyof SCHEMA['fields']
    | keyof SCHEMA['toManyDependent']
    | keyof SCHEMA['toManyIndependent']
    | keyof SCHEMA['toOneDependent']
    | keyof SCHEMA['toOneIndependent']
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
  ValueOf<Tables>,
  {
    readonly toOneIndependent: {
      readonly definitionItem: AnySchema;
    };
  }
>;

export type AnyInteractionPreparation = Extract<
  ValueOf<Tables>,
  {
    readonly fields: {
      readonly quantity: number | null;
    };
  } & {
    readonly toOneIndependent: {
      readonly preparation: Preparation | null;
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

/**
 * Meta-fields present in all resources
 */
export type CommonFields = {
  // BUG: These fields are undefined for newly created resources. Improve typing
  readonly resource_uri: string;
  readonly id: number;
};

/**
 * A representation of an object of a particular schema as received from the
 * back-end or returned by `resourceToJson(resource)`
 */
export type SerializedRecord<SCHEMA extends AnySchema> = KeysToLowerCase<
  Omit<SerializedResource<SCHEMA>, '_tableName'>
>;

/**
 * Like SerializedRecord, but keys are in camelCase instead of lowercase
 *
 * This allows IDE's grammar checker to detect typos and prevent bugs
 */
export type SerializedResource<SCHEMA extends AnySchema> = {
  readonly _tableName: SCHEMA['tableName'];
} & {
  readonly [KEY in
    | keyof CommonFields
    | keyof SCHEMA['fields']
    | keyof SCHEMA['toManyDependent']
    | keyof SCHEMA['toManyIndependent']
    | keyof SCHEMA['toOneDependent']
    | keyof SCHEMA['toOneIndependent']]: KEY extends keyof CommonFields
    ? CommonFields[KEY]
    : KEY extends keyof SCHEMA['fields']
      ? SCHEMA['fields'][KEY]
      : KEY extends keyof SCHEMA['toOneDependent']
        ? Partial<
            SerializedResource<Exclude<SCHEMA['toOneDependent'][KEY], null>>
          > | null extends SCHEMA['toOneDependent'][KEY]
          ? null
          : never
        : KEY extends keyof SCHEMA['toOneIndependent']
          ? null extends SCHEMA['toOneIndependent'][KEY]
            ? string | null
            : string
          : KEY extends keyof SCHEMA['toManyDependent']
            ? RA<SerializedResource<SCHEMA['toManyDependent'][KEY][number]>>
            : KEY extends keyof SCHEMA['toManyIndependent']
              ? string
              : never;
};

/** Convert type's keys to lowercase */
export type KeysToLowerCase<DICTIONARY extends IR<unknown>> = {
  readonly [KEY in keyof DICTIONARY as Lowercase<
    KEY & string
  >]: DICTIONARY[KEY] extends IR<unknown>
    ? KeysToLowerCase<DICTIONARY[KEY]>
    : DICTIONARY[KEY] extends RA<unknown>
      ? RA<
          DICTIONARY[KEY][number] extends IR<unknown>
            ? KeysToLowerCase<DICTIONARY[KEY][number]>
            : DICTIONARY[KEY][number]
        >
      : DICTIONARY[KEY];
};
