import { SpQuery } from '../DataModel/types';
import type { IR, RA, WritableArray } from '../../utils/types';
import { useMultipleAsyncState } from '../../hooks/useAsyncState';
import React from 'react';
import { ajax } from '../../utils/ajax';
import { statsSpec } from './StatsSpec';
import type {
  BackEndStat,
  BackendStatsResult,
  CustomStat,
  DefaultStat,
  QueryBuilderStat,
  QuerySpec,
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
import { throttledPromise } from '../../utils/ajax/throttledPromise';
import { unknownCategories, urlSpec } from './definitions';

/**
 * Fetch backend statistics from the API
 */
export function useBackendApi(
  categoryToFetch: RA<keyof typeof urlSpec>
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
    false
  );
  return backendStat;
}

const backEndStatPromiseGenerator = (
  categoriesToFetch: RA<keyof typeof urlSpec>
) =>
  Object.fromEntries(
    categoriesToFetch.map((key) => [
      key,
      async () =>
        throttledPromise<BackendStatsResult, string>(
          'backendStats',
          async () =>
            ajax<BackendStatsResult>(urlSpec[key], {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
            }).then(({ data }) => data),
          urlSpec[key]
        ),
    ])
  );

export function useStatsSpec(): IR<
  IR<{
    readonly label: string;
    readonly items: StatCategoryReturn;
  }>
> {
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
                  items: categories,
                },
              ]
            )
          ),
        ])
      ),
    []
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
    const listToUse = layout.categories.flatMap(({ items = [] }) =>
      items.filter((item): item is DefaultStat => item.type === 'DefaultStat')
    );
    let statNotFound = false;
    const defaultLayoutFlagged = defaultLayout.map((defaultLayoutPage) => ({
      label: defaultLayoutPage.label,
      lastUpdated: undefined,
      categories: defaultLayoutPage.categories.map(({ label, items }) => ({
        label,
        items: items?.map((defaultItem) => {
          const defaultStatNotFound =
            defaultItem.type === 'DefaultStat' &&
            !listToUse.some(
              ({ pageName, categoryName, itemName, pathToValue }) =>
                pageName === defaultItem.pageName &&
                categoryName === defaultItem.categoryName &&
                itemName === defaultItem.itemName &&
                pathToValue === defaultItem.pathToValue
            );
          if (!statNotFound) statNotFound = defaultStatNotFound;
          return {
            ...defaultItem,
            isVisible: defaultStatNotFound ? undefined : false,
          };
        }),
      })),
    }));
    return statNotFound ? defaultLayoutFlagged : undefined;
  }, [layout, defaultLayout]);
}

export const statSpecToItems = (
  categoryName: string,
  pageName: string,
  items: StatCategoryReturn | undefined
): RA<DefaultStat> | undefined =>
  items === undefined
    ? undefined
    : Object.entries(items).map(([itemName, { label, spec }]) => ({
        type: 'DefaultStat',
        pageName,
        itemName,
        categoryName,
        itemLabel: label,
        itemValue: undefined,
        itemType: spec.type === 'BackEndStat' ? 'BackEndStat' : 'QueryStat',
        pathToValue: spec.type === 'BackEndStat' ? spec.pathToValue : undefined,
      }));

export function useDefaultLayout(statsSpec: StatsSpec): StatLayout {
  return React.useMemo(
    () =>
      Object.entries(statsSpec).map(([pageName, pageStatsSpec]) => ({
        label: pageName,
        categories: Object.entries(pageStatsSpec).map(
          ([categoryName, { label, items }]) => {
            const isUnknownCategory = unknownCategories.includes(categoryName);
            return {
              label,
              items: isUnknownCategory
                ? undefined
                : statSpecToItems(categoryName, pageName, items),
              categoryToFetch: isUnknownCategory ? categoryName : undefined,
            };
          }
        ),
        lastUpdated: undefined,
      })),
    [statsSpec]
  );
}

