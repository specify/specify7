import React from 'react';

import { useMultipleAsyncState } from '../../hooks/useAsyncState';
import { statsText } from '../../localization/stats';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { throttledPromise } from '../../utils/ajax/throttledPromise';
import type { IR, RA, WritableArray } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import { formatNumber } from '../Atoms/Internationalization';
import { addMissingFields } from '../DataModel/addMissingFields';
import { deserializeResource, serializeResource } from '../DataModel/helpers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { SpQuery } from '../DataModel/types';
import { makeQueryField } from '../QueryBuilder/fromTree';
import { statsSpec } from './StatsSpec';
import type {
  BackEndStat,
  BackendStatsResult,
  CustomStat,
  DefaultStat,
  QueryBuilderStat,
  QuerySpec,
  StatCategoryReturn,
  StatLayout,
} from './types';

/**
 * Fetch backend statistics from the API
 */
export function useBackendApi(
  urlsToFetch: RA<string>
): BackendStatsResult | undefined {
  const backEndStatPromises = React.useMemo(
    () =>
      urlsToFetch.length === 0
        ? undefined
        : backEndStatPromiseGenerator(urlsToFetch),
    [urlsToFetch]
  );
  const [backendStat] = useMultipleAsyncState(backEndStatPromises, false);
  return backendStat;
}

