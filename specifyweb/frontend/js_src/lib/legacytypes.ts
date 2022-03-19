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
 * TODO:
 *  need to improve the typing to handle the following:
 *    Dynamic references
 *    Discrimination of union types
 *  Phase out usages of SpecifyResource in favor of SerializedResource
 */
export type SpecifyResource<SCHEMA extends AnySchema> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly toJSON: () => SerializedModel<AnySchema>;
  readonly id: number;
  readonly needsSaved: boolean;
  readonly cid: string;
  get: <
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
  ) => [VALUE] extends [never]
    ? never
    : VALUE extends AnySchema
    ? VALUE extends null
      ? string | null
      : string
    : VALUE extends RA<AnySchema>
    ? string
    : VALUE;
  // Case-insensitive fetch of a -to-one resource
  rgetPromise: <
    FIELD_NAME extends
      | keyof SCHEMA['toOneDependent']
      | keyof SCHEMA['toOneIndependent'],
    VALUE = (IR<never> &
      SCHEMA['toOneDependent'] &
      SCHEMA['toOneIndependent'])[FIELD_NAME]
  >(
    fieldName: FIELD_NAME,
    prePopulate?: boolean
  ) => [VALUE] extends [never]
    ? never
    : Promise<
        VALUE extends AnySchema
          ? SpecifyResource<Exclude<VALUE, null>>
          : never | Exclude<VALUE, AnySchema>
      >;
  // Case-insensitive fetch of a -to-many resource
  rgetCollection: <
    FIELD_NAME extends keyof (SCHEMA['toManyDependent'] &
      SCHEMA['toManyIndependent']),
    VALUE extends (SCHEMA['toManyDependent'] &
      SCHEMA['toManyIndependent'])[FIELD_NAME]
  >(
    fieldName: FIELD_NAME,
    prePopulate?: boolean
  ) => Promise<Collection<VALUE[number]>>;
  readonly set: <
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
  ) => SpecifyResource<SCHEMA>;
  getDependentResource: (<FIELD_NAME extends keyof SCHEMA['toOneDependent']>(
    fieldName: FIELD_NAME
  ) =>
    | SpecifyResource<Exclude<SCHEMA['toOneDependent'][FIELD_NAME], null>>
    | undefined) &
    (<FIELD_NAME extends keyof SCHEMA['toManyDependent']>(
      fieldName: FIELD_NAME
    ) => Collection<SCHEMA['toManyDependent'][FIELD_NAME][number]> | undefined);
  readonly noValidation?: boolean;
  readonly save: () => Promise<void>;
  readonly fetchPromise: () => Promise<SpecifyResource<SCHEMA>>;
  readonly populated: boolean;
  readonly destroy: () => Promise<void>;
  readonly viewUrl: () => string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly Resource: new () => SpecifyResource<SCHEMA>;
  readonly isNew: () => boolean;
  readonly clone: () => SpecifyResource<SCHEMA>;
  readonly getRelatedObjectCount: (
    fieldName:
      | (string & keyof SCHEMA['toManyDependent'])
      | (string & keyof SCHEMA['toManyIndependent'])
  ) => Promise<number | undefined>;
  readonly specifyModel: SpecifyModel<SCHEMA>;
  readonly saveBlockers: Readonly<SaveBlockers<SCHEMA>>;
  readonly parent?: SpecifyResource<SCHEMA>;
  readonly format: () => Promise<string>;
  readonly url: () => string;
  recordsetid?: number;
  noBusinessRules: boolean;
  readonly placeInSameHierarchy: (resource: SpecifyResource<AnySchema>) => void;
  readonly collection: {
    readonly related: SpecifyResource<SCHEMA>;
  };
  readonly on: (
    eventName: string,
    callback: (...args: RA<never>) => void
  ) => void;
  readonly once: (
    eventName: string,
    callback: (...args: RA<never>) => void
  ) => void;
  readonly off: (
    eventName?: string,
    callback?: (...args: RA<never>) => void
  ) => void;
  readonly trigger: (eventName: string, ...args: RA<unknown>) => void;
  readonly businessRuleMgr: {
    readonly pending: Promise<void>;
    readonly checkField: (fieldName: string) => Promise<void>;
  };
};
