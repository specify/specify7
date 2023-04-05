import { ajax } from '../../utils/ajax';
import type { IR, RA, RR } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { formatUrl } from '../Router/queryString';
import { serializeResource } from './helpers';
import type {
  AnySchema,
  CommonFields,
  SerializedModel,
  SerializedResource,
} from './helperTypes';
import { parseResourceUrl } from './resource';
import { schema } from './schema';
import type { Tables } from './types';

export type CollectionFetchFilters<SCHEMA extends AnySchema> = Partial<
  Exclude<SCHEMA['fields'], 'null'> &
    RR<
      keyof (SCHEMA['toManyDependent'] &
        SCHEMA['toManyIndependent'] &
        SCHEMA['toOneDependent'] &
        SCHEMA['toOneIndependent']),
      number
    >
> & {
  readonly limit: number;
  readonly offset?: number;
  readonly domainFilter?: boolean;
  readonly orderBy?:
    | keyof CommonFields
    | keyof SCHEMA['fields']
    | `-${string & keyof CommonFields}`
    | `-${string & keyof SCHEMA['fields']}`;
};

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
  advancedFilters: IR<number | string> = {}
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
              value === undefined
                ? undefined
                : [
                    key.toLowerCase(),
                    key === 'orderBy'
                      ? value.toString().toLowerCase()
                      : typeof value === 'boolean' && key !== 'domainFilter'
                      ? value
                        ? 'True'
                        : 'False'
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
export async function fetchRelated<
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
}> {
  const [tableName, id] = parseResourceUrl(
    (resource.resource_uri as string) ?? ''
  ) ?? [resource._tableName, resource.id];
  const relationship =
    schema.models[tableName].strictGetRelationship(relationshipName);
  const reverseName = defined(
    relationship.getReverse(),
    `Trying to fetch related resource, but no reverse relationship exists for ${relationship.name} in ${tableName}`
  ).name;
  const response = fetchCollection(relationship.relatedModel.name, {
    limit,
    [reverseName]: id,
  });
  return response as Promise<{
    readonly records: RA<
      SerializedResource<SCHEMA['toManyIndependent'][RELATIONSHIP][number]>
    >;
    readonly totalCount: number;
  }>;
}
