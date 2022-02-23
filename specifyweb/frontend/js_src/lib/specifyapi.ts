import _ from 'underscore';

import { ajax } from './ajax';
import Backbone from './backbone';
import type { Tables } from './datamodel';
import type { AnySchema, AnyTree } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import * as queryString from './querystring';
import type { IR, RA } from './types';
import { filterArray } from './types';

export const globalEvents = _.extend({}, Backbone.Events);

export const queryCbxExtendedSearch = async (
  templateResource: SpecifyResource<AnySchema>,
  forceCollection: number | undefined
) =>
  ajax<IR<unknown>>(
    `/express_search/querycbx/${templateResource.specifyModel.name.toLowerCase()}/`,
    {
      headers: { Accept: 'application/json' },
      body: {
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
          ? { forcecollection: forceCollection }
          : {}),
      },
    }
  ).then(
    ({ data: results }) =>
      new templateResource.specifyModel.StaticCollection(results)
  );

export const getTreePath = async (treeResource: SpecifyResource<AnyTree>) =>
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

export const getPrepsAvailableForLoanRs = async (recordSetId: number) =>
  ajax<RA<unknown>>(`/interactions/preparations_available_rs/${recordSetId}/`, {
    headers: { Accept: 'application/json' },
  }).then(({ data }) => data);

export const getPrepsAvailableForLoanCoIds = async (
  idField: string,
  collectionObjectIds: RA<number>
) =>
  ajax('/interactions/preparations_available_ids/', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: {
      id_fld: idField,
      co_ids: collectionObjectIds,
    },
  }).then(({ data }) => data);

export const returnAllLoanItems = async (
  loanIds: RA<number>,
  returnedById: number,
  returnedDate: string,
  selection: RA<number>
) =>
  ajax('/interactions/loan_return_all/', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: {
      loanIds,
      returnedById,
      returnedDate,
      selection,
    },
  }).then(({ data }) => data);

export const getInteractionsForPrepIds = async (prepIds: RA<number>) =>
  ajax('/interactions/prep_interactions/', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: { prepIds },
  }).then(({ data }) => data);

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

export const fetchRows = async <SCHEMA extends AnySchema>(
  table: SCHEMA['tableName'],
  {
    fields,
    limit,
    distinct,
  }: {
    readonly fields: RA<keyof SCHEMA['fields']>;
    readonly limit: number;
    readonly distinct: boolean;
  }
): Promise<RA<RA<string>>> =>
  ajax<RA<RA<string>>>(
    queryString.format(`/api/specify_rows/${table.toLowerCase()}/`, {
      fields: fields.join(',').toLowerCase(),
      limit: limit.toString(),
      distinct: distinct ? 'true' : 'false',
    }),
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/json' },
    }
  ).then(({ data }) => data);

export function makeResourceViewUrl(
  tableName: keyof Tables,
  resourceId?: number,
  recordSetId?: number
): string {
  const url = `/specify/view/${tableName.toLowerCase()}/${
    resourceId ?? 'new'
  }/`;
  return typeof recordSetId === 'number'
    ? queryString.format(url, { recordsetid: recordSetId.toString() })
    : url;
}
