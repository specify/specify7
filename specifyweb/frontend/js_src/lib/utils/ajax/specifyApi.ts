/**
 * Wrappers for some back-end API endpoints
 */

import type { CollectionFetchFilters } from '../../components/DataModel/collection';
import type {
  AnySchema,
  AnyTree,
  SerializedModel,
} from '../../components/DataModel/helperTypes';
import type { SpecifyResource } from '../../components/DataModel/legacyTypes';
import type { Tables } from '../../components/DataModel/types';
import { formatUrl } from '../../components/Router/queryString';
import type { IR, RA, RR } from '../types';
import { filterArray } from '../types';
import { formData } from './helpers';
import { ajax } from './index';

// FEATURE: consider replacing this with Query Builder
export const queryCbxExtendedSearch = async <SCHEMA extends AnySchema>(
  templateResource: SpecifyResource<SCHEMA>,
  forceCollection: number | undefined
): Promise<RA<SpecifyResource<SCHEMA>>> =>
  ajax<RA<SerializedModel<SCHEMA>>>(
    formatUrl(
      `/express_search/querycbx/${templateResource.specifyModel.name.toLowerCase()}/`,
      {
        ...Object.fromEntries(
          filterArray(
            Object.entries(templateResource.toJSON()).map(([key, value]) => {
              const field = templateResource.specifyModel.getField(key);
              return field && !field.isRelationship && Boolean(value)
                ? [key, value]
                : undefined;
            })
          )
        ),
        ...(typeof forceCollection === 'number'
          ? { forceCollection: forceCollection.toString() }
          : {}),
      }
    ),
    {
      headers: { Accept: 'application/json' },
    }
  ).then(({ data: results }) =>
    results.map((result) => new templateResource.specifyModel.Resource(result))
  );

export const fetchTreePath = async (treeResource: SpecifyResource<AnyTree>) =>
  typeof treeResource.id === 'number'
    ? ajax<{
        readonly Genus?: {
          readonly name: string;
        };
        readonly Species?: {
          readonly name: string;
        };
      }>(
        `/api/specify_tree/${treeResource.specifyModel.name.toLowerCase()}/${
          treeResource.id
        }/path/`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      ).then(({ data }) => data)
    : undefined;

export type Preparations = RA<{
  readonly catalogNumber: string;
  readonly taxon: string;
  readonly preparationId: number;
  readonly prepType: string;
  readonly countAmount: number;
  readonly loaned: number;
  readonly gifted: number;
  readonly exchanged: number;
  readonly available: number;
}>;

export type PreparationRow = readonly [
  string,
  string,
  number,
  string,
  number,
  string | null,
  string | null,
  string | null,
  string
];

export const getPrepsAvailableForLoanRs = async (recordSetId: number) =>
  ajax<RA<PreparationRow>>(
    `/interactions/preparations_available_rs/${recordSetId}/`,
    {
      headers: { Accept: 'application/json' },
    }
  ).then(({ data }) => data);

export const getPrepsAvailableForLoanCoIds = async (
  idField: string,
  collectionObjectIds: RA<string>
) =>
  ajax<RA<PreparationRow>>('/interactions/preparations_available_ids/', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData({
      id_fld: idField,
      co_ids: collectionObjectIds,
    }),
  }).then(({ data }) => data);

export const getInteractionsForPrepId = async (prepId: number) =>
  ajax<RA<readonly [number, string | null, string | null, string | null]>>(
    '/interactions/prep_interactions/',
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData({ prepIds: prepId }),
    }
  ).then(({ data }) => data[0]);

export const getPrepAvailability = async (
  prepId: number,
  iPrepId: number | undefined,
  iPrepName: string
) =>
  ajax(
    `/interactions/prep_availability/${prepId}/${
      typeof iPrepId === 'number' ? `${iPrepId}/${iPrepName}/` : ''
    }`,
    { headers: { Accept: 'application/json' } }
  ).then(({ data }) => data);

/**
 * Fetch a collection of resources from the back-end. Can also provide filters
 */
export const fetchRows = async <
  TABLE_NAME extends keyof Tables,
  SCHEMA extends Tables[TABLE_NAME],
  FIELDS extends RR<
    string | keyof SCHEMA['fields'],
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
  },
  /**
   * Advanced filters, not type-safe.
   *
   * Can filter on relationships by separating fields with "__"
   * Can filter on partial dates (e.g. catalogedDate__year=2030)
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
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
