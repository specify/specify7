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
import { serializeResource } from '../DataModel/helpers';
import { formatNumber } from '../Atoms/Internationalization';
import { deserializeResource } from '../../hooks/resource';
import { addMissingFields } from '../DataModel/addMissingFields';
import { schema } from '../DataModel/schema';
import { makeQueryField } from '../QueryBuilder/fromTree';
import { statsText } from '../../localization/stats';
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
export function useBackendApi(
  cachedState: boolean
): BackendStatsResult | undefined {
  const [backendStatObject] = useAsyncState(
    React.useCallback(
      !cachedState
        ? async () =>
            ajax<BackendStatsResult>('/statistics/collection/global/', {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
            }).then(({ data }) => data)
        : () => undefined,
      [cachedState]
    ),
    false
  );
  return backendStatObject;
}

export function useStatsSpec(
  cachedState: boolean,
  specifyUserName: string
): IR<
  IR<{
    readonly label: string;
    readonly items: StatCategoryReturn;
  }>
> {
  const backEndResult = useBackendApi(cachedState);
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
                        | string
                        | undefined
                    ) => StatCategoryReturn
                  )(
                    pageName === statsText('personal')
                      ? specifyUserName
                      : backEndResult?.[categoryName]
                  ),
                },
              ]
            )
          ),
        ])
      ),
    [backEndResult, specifyUserName]
  );
}

export function useDefaultStatsToAdd(
  layout: StatLayout[number] | undefined,
  defaultLayout: StatLayout | undefined
): StatLayout | undefined {
  return React.useMemo((): StatLayout | undefined => {
    if (layout === undefined || defaultLayout === undefined) {
      return undefined;
    }
    const listToUse = layout.categories.flatMap(({ items }) =>
      items.filter((item): item is DefaultStat => item.type === 'DefaultStat')
    );
    return defaultLayout
      .map((defaultLayoutPage) => ({
        label: defaultLayoutPage.label,
        categories: defaultLayoutPage.categories
          .map(({ label, items }) => ({
            label,
            items: items.map((defaultItem) => ({
              ...defaultItem,
              ...(defaultItem.type === 'DefaultStat' &&
              !listToUse.some(
                ({ pageName, categoryName, itemName }) =>
                  pageName === defaultItem.pageName &&
                  categoryName === defaultItem.categoryName &&
                  itemName === defaultItem.itemName
              )
                ? {
                    absent: false,
                  }
                : { absent: true }),
            })),
          }))
          .filter(({ items }) => items.length > 0),
      }))
      .filter(({ categories }) => categories.length > 0);
  }, [layout, defaultLayout]);
}

export function useDefaultLayout(
  statsSpec: StatsSpec,
  defaultLayout: StatLayout | undefined
): StatLayout {
  return React.useMemo(
    () =>
      defaultLayout === undefined
        ? Object.entries(statsSpec).map(([pageName, pageStatsSpec]) => ({
            label: pageName,
            categories: Object.entries(pageStatsSpec).map(
              ([categoryName, { label, items }]) => ({
                label,
                items: Object.entries(items ?? {}).map(
                  ([itemName, { spec }]) => ({
                    type: 'DefaultStat',
                    pageName,
                    categoryName,
                    itemName,
                    cachedValue:
                      spec.type === 'BackEndStat' ? spec.value : undefined,
                  })
                ),
              })
            ),
          }))
        : defaultLayout,
    [statsSpec]
  );
}

export function useFrontEndStat(
  query: SpecifyResource<SpQuery> | undefined,
  onStatNetwork: (
    query: SpecifyResource<SpQuery> | undefined
  ) => Promise<string | undefined>,
  statCachedValue?: string | number | undefined
): string | number | undefined {
  const [countReturn] = useAsyncState(
    React.useCallback(
      () =>
        statCachedValue !== undefined
          ? statCachedValue
          : query !== undefined
          ? onStatNetwork(query)
          : undefined,
      [query, statCachedValue]
    ),
    false
  );
  return countReturn;
}

/** Build Queries for the QueryBuilderAPI */
export function useFrontEndStatsQuery(
  tableName: keyof Tables | undefined,
  fields:
    | RA<Partial<SerializedResource<SpQueryField>> & { readonly path: string }>
    | undefined
): SpecifyResource<SpQuery> | undefined {
  return React.useMemo(
    tableName !== undefined && fields !== undefined
      ? () =>
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
          )
      : () => undefined,
    [tableName, fields]
  );
}

export function replaceLayout(
  layout: StatLayout,
  setLayout: (value: StatLayout | undefined) => void,
  newLayoutFunction: (layout: StatLayout) => StatLayout
): void {
  setLayout(newLayoutFunction(layout));
}
