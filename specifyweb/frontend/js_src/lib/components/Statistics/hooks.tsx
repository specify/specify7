import React from 'react';

import { useMultipleAsyncState } from '../../hooks/useAsyncState';
import { statsText } from '../../localization/stats';
import type { AjaxResponseObject } from '../../utils/ajax';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { throttledPromise } from '../../utils/ajax/throttledPromise';
import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import { MILLISECONDS } from '../Atoms/Internationalization';
import { addMissingFields } from '../DataModel/addMissingFields';
import { deserializeResource, serializeResource } from '../DataModel/helpers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { SpQuery } from '../DataModel/types';
import { makeQueryField } from '../QueryBuilder/fromTree';
import { dynamicStatsSpec, statsSpec } from './StatsSpec';
import type {
  BackEndStatResolve,
  BackendStatsResult,
  CustomStat,
  DefaultStat,
  QueryBuilderStat,
  QuerySpec,
  StatFormatterSpec,
  StatLayout,
  StatsSpec,
} from './types';

/**
 * Returns state which gets updated everytime backend stat is fetched. Used for dynamic categories since they don't
 * exist in the initial layout, and have to be set by stats page.
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

/**
 * Flags default statistics which aren't on the current page. We cannot use filter to return a list
 * since item value can be undefined. In that case, the item value will have to fetched and then set
 * in the layout and thus filtered items will have to be mapped to the original layout
 *
 */

