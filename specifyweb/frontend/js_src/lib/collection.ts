import { ajax } from './ajax';
import type { Tables } from './datamodel';
import type {
  AnySchema,
  CommonFields,
  SerializedModel,
  SerializedResource,
} from './datamodelutils';
import { serializeResource } from './datamodelutils';
import * as queryString from './querystring';
import type { IR, RA, RR } from './types';
import { filterArray } from './types';

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

export const fetchCollection = async <
  TABLE_NAME extends keyof Tables,
  SCHEMA extends Tables[TABLE_NAME]
>(
  modelName: TABLE_NAME,
  filters: CollectionFetchFilters<SCHEMA>,
  /*
   * Can query relationships by separating fields with "__"
   * Can query partial dates (e.g. catalogeddate__year=2030)
   * More info: https://docs.djangoproject.com/en/4.0/topics/db/queries/
   */
  advancedFilters: IR<string | number> = {}
): Promise<{
  readonly records: RA<SerializedResource<SCHEMA>>;
  readonly totalCount: number;
}> =>
  ajax<{
    readonly meta: {
      readonly limit: number;
      readonly offset: number;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      readonly total_count: number;
    };
    readonly objects: RA<SerializedModel<SCHEMA>>;
  }>(
    queryString.format(
      `/api/specify/${modelName.toLowerCase()}/`,
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
