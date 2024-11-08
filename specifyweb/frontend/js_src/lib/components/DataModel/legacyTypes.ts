/**
 * Type definitions for files that aren't yet converted to TypeScript
 */

import type { IR, RA } from '../../utils/types';
import type { BusinessRuleManager } from './businessRules';
import type {
  AnySchema,
  CommonFields,
  SerializedRecord,
  SerializedResource,
  TableFields,
} from './helperTypes';
import type { Collection, SpecifyTable } from './specifyTable';

/*
 * FEATURE: need to improve the typing to handle the following:
 *    Dynamic references
 *    Discrimination of union types
 * REFACTOR: Phase out usages of SpecifyResource in favor of SerializedResource
 */
export type SpecifyResource<SCHEMA extends AnySchema> = {
  readonly id: number;
  // FEATURE: store original values to know when changes were reverted
  readonly needsSaved: boolean;
  readonly cid: string;
  readonly populated: boolean;
  readonly specifyTable: SpecifyTable<SCHEMA>;
  readonly createdBy?: 'clone';
  readonly deleted: boolean;
  readonly parent?: SpecifyResource<SCHEMA>;
  readonly noBusinessRules: boolean;
  readonly changed?: {
    readonly [FIELD_NAME in TableFields<AnySchema>]?: number | string;
  };
  readonly collection: Collection<SCHEMA> | undefined;
  readonly businessRuleManager?: BusinessRuleManager<SCHEMA>;
  /*
   * Shorthand method signature is used to prevent
   * https://github.com/microsoft/TypeScript/issues/48339
   * More info: https://stackoverflow.com/a/55992840/8584605
   */
  /* eslint-disable @typescript-eslint/method-signature-style */
  get<
    FIELD_NAME extends
      | keyof CommonFields
      | keyof SCHEMA['fields']
      | keyof SCHEMA['toManyDependent']
      | keyof SCHEMA['toManyIndependent']
      | keyof SCHEMA['toOneDependent']
      | keyof SCHEMA['toOneIndependent'],
    VALUE extends (CommonFields &
      IR<never> &
      SCHEMA['fields'] &
      SCHEMA['toManyDependent'] &
      SCHEMA['toManyIndependent'] &
      SCHEMA['toOneDependent'] &
      SCHEMA['toOneIndependent'])[FIELD_NAME]
  >(
    fieldName: FIELD_NAME
    // eslint-disable-next-line functional/prefer-readonly-type
  ): [VALUE] extends [never]
    ? never
    : VALUE extends AnySchema
    ? VALUE extends null
      ? string | null
      : string
    : VALUE extends RA<AnySchema>
    ? string
    : VALUE;
  // Case-insensitive fetch of a -to-one resource
  rgetPromise<
    FIELD_NAME extends
      | keyof SCHEMA['toOneDependent']
      | keyof SCHEMA['toOneIndependent'],
    VALUE = (IR<never> &
      SCHEMA['toOneDependent'] &
      SCHEMA['toOneIndependent'])[FIELD_NAME]
  >(
    fieldName: FIELD_NAME,
    prePopulate?: boolean
  ): readonly [VALUE] extends readonly [never]
    ? never
    : Promise<
        VALUE extends AnySchema
          ? SpecifyResource<Exclude<VALUE, null>>
          : Exclude<VALUE, AnySchema>
      >;
  getRelated<
    FIELD_NAME extends
      | keyof SCHEMA['toOneDependent']
      | keyof SCHEMA['toOneIndependent'],
    VALUE = (IR<never> &
      SCHEMA['toOneDependent'] &
      SCHEMA['toOneIndependent'])[FIELD_NAME]
  >(
    fieldName: FIELD_NAME,
    options?: {
      readonly prePop?: boolean;
      readonly noBusinessRules?: boolean;
    }
  ): readonly [VALUE] extends readonly [never]
    ? never
    : Promise<
        VALUE extends AnySchema
          ? SpecifyResource<Exclude<VALUE, null>>
          : Exclude<VALUE, AnySchema>
      >;
  // Case-insensitive fetch of a -to-many resource
  rgetCollection<
    FIELD_NAME extends keyof (SCHEMA['toManyDependent'] &
      SCHEMA['toManyIndependent']),
    VALUE extends (SCHEMA['toManyDependent'] &
      SCHEMA['toManyIndependent'])[FIELD_NAME]
  >(
    fieldName: FIELD_NAME
  ): Promise<Collection<VALUE[number]>>;
  set<
    FIELD_NAME extends
      | keyof CommonFields
      | keyof SCHEMA['fields']
      | keyof SCHEMA['toManyDependent']
      | keyof SCHEMA['toManyIndependent']
      | keyof SCHEMA['toOneDependent']
      | keyof SCHEMA['toOneIndependent'],
    VALUE extends (CommonFields &
      IR<never> &
      SCHEMA['fields'] &
      SCHEMA['toManyDependent'] &
      SCHEMA['toManyIndependent'] &
      SCHEMA['toOneDependent'] &
      SCHEMA['toOneIndependent'])[FIELD_NAME]
  >(
    fieldName: FIELD_NAME,
    value: readonly [VALUE] extends readonly [never]
      ? never
      :
          | VALUE
          | (FIELD_NAME extends
              | keyof SCHEMA['toManyIndependent']
              | keyof SCHEMA['toOneIndependent']
              ? string
              : never)
          | (VALUE extends RA<AnySchema>
              ?
                  | Collection<VALUE[number]>
                  | RA<SerializedResource<VALUE[number]>>
                  | RA<SpecifyResource<VALUE[number]>>
              : null extends VALUE
              ?
                  | SerializedResource<Exclude<VALUE, null>>
                  | SpecifyResource<Exclude<VALUE, null>>
                  | null
              : SerializedResource<VALUE> | SpecifyResource<VALUE>),
    options?: { readonly silent: boolean }
  ): SpecifyResource<SCHEMA>;
  // Not type safe
  bulkSet(value: IR<unknown>): SpecifyResource<SCHEMA>;
  // Unsafe. Use getDependentResource instead whenever possible
  readonly dependentResources: IR<
    Collection<SCHEMA> | SpecifyResource<SCHEMA> | null | undefined
  >;
  getDependentResource<FIELD_NAME extends keyof SCHEMA['toOneDependent']>(
    fieldName: FIELD_NAME
  ):
    | SpecifyResource<Exclude<SCHEMA['toOneDependent'][FIELD_NAME], null>>
    | undefined;
  getDependentResource<FIELD_NAME extends keyof SCHEMA['toManyDependent']>(
    fieldName: FIELD_NAME
  ): Collection<SCHEMA['toManyDependent'][FIELD_NAME][number]> | undefined;
  addIndependentResources<FIELD_NAME extends keyof SCHEMA['toManyIndependent']>(
    fieldName: FIELD_NAME,
    resources: RA<
      SpecifyResource<SCHEMA['toManyDependent'][FIELD_NAME][number]>
    >
  ): RA<SpecifyResource<SCHEMA['toManyDependent'][FIELD_NAME][number]>>;
  removeIndependentResources<
    FIELD_NAME extends keyof SCHEMA['toManyIndependent']
  >(
    fieldName: FIELD_NAME,
    resources: RA<
      SpecifyResource<SCHEMA['toManyDependent'][FIELD_NAME][number]>
    >
  ): RA<SpecifyResource<SCHEMA['toManyDependent'][FIELD_NAME][number]>>;
  setIndependentResource<FIELD_NAME extends keyof SCHEMA['toOneIndependent']>(
    fieldName: FIELD_NAME,
    resource: SpecifyResource<
      Exclude<SCHEMA['toOneIndependent'][FIELD_NAME], null>
    > | null
  ): SpecifyResource<
    Exclude<SCHEMA['toOneIndependent'][FIELD_NAME], null>
  > | null;
  save(props?: {
    readonly onSaveConflict?: () => void;
    readonly errorOnAlreadySaving?: boolean;
  }): Promise<SpecifyResource<SCHEMA>>;
  destroy(): Promise<void>;
  fetch(): Promise<SpecifyResource<SCHEMA>>;
  viewUrl(): string;
  isNew(): boolean;
  isBeingInitialized(): boolean;
  clone(
    cloneAll: boolean,
    isBulkCarry?: boolean
  ): Promise<SpecifyResource<SCHEMA>>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  toJSON(): SerializedRecord<AnySchema>;
  getRelatedObjectCount(
    fieldName:
      | (string & keyof SCHEMA['toManyDependent'])
      | (string & keyof SCHEMA['toManyIndependent'])
  ): Promise<number | undefined>;
  url(): string;
  placeInSameHierarchy(
    resource: SpecifyResource<AnySchema>
  ): SpecifyResource<AnySchema> | undefined;
  on(
    eventName: string,
    callback: (...args: RA<never>) => void,
    thisArgument?: any
  ): void;
  once(eventName: string, callback: (...args: RA<never>) => void): void;
  off(eventName?: string, callback?: (...args: RA<never>) => void): void;
  trigger(eventName: string, ...args: RA<unknown>): void;
  /* eslint-enable @typescript-eslint/method-signature-style */
};
