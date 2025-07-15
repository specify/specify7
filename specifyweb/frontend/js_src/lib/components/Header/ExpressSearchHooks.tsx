import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { strictGetTable } from '../DataModel/tables';
import { contextUnlockedPromise, foreverFetch } from '../InitialContext';
import { legacyLocalize } from '../InitialContext/legacyUiLocalization';
import { formatUrl } from '../Router/queryString';

export type RawExpressSearchResult = {
  readonly table: SpecifyTable;
  readonly caption: string;
  readonly tableResults: QueryTableResult;
  readonly ajaxUrl: string;
};

export function usePrimarySearch(
  query: string
): RA<RawExpressSearchResult> | false | undefined {
  const [primaryResults] = useAsyncState<RA<RawExpressSearchResult> | false>(
    React.useCallback(async () => {
      if (query === '') return false;
      const ajaxUrl = formatUrl('/express_search/', {
        q: query,
        limit: expressSearchFetchSize,
      });
      return ajax<IR<QueryTableResult>>(ajaxUrl, {
        headers: { Accept: 'application/json' },
        expectedErrors: [Http.FORBIDDEN],
      }).then(({ data, status }) =>
        status === Http.FORBIDDEN
          ? false
          : Object.entries(data)
              .filter(([_tableName, { totalCount }]) => totalCount > 0)
              .map(([tableName, tableResults]) => ({
                table: strictGetTable(tableName),
                caption: strictGetTable(tableName).label,
                tableResults,
                ajaxUrl,
              }))
      );
    }, [query]),
    false
  );
  return primaryResults;
}

const relatedSearchesPromise = contextUnlockedPromise.then(
  async (entrypoint) =>
    entrypoint === 'main'
      ? ajax<RA<string>>('/context/available_related_searches.json', {
          headers: { Accept: 'application/json' },
        }).then(({ data }) => data)
      : foreverFetch<RA<string>>()
);
export const expressSearchFetchSize = 40;

type FieldSpec = {
  readonly stringId: string;
  readonly isRelationship: boolean;
};

export type QueryTableResult = {
  readonly fieldSpecs: RA<FieldSpec>;
  readonly results: RA<RA<number | string>>;
  readonly totalCount: number;
};

type RelatedTableResult = {
  readonly definition: {
    readonly columns: RA<string>;
    readonly fieldSpecs: RA<FieldSpec>;
    readonly link: string | null;
    readonly name: string;
    readonly root: string;
  };
  readonly results: RA<RA<number | string>>;
  readonly totalCount: number;
};

export function useSecondarySearch(
  query: string
): RA<RawExpressSearchResult> | false | undefined {
  const [secondaryResults] = useAsyncState<RA<RawExpressSearchResult> | false>(
    React.useCallback(async () => {
      if (query === '') return false;
      const relatedSearches = await relatedSearchesPromise;
      const results = await Promise.all(
        relatedSearches.map(async (name) => {
          const ajaxUrl = formatUrl('/express_search/related/', {
            q: query,
            name,
            limit: expressSearchFetchSize,
          });
          return ajax<RelatedTableResult>(ajaxUrl, {
            headers: { Accept: 'application/json' },
            expectedErrors: [Http.FORBIDDEN],
          }).then(({ data, status }) =>
            status === Http.FORBIDDEN ? undefined : ([ajaxUrl, data] as const)
          );
        })
      );
      return filterArray(results)
        .filter(([_ajaxUrl, { totalCount }]) => totalCount > 0)
        .map(([ajaxUrl, tableResult]) => {
          const table = strictGetTable(tableResult.definition.root);
          const idFieldIndex = 0;
          /*
           * FEATURE: decide if this code is needed
           * It is responsible for making express search on
           * "Taxon CollectionObject" link out to Taxon records rather
           * than CollectionObject
           */
          /*
           *Const fieldSpecs = tableResult.definition.fieldSpecs.map(
           *({ stringId, isRelationship }) =>
           *  QueryFieldSpec.fromStringId(stringId, isRelationship)
           *);
           *if (tableResult.definition.link !== null) {
           *idFieldIndex = fieldSpecs.length - 1;
           *const relationship = defined(
           *  fieldSpecs.slice(-1)[0]?.getField()
           *);
           *if (relationship.isRelationship)
           *  table = relationship.relatedTable;
           * // If field is TaxonID
           *else if (relationship === relationship.table.idField)
           *  table = relationship.table;
           *else throw new Error('Unable to extract relationship');
           *}
           */

          return {
            table,
            idFieldIndex,
            caption:
              legacyLocalize(tableResult.definition.name) ??
              tableResult.definition.name,
            tableResults: {
              results: tableResult.results,
              fieldSpecs: tableResult.definition.fieldSpecs,
              totalCount: tableResult.totalCount,
            },
            ajaxUrl,
          };
        });
    }, [query]),
    false
  );
  return secondaryResults;
}
