import type {
  AnySchema,
  CommonFields,
  SerializedModel,
  SerializedResource,
} from './datamodelutils';
import type { SaveBlockers } from './saveblockers';
import type { Collection, SpecifyModel } from './specifymodel';
import type { IR, RA } from './types';

/*
 * TODO: need to improve the typing to handle the following:
 *    Dynamic references
 *    Discrimination of union types
 * TODO: Phase out usages of SpecifyResource in favor of SerializedResource
 */
export type SpecifyResource<SCHEMA extends AnySchema> = {
  readonly id: number;
  readonly needsSaved: boolean;
  readonly cid: string;
  /*
   * Shorthand method signature is used to prevent
   * https://github.com/microsoft/TypeScript/issues/48339
   * More info: https://stackoverflow.com/a/55992840/8584605
   */
  /* eslint-disable @typescript-eslint/method-signature-style */
  get<
    FIELD_NAME extends
      | keyof SCHEMA['fields']
      | keyof SCHEMA['toOneDependent']
      | keyof SCHEMA['toOneIndependent']
      | keyof SCHEMA['toManyDependent']
      | keyof SCHEMA['toManyIndependent']
      | keyof CommonFields,
    VALUE extends (IR<never> &
      SCHEMA['toOneDependent'] &
      SCHEMA['toOneIndependent'] &
      SCHEMA['toManyDependent'] &
      SCHEMA['toManyIndependent'] &
      SCHEMA['fields'] &
      CommonFields)[FIELD_NAME]
  >(
    fieldName: FIELD_NAME
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
  ): [VALUE] extends [never]
    ? never
    : Promise<
        VALUE extends AnySchema
          ? SpecifyResource<Exclude<VALUE, null>>
          : never | Exclude<VALUE, AnySchema>
      >;
  // Case-insensitive fetch of a -to-many resource
  rgetCollection<
    FIELD_NAME extends keyof (SCHEMA['toManyDependent'] &
      SCHEMA['toManyIndependent']),
    VALUE extends (SCHEMA['toManyDependent'] &
      SCHEMA['toManyIndependent'])[FIELD_NAME]
  >(
    fieldName: FIELD_NAME,
    prePopulate?: boolean
  ): Promise<Collection<VALUE[number]>>;
  settingDefaultValues: (callback: () => void) => void;
  set<
    FIELD_NAME extends
      | keyof SCHEMA['fields']
      | keyof SCHEMA['toOneDependent']
      | keyof SCHEMA['toOneIndependent']
      | keyof SCHEMA['toManyDependent']
      | keyof SCHEMA['toManyIndependent']
      | keyof CommonFields,
    VALUE extends (IR<never> &
      SCHEMA['toOneDependent'] &
      SCHEMA['toOneIndependent'] &
      SCHEMA['toManyDependent'] &
      SCHEMA['toManyIndependent'] &
      SCHEMA['fields'] &
      CommonFields)[FIELD_NAME]
  >(
    fieldName: FIELD_NAME,
    value: [VALUE] extends [never]
      ? never
      :
          | VALUE
          | (VALUE extends RA<AnySchema>
              ?
                  | Collection<VALUE[number]>
                  | RA<SerializedResource<VALUE[number]>>
                  | RA<SpecifyResource<VALUE[number]>>
              : VALUE extends null
              ?
                  | SpecifyResource<Exclude<VALUE, null>>
                  | SerializedResource<Exclude<VALUE, null>>
                  | null
              : SpecifyResource<VALUE> | SerializedResource<VALUE>)
          | (FIELD_NAME extends
              | keyof SCHEMA['toOneIndependent']
              | keyof SCHEMA['toManyIndependent']
              ? string
              : never)
  ): SpecifyResource<SCHEMA>;
  getDependentResource<FIELD_NAME extends keyof SCHEMA['toOneDependent']>(
    fieldName: FIELD_NAME
  ):
    | SpecifyResource<Exclude<SCHEMA['toOneDependent'][FIELD_NAME], null>>
    | undefined;
  getDependentResource<FIELD_NAME extends keyof SCHEMA['toManyDependent']>(
    fieldName: FIELD_NAME
  ): Collection<SCHEMA['toManyDependent'][FIELD_NAME][number]> | undefined;
  readonly noValidation?: boolean;
  save(): Promise<void>;
  destroy(): Promise<void>;
  fetch(): Promise<SpecifyResource<SCHEMA>>;
  readonly populated: boolean;
  viewUrl(): string;
  isNew(): boolean;
  clone(): SpecifyResource<SCHEMA>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  toJSON(): SerializedModel<AnySchema>;
  getRelatedObjectCount(
    fieldName:
      | (string & keyof SCHEMA['toManyDependent'])
      | (string & keyof SCHEMA['toManyIndependent'])
  ): Promise<number | undefined>;
  readonly specifyModel: SpecifyModel<SCHEMA>;
  readonly saveBlockers: Readonly<SaveBlockers<SCHEMA>>;
  readonly parent?: SpecifyResource<SCHEMA>;
  format(): Promise<string>;
  url(): string;
  recordsetid?: number;
  noBusinessRules: boolean;
  placeInSameHierarchy(resource: SpecifyResource<AnySchema>): void;
  readonly collection: {
    readonly related: SpecifyResource<SCHEMA>;
  };
  on(eventName: string, callback: (...args: RA<never>) => void): void;
  once(eventName: string, callback: (...args: RA<never>) => void): void;
  off(eventName?: string, callback?: (...args: RA<never>) => void): void;
  trigger(eventName: string, ...args: RA<unknown>): void;
  readonly businessRuleMgr: {
    readonly pending: Promise<void>;
    checkField(fieldName: string): Promise<void>;
  };
  /* eslint-enable @typescript-eslint/method-signature-style */
};
