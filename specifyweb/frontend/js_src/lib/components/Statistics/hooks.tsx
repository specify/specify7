import { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import type { IR, RA, WritableArray } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import { useAsyncState } from '../../hooks/useAsyncState';
import React from 'react';
import { f } from '../../utils/functools';
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
import { keysToLowerCase, removeItem } from '../../utils/utils';
import { statsText } from '../../localization/stats';

/**
 * Fetch backend statistics from the API
 */
export function useBackendApi(
  isCacheValid: boolean,
  showDialog = false
): BackendStatsResult | undefined {
  const [backendStatObject] = useAsyncState(
    React.useCallback(
      isCacheValid
        ? (): undefined => undefined
        : async () =>
            ajax<BackendStatsResult>('/statistics/collection/global/', {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
            }).then(({ data }) => data),
      [isCacheValid]
    ),
    showDialog
  );
  return backendStatObject;
}

export function useStatsSpec(
  isCacheValid: boolean,
  showDialog = false
): IR<
  IR<{
    readonly label: string;
    readonly items: StatCategoryReturn;
  }>
> {
  const backEndResult = useBackendApi(isCacheValid, showDialog);
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
                    isVisible: undefined,
                  }
                : { isVisible: false }),
            })),
          }))
          .filter(({ items }) => items.length > 0),
        lastUpdated: undefined,
      }))
      .filter(({ categories }) => categories.length > 0);
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
            items: Object.entries(items ?? {}).map(
              ([itemName, { label, spec }]) => ({
                type: 'DefaultStat',
                pageName,
                itemName,
                categoryName,
                itemLabel: label,
                itemValue: spec.type === 'BackEndStat' ? spec.value : undefined,
                itemType:
                  spec.type === 'BackEndStat' ? 'BackendStat' : 'QueryStat',
              })
            ),
          })
        ),
        lastUpdated: undefined,
      })),
    [statsSpec]
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

export function useResolvedSpec(
  statSpecItem:
    | { readonly label: string; readonly spec: StatItemSpec }
    | undefined,
  itemLabel: string
):
  | {
      readonly type: 'QueryStat';
      readonly query: SpecifyResource<SpQuery>;
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
                    makeQueryField(
                      (statSpecItem.spec as QueryBuilderStat).tableName,
                      path,
                      {
                        ...field,
                        position: index,
                      }
                    )
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
  handleValueLoadIndex:
    | ((
        categoryIndex: number,
        itemIndex: number,
        value: number | string,
        itemLabel: string
      ) => void)
    | undefined,
  itemValue: string | number | undefined
) {
  const handleValueLoad = React.useCallback(
    (count: number | string | undefined, itemLabel: string) =>
      f.maybe(handleValueLoadIndex, (handleValueLoadIndex) => {
        f.maybe(count, (count) => {
          handleValueLoadIndex(categoryIndex, itemIndex, count, itemLabel);
        });
      }),
    [categoryIndex, itemIndex, handleValueLoadIndex]
  );
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
      return undefined;
    }, [statSpecCalculated, itemValue]),
    false
  );
  React.useEffect(() => {
    if (statSpecCalculated?.label !== undefined && itemValue === undefined) {
      handleValueLoad(count, statSpecCalculated.label);
    }
  }, [handleValueLoad, statSpecCalculated, count, itemValue]);
}

export function useCacheValid(layout: StatLayout | undefined): boolean {
  return React.useMemo(() => {
    if (layout === undefined) return true;
    if (statsSpec === undefined) return false;
    return layout.every((pageLayout) =>
      pageLayout.categories
        .map(({ items }) => items)
        .flat()
        .filter(
          (item) =>
            item.type === 'DefaultStat' && item.itemType === 'BackendStat'
        )
        .every((item) => item.itemValue !== undefined)
    );
  }, [layout]);
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

export function statsToTsv(
  layout: IR<StatLayout | undefined>
): string | undefined {
  if (Object.values(layout).some((layouts) => layouts === undefined))
    return undefined;
  const headers = [
    statsText('source'),
    statsText('pageName'),
    statsText('categoryName'),
    statsText('itemName'),
    statsText('itemValue'),
  ];
  const statItems: WritableArray<WritableArray<number | string>> = [];

  Object.entries(layout as IR<StatLayout>).forEach(([sourceName, layouts]) =>
    layouts.forEach((layout) => {
      if (layout === undefined) return;
      const layoutLabel = layout.label === undefined ? '' : layout.label;
      layout.categories.forEach((category) => {
        if (category === undefined) return;
        const categoryLabel =
          category.label === undefined ? '' : category.label;
        category.items.forEach(({ itemLabel, itemValue }) => {
          if (itemValue === undefined) return;
          const newItemLabel = itemLabel === undefined ? '' : itemLabel;
          statItems.push([
            sourceName,
            layoutLabel,
            categoryLabel,
            newItemLabel,
            itemValue.toString(),
          ]);
        });
      });
    })
  );
  return [headers, ...statItems].map((line) => line.join('\t')).join('\n');
}
