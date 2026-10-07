import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { RA } from '../../utils/types';
import { group } from '../../utils/utils';
import { Tables } from '../DataModel/types';
import { formatUrl } from '../Router/queryString';
import { APIDeleteBlockerPage, APIDeleteBlockers } from './types';

const DELETE_BLOCKER_LIMIT = 40;

type APIDeleteBlockerCount = {
  readonly table: Lowercase<keyof Tables>;
  readonly field: string;
  readonly count: number;
};

type APIDeleteBlockerCounts = {
  readonly results: RA<APIDeleteBlockerCount>;
  readonly total_count: number;
};

type DeleteBlockerFilter = {
  readonly table: keyof Tables | Lowercase<keyof Tables>;
  readonly field: string;
  readonly anchor?: number;
  readonly limit?: number;
  readonly backwards?: boolean;
};

export function groupBlockers(blockers: RA<APIDeleteBlockerPage>): RA<{
  readonly table: Lowercase<keyof Tables>;
  readonly blockers: RA<APIDeleteBlockerPage>;
}> {
  return group(blockers.map((blocker) => [blocker.table, blocker])).map(
    ([table, blockers]) => ({ table, blockers })
  );
}

export async function fetchInitialBlockers(
  table: keyof Tables,
  recordId: number,
  limit: number = DELETE_BLOCKER_LIMIT,
  expectFailure = false
): Promise<APIDeleteBlockers> {
  return ajax<APIDeleteBlockers>(
    formatUrl(
      `/delete_blockers/delete_blockers/${table.toLowerCase()}/${recordId}/`,
      {
        limit,
      }
    ),
    {
      headers: { Accept: 'application/json' },
      expectedErrors: expectFailure ? [Http.NOT_FOUND] : [],
    }
  ).then(({ data }) => data);
}

export async function filterDeleteBlockers(
  table: keyof Tables,
  recordId: number,
  filters: RA<DeleteBlockerFilter>
): Promise<APIDeleteBlockers> {
  return ajax<APIDeleteBlockers>(
    `/delete_blockers/delete_blockers/${table.toLowerCase()}/${recordId}/`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: filters.map((filter) => ({
        ...filter,
        table: filter.table.toLowerCase(),
        field: filter.field.toLowerCase(),
      })),
    }
  ).then(({ data }) => data);
}

export async function fetchCounts(
  table: keyof Tables,
  recordId: number,
  expectFailure = false
): Promise<APIDeleteBlockerCounts> {
  return ajax<APIDeleteBlockerCounts>(
    `/delete_blockers/count/${table.toLowerCase()}/${recordId}/`,
    {
      headers: { Accept: 'application/json' },
      expectedErrors: expectFailure ? [Http.NOT_FOUND] : [],
    }
  ).then(({ data }) => data);
}