function backEndStatPromiseGenerator(
  urlsToFetch: RA<string>
): IR<() => Promise<BackendStatsResult | undefined>> {
  return Object.fromEntries(
    urlsToFetch.map((key) => [
      key,
      async () =>
        throttledPromise<BackendStatsResult | undefined>(
          'backendStats',
          async () =>
            ajax<BackendStatsResult>(
              key,
              {
                method: 'GET',
                headers: {
                  Accept: 'application/json',
                },
              },
              { expectedResponseCodes: [Http.OK, Http.FORBIDDEN] }
            ).then(({ data, status }) =>
              status === Http.FORBIDDEN ? undefined : data
            ),
          key
        ),
    ])
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
          statNotFound ||= defaultStatNotFound;
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
  items: StatCategoryReturn
): RA<DefaultStat> =>
  Object.entries(items).map(([itemName, { label, spec }]) => ({
    type: 'DefaultStat',
    pageName,
    itemName,
    categoryName,
    label,
    itemValue: undefined,
    itemType: spec.type === 'BackEndStat' ? 'BackEndStat' : 'QueryStat',
    pathToValue: spec.type === 'BackEndStat' ? spec.pathToValue : undefined,
  }));

export function useDefaultLayout(): StatLayout {
  return React.useMemo(
    () =>
      Object.entries(statsSpec).map(
        ([sourceKey, { sourceLabel, categories }]) => ({
          label: sourceLabel,
          categories: Object.entries(categories).map(
            ([categoryName, { label, items }]) => ({
              label,
              items: statSpecToItems(categoryName, sourceKey, items),
            })
          ),
          lastUpdated: undefined,
        })
      ),
    []
  );
}

export function queryCountPromiseGenerator(
  query: SpecifyResource<SpQuery>,
  setStatPermission: (newValue: boolean) => void
): () => Promise<string | undefined> {
  return async () =>
    ajax<{
      readonly count: number;
    }>(
      '/stored_query/ephemeral/',
      {
        method: 'POST',
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Accept: 'application/json',
        },
        body: keysToLowerCase({
          ...serializeResource(query),
          countOnly: true,
        }),
      },
      { expectedResponseCodes: [Http.FORBIDDEN, Http.OK] }
    ).then(({ data, status }) => {
      if (status === Http.FORBIDDEN) {
        setStatPermission(false);
        return undefined;
      }
      return formatNumber(data.count);
    });
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
  item: CustomStat | DefaultStat
):
  | QueryBuilderStat
  | (BackEndStat & { readonly fetchUrl: string })
  | undefined {
  return React.useMemo(() => {
    if (item.type === 'CustomStat') {
      return {
        type: 'QueryBuilderStat',
        querySpec: item.querySpec,
      };
    } else {
      const statSpecItem =
        statsSpec[item.pageName]?.categories?.[item.categoryName]?.items?.[
          item.itemName
        ];
      return statSpecItem === undefined
        ? undefined
        : item.itemType === 'BackEndStat'
        ? {
            type: 'BackEndStat',
            pathToValue:
              item.pathToValue ??
              (statSpecItem.spec as BackEndStat).pathToValue,
            fetchUrl: generateStatUrl(
              statsSpec[item.pageName].urlPrefix,
              item.categoryName,
              item.itemName
            ),
            formatter: (statSpecItem.spec as BackEndStat).formatter,
            tableName: (statSpecItem.spec as BackEndStat).tableName,
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
    pageLayout.categories.forEach(({ items }) => {
      items.forEach((item) => {
        if (
          item.type === 'DefaultStat' &&
          item.itemType === 'BackEndStat' &&
          item.itemValue === undefined &&
          item.itemName === 'phantomItem'
        )
          categoriesToFetch.push(
            generateStatUrl(
              statsSpec[item.pageName].urlPrefix,
              item.categoryName,
              item.itemName
            )
          );
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
  PROMISE_TYPE extends number | string | undefined
>(
  value: number | string | undefined,
  promiseGenerator: () => Promise<PROMISE_TYPE>,
  onLoad: ((value: number | string) => void) | undefined
) {
  const shouldFetch = value === undefined && typeof onLoad === 'function';
  React.useEffect(() => {
    if (!shouldFetch) return undefined;
    let destructorCalled = false;
    promiseGenerator().then((value) => {
      if (destructorCalled || value === undefined) return;
      onLoad?.(value);
    });
    return (): void => {
      destructorCalled = true;
    };
  }, [promiseGenerator, value, onLoad]);
}

function applyBackendResponse(
  backEndResponse: BackendStatsResult | undefined,
  items: RA<CustomStat | DefaultStat>,
  pageName: string,
  categoryName: string,
  urlPrefix: string,
  formatter: (rawResult: any) => string | undefined
): RA<CustomStat | DefaultStat> {
  const phantomItem = items.find(
    (item) =>
      item.type === 'DefaultStat' &&
      item.itemName === 'phantomItem' &&
      item.pathToValue === undefined
  );

  const responseKey =
    phantomItem !== undefined && phantomItem.type === 'DefaultStat'
      ? generateStatUrl(
          urlPrefix,
          phantomItem.categoryName,
          phantomItem.itemName
        )
      : undefined;
  if (
    responseKey === undefined ||
    backEndResponse === undefined ||
    backEndResponse[responseKey] === undefined
  )
    return items;
  const isMyResponse =
    Object.keys(backEndResponse).includes(responseKey) &&
    pageName === (phantomItem as DefaultStat).pageName &&
    categoryName === (phantomItem as DefaultStat).categoryName;
  return phantomItem !== undefined &&
    isMyResponse &&
    phantomItem.type === 'DefaultStat'
    ? Object.entries(backEndResponse[responseKey]).map(
        ([itemName, rawValue]) => ({
          type: 'DefaultStat',
          pageName: phantomItem.pageName,
          itemName: 'phantomItem',
          categoryName: phantomItem.categoryName,
          label: itemName,
          itemValue: formatter(rawValue),
          itemType: 'BackEndStat',
          pathToValue: itemName,
        })
      )
    : items;
}

export function useDynamicCategorySetter(
  backEndResponse: BackendStatsResult | undefined,
  handleChange: (
    newCategories: (
      oldCategory: StatLayout[number]['categories']
    ) => StatLayout[number]['categories']
  ) => void
) {
  React.useLayoutEffect(() => {
    Object.entries(statsSpec).forEach(
      ([sourceName, { categories, urlPrefix }]) =>
        Object.entries(categories).forEach(([categoryName, categorySpec]) =>
          Object.entries(categorySpec.items).forEach(([itemName, { spec }]) => {
            if (
              itemName === 'phantomItem' &&
              spec.type === 'BackEndStat' &&
              backEndResponse !== undefined
            ) {
              handleChange((oldCategory) =>
                oldCategory.map((unknownCategory) => ({
                  ...unknownCategory,
                  items: applyBackendResponse(
                    backEndResponse,
                    unknownCategory.items,
                    sourceName,
                    categoryName,
                    urlPrefix,
                    spec.formatter
                  ),
                }))
              );
            }
          })
        )
    );
  }, [backEndResponse, handleChange]);
}

export function generateStatUrl(
  urlPrefix: string,
  categoryKey: string,
  itemKey: string
) {
  const urlSpec = [urlPrefix, categoryKey, itemKey];
  return `/statistics${urlSpec.reduce(
    (previousValue, currentValue) =>
      `${previousValue}${
        currentValue === 'phantomItem' ? '' : `/${currentValue}`
      }`,
    ''
  )}/`;
}
