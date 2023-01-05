import { SpQuery } from '../DataModel/types';
import type { IR, RA, WritableArray } from '../../utils/types';
import {
  useAsyncState,
  useMultipleAsyncState,
} from '../../hooks/useAsyncState';
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
import { keysToLowerCase } from '../../utils/utils';
import { statsText } from '../../localization/stats';
import { throttledAjax } from '../../utils/ajax/throttledAjax';

export const urlSpec = {
  holdings: '/statistics/collection/holdings/',
  preparations: '/statistics/collection/preparations/',
  typeSpecimens: '/statistics/collection/type_specimens/',
  localityGeography: '/statistics/collection/locality_geography/',
};

/**
 * Fetch backend statistics from the API
 */
export function useBackendApi(
  categoryToFetch: RA<string>,
  showDialog = false
): BackendStatsResult | undefined {
  const backEndStatPromises = React.useMemo(
    () =>
      categoryToFetch.length === 0
        ? undefined
        : backEndStatPromiseGenerator(categoryToFetch),
    [categoryToFetch]
  );
  const [backendStat] = useMultipleAsyncState<BackendStatsResult>(
    backEndStatPromises,
    showDialog
  );
  return backendStat;
}

const backEndStatPromiseGenerator = (categoriesToFetch: RA<string>) =>
  Object.fromEntries(
    categoriesToFetch.map((key) => [
      key,
      async () =>
        throttledAjax('backendStats', async () =>
          ajax<BackendStatsResult>(urlSpec[key as keyof typeof urlSpec], {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          }).then(({ data }) => data)
        ),
    ])
  );

export function useStatsSpec(
  categoryToFetch: RA<string>,
  showDialog = false
): IR<
  IR<{
    readonly label: string;
    readonly items: StatCategoryReturn;
  }>
> {
  const backEndResult = useBackendApi(categoryToFetch, showDialog);
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
    let statNotFound = false;
    const defaultLayoutFlagged = defaultLayout.map((defaultLayoutPage) => ({
      label: defaultLayoutPage.label,
      categories: defaultLayoutPage.categories.map(({ label, items }) => ({
        label,
        items: items.map((defaultItem) => {
          const defaultStatNotFound =
            defaultItem.type === 'DefaultStat' &&
            !listToUse.some(
              ({ pageName, categoryName, itemName }) =>
                pageName === defaultItem.pageName &&
                categoryName === defaultItem.categoryName &&
                itemName === defaultItem.itemName
            );
          if (!statNotFound) statNotFound = defaultStatNotFound;
          return {
            ...defaultItem,
            ...(defaultStatNotFound
              ? {
                  isVisible: undefined,
                }
              : { isVisible: false }),
          };
        }),
      })),
      lastUpdated: undefined,
    }));
    return statNotFound ? defaultLayoutFlagged : undefined;
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

function queryCountPromiseGenerator(
  query: SpecifyResource<SpQuery>
): () => Promise<number | string | undefined> {
  return async () =>
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
    }).then(({ data }) => formatNumber(data.count));
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
              name: statSpecItem?.label,
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
        return throttledAjax(
          'queryStats',
          queryCountPromiseGenerator(statSpecCalculated.query)
        );
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

export function useCategoryToFetch(
  layout: StatLayout | undefined
): WritableArray<string> {
  return React.useMemo(() => {
    if (layout === undefined) return [];
    const categoryToFetch: WritableArray<string> = [];
    layout.forEach((pageLayout) =>
      pageLayout.categories.forEach(({ items }) =>
        items.forEach((item) => {
          if (
            item.type === 'DefaultStat' &&
            item.itemType === 'BackendStat' &&
            item.itemValue === undefined
          )
            categoryToFetch.push(item.categoryName);
        })
      )
    );
    return categoryToFetch;
  }, [layout]);
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
