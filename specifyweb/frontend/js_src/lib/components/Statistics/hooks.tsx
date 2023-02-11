import React from 'react';

import { useMultipleAsyncState } from '../../hooks/useAsyncState';
import { statsText } from '../../localization/stats';
import { ajax } from '../../utils/ajax';
import { throttledPromise } from '../../utils/ajax/throttledPromise';
import type { IR, RA, WritableArray } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import { formatNumber } from '../Atoms/Internationalization';
import { addMissingFields } from '../DataModel/addMissingFields';
import { deserializeResource, serializeResource } from '../DataModel/helpers';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { SpQuery } from '../DataModel/types';
import { makeQueryField } from '../QueryBuilder/fromTree';
import { dynamicCategories } from './definitions';
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

/**
 * Fetch backend statistics from the API
 */
export function useBackendApi(
  categoryToFetch: RA<string>
): BackendStatsResult | undefined {
  const backEndStatPromises = React.useMemo(
    () =>
      categoryToFetch.length === 0
        ? undefined
        : backEndStatPromiseGenerator(categoryToFetch),
    [categoryToFetch]
  );
  const [backendStat] = useMultipleAsyncState(backEndStatPromises, false);
  return backendStat;
}

function backEndStatPromiseGenerator(
  categoriesToFetch: RA<string>
): IR<() => Promise<BackendStatsResult>> {
  return Object.fromEntries(
    categoriesToFetch.map((key) => [
      key,
      async () =>
        throttledPromise<BackendStatsResult>(
          'backendStats',
          async () =>
            ajax<BackendStatsResult>(`/statistics/collection/${key}/`, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
            }).then(({ data }) => data),
          `/statistics/collection/${key}/`
        ),
    ])
  );
}

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
        label: label,
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
            const isUnknownCategory = dynamicCategories.includes(categoryName);
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

export const querySpecToResource = (
  label: string,
  querySpec: QuerySpec
): SpecifyResource<SpQuery> =>
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
  );

export function useResolvedStatSpec(
  item: CustomStat | DefaultStat,
  statsSpec: StatsSpec
): StatItemSpec | undefined {
  return React.useMemo(() => {
    if (item.type === 'CustomStat') {
      return {
        type: 'QueryBuilderStat',
        querySpec: item.querySpec,
      };
    } else {
      const statSpecItem =
        statsSpec[item.pageName]?.[item.categoryName]?.items?.[item.itemName];
      return statSpecItem === undefined
        ? undefined
        : item.itemType === 'BackEndStat'
        ? {
            type: 'BackEndStat',
            pathToValue:
              item.pathToValue ??
              (statSpecItem.spec as BackEndStat).pathToValue,
            fetchUrl: (statSpecItem.spec as BackEndStat).fetchUrl,
            formatter: (statSpecItem.spec as BackEndStat).formatter,
          }
        : {
            type: 'QueryBuilderStat',
            querySpec: (statSpecItem.spec as QueryBuilderStat).querySpec,
          };
    }
  }, [item]);
}

export function setAbsentCategoriesToFetch(
  layout: StatLayout | undefined,
  currentCategoriesToFetch: RA<string>,
  setCategoriesToFetch: (currentCategories: RA<string>) => void
) {
  if (layout === undefined) return;
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
  const notCurrentlyFetching = Array.from(new Set(categoriesToFetch)).filter(
    (categoryToFetch) => !currentCategoriesToFetch.includes(categoryToFetch)
  );
  if (notCurrentlyFetching.length > 0) {
    setCategoriesToFetch([
      ...currentCategoriesToFetch,
      ...notCurrentlyFetching,
    ]);
  }
}

export function statsToTsv(
  layout: IR<StatLayout | undefined>,
  layoutPageIndex: number,
  sourceIndex: number
): string {
  const headers = [
    statsText.categoryName(),
    statsText.itemName(),
    statsText.itemValue(),
  ];
  const statItems = Object.entries(layout as IR<StatLayout>).flatMap(
    ([_, layouts], layoutSourceIndex) =>
      (layoutSourceIndex === sourceIndex ? layouts : []).flatMap(
        (page, pageIndex) =>
          (pageIndex === layoutPageIndex ? page.categories : []).flatMap(
            (category) =>
              (category.items ?? [])
                .filter((item) => item.itemValue !== undefined)
                .map((item) =>
                  [category.label, item.label, item.itemValue?.toString()].map(
                    (display) => display ?? ''
                  )
                )
          )
      )
  );
  return [headers, ...statItems].map((line) => line.join('\t')).join('\n');
}

export function useStatValueLoad<
  PROMISE_TYPE extends string | number | undefined
>(
  value: string | number | undefined,
  promiseGenerator: () => Promise<PROMISE_TYPE>,
  onLoad: ((value: number | string) => void) | undefined
) {
  const shouldFetch = value === undefined && typeof onLoad === 'function';
  React.useEffect(() => {
    if (!shouldFetch) return undefined;
    let destructorCalled = false;
    promiseGenerator().then((value) => {
      if (value === undefined || destructorCalled) return;
      onLoad?.(value);
    });
    return (): void => {
      destructorCalled = true;
    };
  }, [promiseGenerator, value, onLoad]);
}

export function useDynamicCategorySetter(
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
                    backEndResponse?.[unknownCategory.categoryToFetch] ===
                      undefined ||
                    unknownCategory.categoryToFetch !== categoryName
                      ? undefined
                      : Object.entries(backEndResponse[categoryName]).map(
                          ([itemName, rawValue]) => ({
                            type: 'DefaultStat',
                            pageName,
                            itemName: 'phantomItem',
                            categoryName,
                            label: itemName,
                            itemValue: spec.formatter(rawValue),
                            itemType: 'BackEndStat',
                            pathToValue: itemName,
                          })
                        )),
                }))
              );
            }
          }
        )
      )
    );
  }, [backEndResponse, handleChange, statsSpec]);
}
