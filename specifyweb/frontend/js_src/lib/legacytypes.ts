import type {
  AnySchema,
  AnyTree,
  AnyTreeDef,
  KeysToLowerCase,
  TableName,
  UnFetchedRelationships,
} from './datamodelutils';
import type SaveBlockers from './saveblockers';
import schema from './schema';
import type { Collection, default as SpecifyModel } from './specifymodel';
import type { IR, RA, RR } from './types';

export type SpecifyResource<SCHEMA extends AnySchema> = {
  readonly attributes: IR<never> &
    KeysToLowerCase<
      UnFetchedRelationships<SCHEMA['toOneIndependent']> &
        UnFetchedRelationships<SCHEMA['toOneDependent']> &
        SCHEMA['fields']
    > & {
      readonly resource_uri: string;
      readonly id: number;
    };
  readonly toJSON: () => IR<never> &
    KeysToLowerCase<
      UnFetchedRelationships<SCHEMA['toOneIndependent']> &
        SCHEMA['toManyDependent'] &
        SCHEMA['toOneDependent'] &
        SCHEMA['fields']
    > & {
      readonly resource_uri: string;
      readonly id: number;
    };
  readonly id: number;
  readonly needsSaved: boolean;
  readonly cid: string;
  get: <
    FIELD_NAME extends
      | keyof SCHEMA['fields']
      | keyof SCHEMA['toOneIndependent']
      | keyof SCHEMA['toOneDependent']
      | keyof SCHEMA['toManyIndependent']
      | keyof SCHEMA['toManyDependent']
      | 'resource_uri'
      | 'id',
    VALUE extends (IR<never> &
      SCHEMA['toOneIndependent'] &
      SCHEMA['toOneDependent'] &
      SCHEMA['toManyIndependent'] &
      SCHEMA['toManyDependent'] &
      SCHEMA['fields'] & {
        readonly resource_uri: string;
        readonly id: number;
      })[FIELD_NAME]
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
  rget: <
    FIELD_NAME extends
      | keyof SCHEMA['toOneIndependent']
      | keyof SCHEMA['toOneDependent'],
    VALUE extends (IR<never> &
      SCHEMA['toOneIndependent'] &
      SCHEMA['toOneDependent'])[FIELD_NAME]
  >(
    fieldName: FIELD_NAME
  ) => [VALUE] extends [never]
    ? never
    : Promise<
        SpecifyResource<Exclude<VALUE, null>> | Exclude<VALUE, AnySchema>
      >;
  // Case-insensitive fetch of a -to-many resource
  rgetCollection: <
    FIELD_NAME extends
      | keyof SCHEMA['toManyIndependent']
      | keyof SCHEMA['toManyDependent'],
    VALUE extends (IR<never> &
      SCHEMA['toManyIndependent'] &
      SCHEMA['toManyDependent'])[FIELD_NAME]
  >(
    fieldName: FIELD_NAME
  ) => [VALUE] extends [never]
    ? never
    : Promise<Collection<SpecifyResource<Exclude<VALUE, null>[number]>>>;
  readonly set: <
    FIELD_NAME extends
      | keyof SCHEMA['fields']
      | keyof SCHEMA['toOneIndependent']
      | keyof SCHEMA['toOneDependent']
      | keyof SCHEMA['toManyIndependent']
      | keyof SCHEMA['toManyDependent']
      | 'resource_uri'
      | 'id',
    VALUE extends (IR<never> &
      SCHEMA['toOneIndependent'] &
      SCHEMA['toOneDependent'] & {
        [KEY in keyof SCHEMA['toManyDependent']]: RA<
          SpecifyResource<SCHEMA['toManyDependent'][KEY][number]>
        >;
      } & RR<keyof SCHEMA['toManyDependent'], string> &
      SCHEMA['fields'] & {
        readonly resource_uri: string;
        readonly id: number;
      })[FIELD_NAME]
  >(
    fieldName: FIELD_NAME,
    value: VALUE
  ) => SpecifyResource<SCHEMA>;
  readonly save: () => Promise<void>;
  readonly fetch: () => Promise<SpecifyResource<SCHEMA>>;
  readonly fetchIfNotPopulated: () => Promise<SpecifyResource<SCHEMA>>;
  readonly populated: boolean;
  readonly destroy: () => Promise<void>;
  readonly viewUrl: () => string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly Resource: new () => SpecifyResource<SCHEMA>;
  readonly isNew: () => boolean;
  readonly clone: () => SpecifyResource<SCHEMA>;
  readonly specifyModel: Readonly<SpecifyModel>;
  readonly saveBlockers: Readonly<SaveBlockers<SCHEMA>>;
  readonly parent?: SpecifyResource<SCHEMA>;
  readonly format: () => Promise<string>;
  readonly url: () => string;
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
  };
};

const a = new schema.models.SpQuery.LazyCollection({ filters: { id: 1 } });
a.fetch().then(({ models: [model] }) => {
  model.set('fields', []);
});

export type GetTreeDefinition<SCHEMA extends AnyTreeDef> = (
  tableName: TableName<AnyTree>
) => Promise<SpecifyResource<SCHEMA>>;
