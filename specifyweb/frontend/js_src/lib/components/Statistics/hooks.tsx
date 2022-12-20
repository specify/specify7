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
  QueryBuilderStat,
  StatCategoryReturn,
  StatItemSpec,
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
import { WritableArray } from '../../utils/types';
import { keysToLowerCase, removeItem } from '../../utils/utils';

const statSpecCalculated = [];
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
    if (
      layout === undefined ||
      defaultLayout === undefined ||
      layout.categories === undefined
    ) {
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
                  ([itemName, { label, spec }]) => ({
                    type: 'DefaultStat',
                    pageName,
                    itemName,
                    categoryName,
                    itemLabel: label,
                    itemValue:
                      spec.type === 'BackEndStat' ? spec.value : undefined,
                  })
                ),
              })
            ),
          }))
        : defaultLayout,
    [defaultLayout, statsSpec]
  );
}

let activeNetworkRequest: RA<Promise<string | number | undefined>> = [];
const VINNY_STAT_CONSTANT = 10;

async function fetchQueryCount(query: SpecifyResource<SpQuery>) {
  while (activeNetworkRequest.length > VINNY_STAT_CONSTANT) {
    await Promise.any(activeNetworkRequest);
  }
  const statPromise = ajax<{
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
  })
    .then(({ data }) => formatNumber(data.count))
    .finally(() => {
      activeNetworkRequest = removeItem(
        activeNetworkRequest,
        activeNetworkRequest.indexOf(statPromise)
      );
    });
  activeNetworkRequest = [...activeNetworkRequest, statPromise];
  return statPromise;
}

export function useFrontEndStat(
  query: SpecifyResource<SpQuery> | undefined,
  handleValueLoad:
    | ((
        categoryIndex: number,
        itemIndex: number,
        value: number | string,
        itemLabel: string
      ) => void)
    | undefined,
  itemIndex: number,
  categoryIndex: number,
  statLabel: string
): void {
  const [count] = useAsyncState(
    React.useCallback(async () => {
      if (query === undefined) return undefined;
      return fetchQueryCount(query);
    }, [query, handleValueLoad]),
    false
  );
}

export function useResolvedSpec(
  statSpecItem:
    | { readonly label: string; readonly spec: StatItemSpec }
    | undefined,
  itemLabel: string
):
  | {
      readonly type: 'QueryStat';
      readonly query: SpecifyResource<SpQuery> | undefined;
      readonly label: string;
    }
  | {
      readonly type: 'BackendStat';
      readonly value: string | number | undefined;
      readonly label: string | undefined;
    }
  | undefined {
  return React.useMemo(() => {
    if (
      statSpecItem?.spec.type === undefined ||
      (statSpecItem?.spec.type === 'BackEndStat' && itemLabel === undefined)
    ) {
      return undefined;
    }
    const y = 2;
    return statSpecItem?.spec.type === 'BackEndStat'
      ? {
          type: 'BackendStat',
          value: statSpecItem?.spec.value,
          label: statSpecItem?.label,
        }
      : {
          type: 'QueryStat',
          query: deserializeResource(
            addMissingFields('SpQuery', {
              name: 'get Stat',
              contextName: statSpecItem?.spec?.tableName,
              contextTableId:
                schema.models[statSpecItem?.spec?.tableName].tableId,
              countOnly: false,
              selectDistinct: false,
              fields: statSpecItem?.spec?.fields.map(
                ({ path, ...field }, index) =>
                  serializeResource(
                    makeQueryField(statSpecItem?.spec?.tableName, path, {
                      ...field,
                      position: index,
                    })
                  )
              ),
            })
          ),
          label: itemLabel,
        };
  }, [statSpecItem, itemLabel]);
}

export function useCustomStatsSpec(
  item: CustomStat | DefaultStat
): { readonly label: string; readonly spec: QueryBuilderStat } | undefined {
  return React.useMemo(
    () =>
      item.type === 'CustomStat'
        ? {
            label: item.itemLabel,
            spec: {
              type: 'QueryBuilderStat',
              tableName: item.tableName,
              fields: item.fields,
            },
          }
        : undefined,
    [item]
  );
}

export function useValueLoad(
  statSpecCalculated:
    | {
        readonly type: 'QueryStat';
        readonly query: SpecifyResource<SpQuery> | undefined;
        readonly label: string | undefined;
      }
    | {
        readonly type: 'BackendStat';
        readonly value: string | number | undefined;
        readonly label: string | undefined;
      }
    | undefined,
  categoryIndex: number,
  itemIndex: number,
  handleValueLoad:
    | ((
        categoryIndex: number,
        itemIndex: number,
        value: number | string,
        itemLabel: string
      ) => void)
    | undefined,
  itemValue: string | number | undefined
) {
  const [count] = useAsyncState(
    React.useCallback(async () => {
      if (itemValue !== undefined || statSpecCalculated === undefined) {
        return undefined;
      }
      if (
        statSpecCalculated.type === 'QueryStat' &&
        statSpecCalculated.query !== undefined
      ) {
        return fetchQueryCount(statSpecCalculated.query);
      } else if (statSpecCalculated.type === 'BackendStat') {
        return statSpecCalculated.value;
      }
    }, [statSpecCalculated, itemValue]),
    false
  );
  React.useEffect(() => {
    if (
      count !== undefined &&
      statSpecCalculated !== undefined &&
      statSpecCalculated.label !== undefined &&
      handleValueLoad !== undefined &&
      itemValue === undefined
    ) {
      handleValueLoad(
        categoryIndex,
        itemIndex,
        count,
        statSpecCalculated.label
      );
    }
  }, [
    categoryIndex,
    itemIndex,
    handleValueLoad,
    statSpecCalculated,
    count,
    itemValue,
  ]);
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
