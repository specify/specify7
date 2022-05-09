import { ajax } from './ajax';
import type { Tables } from './datamodel';
import type {
  AnySchema,
  CommonFields,
  SerializedModel,
  SerializedResource,
} from './datamodelutils';
import { serializeResource } from './datamodelutils';
import { f } from './functools';
import { formatUrl } from './querystring';
import { parseResourceUrl } from './resource';
import { schema } from './schema';
import type { IR, RA, RR } from './types';
import { defined, filterArray } from './types';

export type CollectionFetchFilters<SCHEMA extends AnySchema> = {
  readonly limit: number;
  readonly offset?: number;
  readonly domainFilter?: boolean;
  readonly orderBy?:
    | keyof SCHEMA['fields']
    | keyof CommonFields
    | `-${string & keyof SCHEMA['fields']}`
    | `-${string & keyof CommonFields}`;
} & Partial<
  Exclude<SCHEMA['fields'], 'null'> &
    RR<
      keyof (SCHEMA['toOneIndependent'] &
        SCHEMA['toOneDependent'] &
        SCHEMA['toManyIndependent'] &
        SCHEMA['toManyDependent']),
      number
    >
>;

export const DEFAULT_FETCH_LIMIT = 20;

export type SerializedCollection<SCHEMA extends AnySchema> = {
  readonly records: RA<SerializedResource<SCHEMA>>;
  readonly totalCount: number;
};

/**
 * Fetch a collection of resources from the back-end. Can also provide filters
 */
export const fetchCollection = async <
  TABLE_NAME extends keyof Tables,
  SCHEMA extends Tables[TABLE_NAME]
>(
  tableName: TABLE_NAME,
  // Basic filters. Type-safe
  filters: CollectionFetchFilters<SCHEMA>,
  /**
   * Advanced filters, not type-safe.
   *
   * Can query relationships by separating fields with "__"
   * Can query partial dates (e.g. catalogedDate__year=2030)
   * More info: https://docs.djangoproject.com/en/4.0/topics/db/queries/
   */
  advancedFilters: IR<string | number> = {}
): Promise<SerializedCollection<SCHEMA>> =>
  ajax<{
    readonly meta: {
      readonly limit: number;
      readonly offset: number;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      readonly total_count: number;
    };
    readonly objects: RA<SerializedModel<SCHEMA>>;
  }>(
    formatUrl(
      `/api/specify/${tableName.toLowerCase()}/`,
      Object.fromEntries(
        filterArray(
          Array.from(
            Object.entries({
              ...filters,
              ...advancedFilters,
            }).map(([key, value]) =>
              typeof value === 'undefined'
                ? undefined
                : [
                    key.toLowerCase(),
                    key === 'orderBy'
                      ? value.toString().toLowerCase()
                      : value.toString(),
                  ]
            )
          )
        )
      )
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    { headers: { Accept: 'application/json' } }
  ).then(({ data: { meta, objects } }) => ({
    records: objects.map(serializeResource),
    totalCount: meta.total_count,
  }));

/**
 * Fetch a related collection via an relationship independent -to-many
 * relationship
 *
 * Dependent collections are sent along by the api when requesting the parent
 * resource
 */
export const fetchRelated = async <
  SCHEMA extends AnySchema,
  RELATIONSHIP extends string & keyof SCHEMA['toManyIndependent']
>(
  resource: SerializedResource<SCHEMA>,
  relationshipName: RELATIONSHIP,
  limit = DEFAULT_FETCH_LIMIT
): Promise<{
  readonly records: RA<
    SerializedResource<SCHEMA['toManyIndependent'][RELATIONSHIP][number]>
  >;
  readonly totalCount: number;
}> =>
  f.var(
    defined(
      schema.models[
        defined(parseResourceUrl(resource.resource_uri as string))[0]
      ].getRelationship(relationshipName)
    ),
    async (relationship) =>
      fetchCollection(relationship.relatedModel.name, {
        limit,
        [defined(relationship.getReverse()).name]: resource.id,
      })
  ) as Promise<{
    readonly records: RA<
      SerializedResource<SCHEMA['toManyIndependent'][RELATIONSHIP][number]>
    >;
    readonly totalCount: number;
  }>;
