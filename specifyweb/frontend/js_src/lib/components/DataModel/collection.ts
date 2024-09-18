import { ajax } from '../../utils/ajax';
import type { IR, RA, RR } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { formatUrl } from '../Router/queryString';
import type {
  AnySchema,
  CommonFields,
  SerializedRecord,
  SerializedResource,
} from './helperTypes';
import { parseResourceUrl } from './resource';
import { serializeResource } from './serializers';
import { genericTables, tables } from './tables';
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
  readonly limit?: number;
  readonly reset?: boolean;
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
    readonly objects: RA<SerializedRecord<SCHEMA>>;
  }>(
    formatUrl(
      `/api/specify/${tableName.toLowerCase()}/`,
      Object.fromEntries(
        filterArray(
          Array.from(
            Object.entries({
              ...filters,
              ...advancedFilters,
            }).map(([key, value]) => {
              const mapped =
                value === undefined
                  ? undefined
                  : mapValue(key, value, tableName);
              return mapped === undefined
                ? undefined
                : ([key.toLowerCase(), mapped] as const);
            })
          )
        )
      )
    ),

    { headers: { Accept: 'application/json' } }
  ).then(({ data: { meta, objects } }) => ({
    records: objects.map(serializeResource),
    totalCount: meta.total_count,
  }));

function mapValue(
  key: string,
  value: unknown,
  tableName: keyof Tables
): string | undefined {
  if (key === 'orderBy') return (value as string).toString().toLowerCase();
  else if (key === 'domainFilter') {
    // GetScope() returns undefined for tables with only collectionmemberid.
    const scopingField = tables[tableName].getScope();
    return value === true &&
      (tableName === 'Attachment' || typeof scopingField === 'object')
      ? 'true'
      : undefined;
  } else if (typeof value === 'boolean') return value ? 'True' : 'False';
  else return (value as string).toString();
}

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
    genericTables[tableName].strictGetRelationship(relationshipName);
  const reverseName = defined(
    relationship.getReverse(),
    `Trying to fetch related resource, but no reverse relationship exists for ${relationship.name} in ${tableName}`
  ).name;
  const response = fetchCollection(relationship.relatedTable.name, {
    limit,
    [reverseName]: id,
    domainFilter: false,
  });
  return response as Promise<{
    readonly records: RA<
      SerializedResource<SCHEMA['toManyIndependent'][RELATIONSHIP][number]>
    >;
    readonly totalCount: number;
  }>;
}

type FieldsToTypes<
  FIELDS extends IR<RA<'boolean' | 'null' | 'number' | 'string'>>
> = {
  readonly [FIELD in keyof FIELDS]: FIELDS[FIELD][number] extends 'boolean'
    ? boolean
    : FIELDS[FIELD][number] | never extends 'null'
    ? null
    : FIELDS[FIELD][number] | never extends 'number'
    ? number
    : FIELDS[FIELD][number] | never extends 'string'
    ? string
    : never;
};

/**
 * Fetch a collection of resources from the back-end. Can also provide filters
 */
export const fetchRows = async <
  TABLE_NAME extends keyof Tables,
  SCHEMA extends Tables[TABLE_NAME],
  FIELDS extends RR<
    Exclude<keyof SCHEMA['fields'], 'fields'> | string,
    RA<'boolean' | 'null' | 'number' | 'string'>
  >
>(
  tableName: TABLE_NAME,
  // Basic filters. Type-safe
  {
    fields,
    distinct = false,
    ...filters
  }: Omit<CollectionFetchFilters<SCHEMA>, 'fields'> & {
    readonly fields: FIELDS;
    readonly distinct?: boolean;
    readonly limit?: number;
  },
  /**
   * Advanced filters, not type-safe.
   *
   * Can query relationships by separating fields with "__"
   * Can query partial dates (e.g. catalogedDate__year=2030)
   * More info: https://docs.djangoproject.com/en/4.0/topics/db/queries/
   */
  advancedFilters: IR<number | string> = {}
): Promise<RA<FieldsToTypes<FIELDS>>> => {
  const { data } = await ajax<RA<RA<boolean | number | string | null>>>(
    formatUrl(
      `/api/specify_rows/${tableName.toLowerCase()}/`,
      Object.fromEntries(
        filterArray(
          Array.from(
            Object.entries({
              ...filters,
              ...advancedFilters,
              ...(distinct ? { distinct: 'true' } : {}),
              fields: Object.keys(fields).join(',').toLowerCase(),
            }).map(([key, value]) =>
              value === undefined
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
    { headers: { Accept: 'application/json' } }
  );
  const keys = Object.keys(fields);
  return data.map(
    (row) =>
      Object.fromEntries(
        keys.map((key, index) => [key, row[index]])
      ) as FieldsToTypes<FIELDS>
  );
};