export function queryCountPromiseGenerator(
  query: SpecifyResource<SpQuery>
): () => Promise<string> {
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

export const useQuerySpecToResource = (
  label: string,
  querySpec: QuerySpec
): SpecifyResource<SpQuery> =>
  React.useMemo(
    () =>
      deserializeResource(
        addMissingFields('SpQuery', {
          name: label,
          contextName: querySpec.tableName,
          contextTableId: schema.models[querySpec.tableName].tableId,
          countOnly: false,
          selectDistinct: false,
          fields: querySpec.fields.map(({ path, ...field }, index) =>
            serializeResource(
              makeQueryField(querySpec.tableName, path, {
                ...field,
                position: index,
              })
            )
          ),
        })
      ),
    [label, querySpec]
  );

export function useResolveStatSpec(
  item: CustomStat | DefaultStat,
  statsSpec: StatsSpec
): StatItemSpec {
  return React.useMemo(() => {
    if (item.type === 'CustomStat') {
      return {
        type: 'QueryBuilderStat',
        querySpec: item.querySpec,
      };
    } else {
      const statSpecItem =
        statsSpec[item.pageName][item.categoryName].items[item.itemName];
      return item.itemType === 'BackEndStat'
        ? {
            type: 'BackEndStat',
            pathToValue:
              item.pathToValue ??
              (statSpecItem.spec as BackEndStat).pathToValue,
            urlToFetch: (statSpecItem.spec as BackEndStat).urlToFetch,
            formatter: (statSpecItem.spec as BackEndStat).formatter,
          }
        : {
            type: 'QueryBuilderStat',
            querySpec: (statSpecItem.spec as QueryBuilderStat).querySpec,
          };
    }
  }, [item]);
}

export function useCategoryToFetch(
  layout: StatLayout | undefined
): WritableArray<string> {
  return React.useMemo(() => {
    if (layout === undefined) return [];
    const categoriesToFetch: WritableArray<string> = [];
    layout.forEach((pageLayout) =>
      pageLayout.categories.forEach(({ items, categoryToFetch }) => {
        if (items === undefined && categoryToFetch !== undefined) {
          categoriesToFetch.push(categoryToFetch);
        }
        (items ?? []).forEach((item) => {
          if (
            item.type === 'DefaultStat' &&
            item.itemType === 'BackEndStat' &&
            item.itemValue === undefined &&
            item.itemName === 'phantomItem'
          )
            categoriesToFetch.push(item.categoryName);
        });
      })
    );
    return categoriesToFetch;
  }, [layout]);
}

export function statsToTsv(
  layout: IR<StatLayout | undefined>,
  sourceIndex: number,
  layoutPageIndex: number
): { readonly statsTsv: string; readonly nameSpec: string } | undefined {
  if (Object.values(layout).some((layouts) => layouts === undefined))
    return undefined;
  const headers = [
    statsText.source(),
    statsText.pageName(),
    statsText.categoryName(),
    statsText.itemName(),
    statsText.itemValue(),
  ];
  const statItems: WritableArray<WritableArray<number | string>> = [];
  let nameSpec = '';
  Object.entries(layout as IR<StatLayout>).forEach(
    ([sourceName, layouts], layoutSourceIndex) =>
      layouts.forEach((layout, pageIndex) => {
        if (layout === undefined) return;
        const layoutLabel = layout.label === undefined ? '' : layout.label;
        layout.categories.forEach((category) => {
          if (category === undefined) return;
          const categoryLabel =
            category.label === undefined ? '' : category.label;
          if (category.items === undefined) return;
          category.items.forEach(({ itemLabel, itemValue }) => {
            if (itemValue === undefined) return;
            const newItemLabel = itemLabel === undefined ? '' : itemLabel;
            if (
              layoutSourceIndex === sourceIndex &&
              pageIndex === layoutPageIndex
            ) {
              nameSpec = `${sourceName} ${layoutLabel}`;
              statItems.push([
                sourceName,
                layoutLabel,
                categoryLabel,
                newItemLabel,
                itemValue.toString(),
              ]);
            }
          });
        });
      })
  );
  return {
    statsTsv: [headers, ...statItems].map((line) => line.join('\t')).join('\n'),
    nameSpec,
  };
}

export function useStatValueLoad<
  PROMISE_TYPE extends string | number | undefined
>(
  statValue: string | number | undefined,
  promiseGenerator: () => Promise<PROMISE_TYPE>,
  handleValueLoad: ((value: number | string) => void) | undefined
) {
  const shouldFetch =
    statValue === undefined && typeof handleValueLoad === 'function';
  React.useEffect(() => {
    if (!shouldFetch) return undefined;
    let destructorCalled = false;
    promiseGenerator().then((value) => {
      if (value === undefined || destructorCalled) return;
      handleValueLoad?.(value);
    });
    return (): void => {
      destructorCalled = true;
    };
  }, [promiseGenerator, statValue, handleValueLoad]);
}

export function useUnknownCategory(
  backEndResponse: BackendStatsResult | undefined,
  handleChange: (
    newCategories: (
      oldCategory: StatLayout[number]['categories']
    ) => StatLayout[number]['categories']
  ) => void,
  statsSpec: StatsSpec
) {
  React.useLayoutEffect(() => {
    Object.entries(statsSpec).forEach(([pageName, pageSpec]) =>
      Object.entries(pageSpec).forEach(([categoryName, categorySpec]) =>
        Object.entries(categorySpec.items ?? {}).forEach(
          ([itemName, { spec }]) => {
            if (
              itemName === 'phantomItem' &&
              spec.type === 'BackEndStat' &&
              Object.keys(backEndResponse ?? {}).includes(categoryName)
            ) {
              handleChange((oldCategory) =>
                oldCategory.map((unknownCategory) => ({
                  ...unknownCategory,
                  items:
                    unknownCategory.items ??
                    (unknownCategory.categoryToFetch === undefined ||
                    backEndResponse?.[
                      unknownCategory.categoryToFetch as keyof BackendStatsResult
                    ] === undefined ||
                    unknownCategory.categoryToFetch !== categoryName
                      ? undefined
                      : Object.entries(
                          backEndResponse[
                            categoryName as keyof BackendStatsResult
                          ]
                        ).map(([itemName, rawValue]) => ({
                          type: 'DefaultStat',
                          pageName,
                          itemName: 'phantomItem',
                          categoryName,
                          itemLabel: itemName,
                          itemValue: spec.formatter(rawValue),
                          itemType: 'BackEndStat',
                          pathToValue: itemName as keyof BackendStatsResult,
                        }))),
                }))
              );
            }
          }
        )
      )
    );
  }, [backEndResponse, handleChange, statsSpec]);
}