export function getDefaultLayoutFlagged(
  layout: StatLayout | undefined,
  defaultLayout: RA<StatLayout> | undefined
): RA<StatLayout> | undefined {
  if (layout === undefined || defaultLayout === undefined) {
    return undefined;
  }
  const listToUse = layout.categories.flatMap(({ items }) =>
    items.filter((item): item is DefaultStat => item.type === 'DefaultStat')
  );
  let statNotFound = false;
  const defaultLayoutFlagged = defaultLayout.map((defaultLayoutPage) => ({
    label: defaultLayoutPage.label,
    lastUpdated: undefined,
    categories: defaultLayoutPage.categories.map(({ label, items }) => ({
      label,
      items: items.map((defaultItem) => {
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
}

export function useDefaultStatsToAdd(
  layout: StatLayout | undefined,
  defaultLayout: RA<StatLayout> | undefined
): RA<StatLayout> | undefined {
  return React.useMemo(
    (): RA<StatLayout> | undefined =>
      getDefaultLayoutFlagged(layout, defaultLayout),
    [layout, defaultLayout]
  );
}

export function queryCountPromiseGenerator(
  query: SpecifyResource<SpQuery>
): () => Promise<AjaxResponseObject<{ readonly count: number }>> {
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
      { expectedResponseCodes: Object.values(Http) }
    );
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
      selectDistinct: querySpec.isDistinct ?? false,
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

export function resolveStatsSpec(
  item: CustomStat | DefaultStat,
  formatterSpec: StatFormatterSpec
): BackEndStatResolve | QueryBuilderStat | undefined {
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
      : statSpecItem.spec.type === 'BackEndStat'
      ? {
          type: 'BackEndStat',
          pathToValue: item.pathToValue ?? statSpecItem.spec.pathToValue,
          fetchUrl: generateStatUrl(
            statsSpec[item.pageName].urlPrefix,
            item.categoryName,
            item.itemName
          ),
          formatter: statSpecItem.spec.formatterGenerator(formatterSpec),
          tableName: statSpecItem.spec.tableName,
        }
      : {
          type: 'QueryBuilderStat',
          querySpec: statSpecItem.spec.querySpec,
        };
  }
}

export function useResolvedStatSpec(
  item: CustomStat | DefaultStat,
  formatterSpec: StatFormatterSpec
): BackEndStatResolve | QueryBuilderStat | undefined {
  return React.useMemo(() => resolveStatsSpec(item, formatterSpec), [item]);
}

/**
 *  Generates list of API endpoints needed to fetch for dynamic categories.
 *  This is used to handle cases where dynamic categories are never loaded
 *  which can happen if we either add new dynamic categories or user closes
 *  stats page before categories are loaded.
 *
 */
export function getDynamicCategoriesToFetch(
  layout: RA<StatLayout>
): RA<string> {
  return Array.from(
    new Set(
      layout.flatMap(({ categories }) =>
        categories.flatMap(({ items }) =>
          filterArray(
            items.map((item) =>
              item.type === 'DefaultStat' &&
              item.itemType === 'BackEndStat' &&
              item.pathToValue === undefined &&
              item.itemName === 'phantomItem'
                ? generateStatUrl(
                    statsSpec[item.pageName].urlPrefix,
                    item.categoryName,
                    item.itemName
                  )
                : undefined
            )
          )
        )
      )
    )
  );
}

/**
 * Converts the entire layout into TSV format. Currently, it is restricted to current source
 * and current page, but it can convert the entire layout too. Skips undefined items and empty
 * categories
 *
 */
export function statsToTsv(
  layout: IR<RA<StatLayout> | undefined>,
  layoutPageIndex: number,
  sourceIndex: number
): string {
  const headers = [
    statsText.categoryName(),
    statsText.itemName(),
    statsText.itemValue(),
  ];
  const statItems = Object.entries(layout as IR<RA<StatLayout>>).flatMap(
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

/**
 * Calls the promise generator and sets the fetched item value into the layout.
 *
 */
export function useStatValueLoad<
  PROMISE_TYPE extends number | string | undefined
>(
  value: number | string | undefined,
  promiseGenerator: () => Promise<PROMISE_TYPE>,
  handleLoad: ((value: number | string) => void) | undefined
) {
  const shouldFetch = value === undefined && typeof handleLoad === 'function';
  React.useEffect(() => {
    if (!shouldFetch) return undefined;
    let destructorCalled = false;
    promiseGenerator().then((value) => {
      if (destructorCalled || value === undefined) return;
      handleLoad?.(value);
    });
    return (): void => {
      destructorCalled = true;
    };
  }, [promiseGenerator, value, handleLoad]);
}

/**
 * Used to apply fetch backend response to the items. Used only for dynamic categories.
 * Since there can be multiple dynamic categories, it doesn't change the items if
 * backend response doesn't match the item's expected API endpoint
 * Also doesn't change items if it is not a dynamic category
 *
 */
export function applyStatBackendResponse(
  backEndResponse: BackendStatsResult,
  items: RA<CustomStat | DefaultStat>,
  responseKey: string,
  formatter: (rawResult: any) => string | undefined,
  statsSpec: StatsSpec
): RA<CustomStat | DefaultStat> {
  const phantomItem = items.find(
    (item) =>
      item.type === 'DefaultStat' &&
      item.itemName === 'phantomItem' &&
      item.pathToValue === undefined
  );

  const phantomItemUrlPrefix =
    phantomItem === undefined || phantomItem.type !== 'DefaultStat'
      ? undefined
      : statsSpec[phantomItem.pageName].urlPrefix;

  const phantomItemResponseKey =
    phantomItemUrlPrefix === undefined
      ? undefined
      : generateStatUrl(
          phantomItemUrlPrefix,
          (phantomItem as DefaultStat).categoryName,
          (phantomItem as DefaultStat).itemName
        );
  const isMyResponse = phantomItemResponseKey === responseKey;
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

/**
 * Iterates over the default layout and applies backend response for dynamic categories
 * to each source and page.
 *
 */

export function useDefaultDynamicCategorySetter(
  defaultBackEndResponse: BackendStatsResult | undefined,
  setDefaultLayout: (
    previousGenerator: (
      oldLayout: RA<StatLayout> | undefined
    ) => RA<StatLayout> | undefined
  ) => void,
  statFormatterSpec: StatFormatterSpec
) {
  React.useEffect(() => {
    dynamicStatsSpec.forEach(({ responseKey, formatterGenerator }) => {
      if (
        defaultBackEndResponse !== undefined &&
        defaultBackEndResponse[responseKey] !== undefined
      ) {
        setDefaultLayout((oldLayout) =>
          oldLayout === undefined
            ? undefined
            : oldLayout.map((oldPage) => ({
                ...oldPage,
                categories: oldPage.categories.map((oldCategory) => ({
                  ...oldCategory,
                  items: applyStatBackendResponse(
                    defaultBackEndResponse,
                    oldCategory.items,
                    responseKey,
                    formatterGenerator(statFormatterSpec),
                    statsSpec
                  ),
                })),
              }))
        );
      }
    });
  }, [setDefaultLayout, defaultBackEndResponse]);
}

/**
 * Same as useDefaultDynamicCategorySetter but restricts dynamic stat category fetch updates
 * to the current layout
 *
 */
export function useDynamicCategorySetter(
  backEndResponse: BackendStatsResult | undefined,
  handleChange: (
    newCategories: (
      oldCategory: StatLayout['categories']
    ) => StatLayout['categories']
  ) => void,
  categoriesToFetch: RA<string>,
  formatterSpec: StatFormatterSpec
) {
  React.useEffect(() => {
    dynamicStatsSpec.forEach(({ responseKey, formatterGenerator }) => {
      if (
        backEndResponse !== undefined &&
        backEndResponse[responseKey] !== undefined &&
        categoriesToFetch.includes(responseKey)
      ) {
        handleChange((oldCategory) =>
          oldCategory.map((unknownCategory) => ({
            ...unknownCategory,
            items: applyStatBackendResponse(
              backEndResponse,
              unknownCategory.items,
              responseKey,
              formatterGenerator(formatterSpec),
              statsSpec
            ),
          }))
        );
      }
    });
  }, [backEndResponse, handleChange]);
}

/**
 * Generates the API endpoint url using stats spec definition
 *
 */
export function generateStatUrl(
  urlPrefix: string,
  categoryKey: string,
  itemKey: string
) {
  const urlSpecMapped = [urlPrefix, categoryKey, itemKey]
    .map((urlSpec) => (urlSpec === 'phantomItem' ? undefined : urlSpec))
    .filter((urlSpec) => urlSpec !== undefined);
  return `/stats/${urlSpecMapped.join('/')}/`;
}

/**
 * Generates new indexes to jump to when user deletes a page. For example,
 * if current page index is 3 and user deletes page index 5, then jump to index 3 (current index)
 * If user is on page 5 and deletes page 3, then go to index 4
 *
 */
export function getOffsetOne(base: number, target: number) {
  return Math.max(Math.min(Math.sign(target - base - 1), 0) + base, 0);
}
export const setLayoutUndefined = (layout: StatLayout): StatLayout => ({
  label: layout.label,
  categories: layout.categories.map((category) => ({
    label: category.label,
    items: category.items?.map((item) => ({
      ...item,
      itemValue: undefined,
    })),
  })),
  lastUpdated: undefined,
});
export function applyRefreshLayout(
  layout: RA<StatLayout> | undefined,
  refreshTimeMinutes: number
): RA<StatLayout> | undefined {
  return layout?.map((pageLayout) => {
    if (pageLayout.lastUpdated == undefined) return pageLayout;
    const lastUpdatedParsed = new Date(pageLayout.lastUpdated).valueOf();
    const currentTime = Date.now();
    if (isNaN(lastUpdatedParsed) || isNaN(currentTime)) return pageLayout;
    const timeDiffMillSecond = Math.round(currentTime - lastUpdatedParsed);
    if (timeDiffMillSecond < 0) return pageLayout;
    const timeDiffMinute = Math.floor(timeDiffMillSecond / (MILLISECONDS * 60));
    if (timeDiffMinute >= refreshTimeMinutes)
      return setLayoutUndefined(pageLayout);
    return pageLayout;
  });
}
