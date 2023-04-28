/**
 * Type definitions for files that aren't yet converted to TypeScript
 */

import type { IR, RA } from '../../utils/types';
import type {
  AnySchema,
  CommonFields,
  SerializedModel,
  SerializedResource,
} from './helperTypes';
import type { SaveBlockers } from './saveBlockers';
import type { Collection, SpecifyModel } from './specifyModel';

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
  readonly noValidation?: boolean;
  readonly populated: boolean;
  readonly specifyModel: SpecifyModel<SCHEMA>;
  readonly saveBlockers?: Readonly<SaveBlockers<SCHEMA>>;
  readonly parent?: SpecifyResource<SCHEMA>;
  readonly noBusinessRules: boolean;
  readonly collection: {
    readonly related: SpecifyResource<SCHEMA>;
  };
  readonly businessRuleMgr?: {
    readonly pending: Promise<void>;
    readonly checkField: (fieldName: string) => Promise<void>;
  };
  /*
   * Shorthand method signature is used to prevent
   * https://github.com/microsoft/TypeScript/issues/48339
   * More info: https://stackoverflow.com/a/55992840/8584605
   */
  /* eslint-disable @typescript-eslint/method-signature-style */
  /* jscpd:ignore-start*/
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
  /* jscpd:ignore-end*/
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
  /* jscpd:ignore-start*/
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
  /* jscpd:ignore-end*/ getDependentResource<
    FIELD_NAME extends keyof SCHEMA['toOneDependent']
  >(
    fieldName: FIELD_NAME
  ):
    | SpecifyResource<Exclude<SCHEMA['toOneDependent'][FIELD_NAME], null>>
    | undefined;
  getDependentResource<FIELD_NAME extends keyof SCHEMA['toManyDependent']>(
    fieldName: FIELD_NAME
  ): Collection<SCHEMA['toManyDependent'][FIELD_NAME][number]> | undefined;
  save(props?: {
    readonly onSaveConflict?: () => void;
    readonly errorOnAlreadySaving?: boolean;
  }): Promise<SpecifyResource<SCHEMA>>;
  destroy(): Promise<void>;
  fetch(): Promise<SpecifyResource<SCHEMA>>;
  viewUrl(): string;
  isNew(): boolean;
  clone(cloneAll: boolean): Promise<SpecifyResource<SCHEMA>>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  toJSON(): SerializedModel<AnySchema>;
  getRelatedObjectCount(
    fieldName:
      | (string & keyof SCHEMA['toManyDependent'])
      | (string & keyof SCHEMA['toManyIndependent'])
  ): Promise<number | undefined>;
  format(): Promise<string>;
  url(): string;
  placeInSameHierarchy(
    resource: SpecifyResource<AnySchema>
  ): SpecifyResource<AnySchema> | undefined;
  on(eventName: string, callback: (...args: RA<never>) => void): void;
  once(eventName: string, callback: (...args: RA<never>) => void): void;
  off(eventName?: string, callback?: (...args: RA<never>) => void): void;
  trigger(eventName: string, ...args: RA<unknown>): void;
  /* eslint-enable @typescript-eslint/method-signature-style */
};
