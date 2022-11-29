import { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import type { IR, RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import { useAsyncState } from '../../hooks/useAsyncState';
import React from 'react';
import { fetchResource } from '../DataModel/resource';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { ajax } from '../../utils/ajax';
import { statsSpec } from './StatsSpec';
import type {
  BackendStatsResult,
  CustomStat,
  DefaultStat,
  StatCategoryReturn,
  StatLayout,
  StatsSpec,
} from './types';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { keysToLowerCase } from '../../utils/utils';
import { serializeResource } from '../DataModel/helpers';
import { formatNumber } from '../Atoms/Internationalization';
import { deserializeResource } from '../../hooks/resource';
import { addMissingFields } from '../DataModel/addMissingFields';
import { schema } from '../DataModel/schema';
import { makeQueryField } from '../QueryBuilder/fromTree';

export function useCustomStatQuery(queryId: number):
  | {
      readonly tableName: keyof Tables;
      readonly fields: RA<
        Partial<SerializedResource<SpQueryField>> & { readonly path: string }
      >;
      readonly label: string;
    }
  | undefined {
  const [data] = useAsyncState(
    React.useCallback(
      async () =>
        fetchResource('SpQuery', queryId).then((queryData) => ({
          tableName: queryData.contextName as keyof Tables,
          fields: queryData.fields.map((field) => ({
            ...field,
            path: QueryFieldSpec.fromStringId(
              field.stringId,
              field.isRelFld ?? false
            )
              .toMappingPath()
              .join('.'),
          })),
          label: queryData.name,
        })),
      [queryId]
    ),
    false
  );
  return data;
}

/**
 * Fetch backend statistics from the API
 */
export function useBackendApi(): BackendStatsResult | undefined {
  const [backendStatObject] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<BackendStatsResult>('/statistics/collection/global/', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }).then(({ data }) => data),
      []
    ),
    false
  );
  return backendStatObject;
}

export function useStatsSpec(): IR<
  IR<{
    readonly label: string;
    readonly items: StatCategoryReturn;
  }>
> {
  const backEndResult = useBackendApi();
  return React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(statsSpec).map(([pageName, pageStatSpec]) => [
          pageName,
          Object.fromEntries(
            Object.entries(pageStatSpec).map(
              ([categoryName, { label, categories }]) => [
                categoryName,
                {
                  label,
                  items: (
                    categories as (
                      backendStatResult:
                        | BackendStatsResult[typeof categoryName]
                        | undefined
                    ) => StatCategoryReturn
                  )(backEndResult?.[categoryName]),
                },
              ]
            )
          ),
        ])
      ),
    [backEndResult]
  );
}

export function useDefaultStatsToAdd(
  layout: {
    readonly label: string;
    readonly categories: RA<{
      readonly label: string;
      readonly items: RA<CustomStat | DefaultStat>;
    }>;
  },
  defaultLayout: StatLayout
): StatLayout {
  return React.useMemo((): StatLayout => {
    const listToUse = layout.categories.flatMap(({ items }) =>
      items.filter((item): item is DefaultStat => item.type === 'DefaultStat')
    );
    return defaultLayout.map((defaultLayoutPage) => ({
      label: defaultLayoutPage.label,
      categories: defaultLayoutPage.categories
        .map(({ label, items }) => ({
          label,
          items: items.filter(
            (defaultItem) =>
              defaultItem.type === 'DefaultStat' &&
              !listToUse.some(
                ({ pageName, categoryName, itemName }) =>
                  pageName === defaultItem.pageName &&
                  categoryName === defaultItem.categoryName &&
                  itemName === defaultItem.itemName
              )
          ),
        }))
        .filter(({ items }) => items.length > 0),
    }));
  }, [layout, defaultLayout]);
}

export function useDefaultLayout(statsSpec: StatsSpec): StatLayout {
  return React.useMemo(
    () =>
      Object.entries(statsSpec).map(([pageName, pageStatsSpec]) => ({
        label: pageName,
        categories: Object.entries(pageStatsSpec).map(
          ([categoryName, { label, items }]) => ({
            label,
            items: Object.entries(items ?? {}).map(([itemName]) => ({
              type: 'DefaultStat',
              pageName,
              categoryName,
              itemName,
            })),
          })
        ),
      })),
    [statsSpec]
  );
}

export function useFrontEndStat(
  query: SpecifyResource<SpQuery>
): string | undefined {
  const [countReturn] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<{
          readonly count: number;
        }>('/stored_query/ephemeral/', {
          method: 'POST',
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Accept: 'application/json',
          },
          body: keysToLowerCase({
            ...serializeResource(query),
            countOnly: true,
          }),
        }).then(({ data }) => formatNumber(data.count)),
      [query]
    ),
    false
  );
  return countReturn;
}

/** Build Queries for the QueryBuilderAPI */
export function useFrontEndStatsQuery(
  tableName: keyof Tables,
  fields: RA<
    Partial<SerializedResource<SpQueryField>> & { readonly path: string }
  >
): SpecifyResource<SpQuery> {
  return React.useMemo(
    () =>
      deserializeResource(
        addMissingFields('SpQuery', {
          name: 'get Stat',
          contextName: tableName,
          contextTableId: schema.models[tableName].tableId,
          countOnly: false,
          selectDistinct: false,
          fields: fields.map(({ path, ...field }, index) =>
            serializeResource(
              makeQueryField(tableName, path, {
                ...field,
                position: index,
              })
            )
          ),
        })
      ),
    [tableName, fields]
  );
}
