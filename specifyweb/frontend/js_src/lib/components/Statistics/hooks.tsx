import React from 'react';

import { useMultipleAsyncState } from '../../hooks/useAsyncState';
import { statsText } from '../../localization/stats';
import type { AjaxResponseObject } from '../../utils/ajax';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { throttledPromise } from '../../utils/ajax/throttledPromise';
import type { IR, RA } from '../../utils/types';
import { filterArray, localized } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import { MINUTE } from '../Atoms/timeUnits';
import { addMissingFields } from '../DataModel/addMissingFields';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  deserializeResource,
  serializeResource,
} from '../DataModel/serializers';
import { genericTables } from '../DataModel/tables';
import type { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import { makeQueryField } from '../QueryBuilder/fromTree';
import { backEndStatsSpec, dynamicStatsSpec, statsSpec } from './StatsSpec';
import type {
  BackEndStatResolve,
  BackendStatsResult,
  CustomStat,
  DefaultStat,
  DynamicQuerySpec,
  PartialQueryFieldWithPath,
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

export function useDynamicGroups(
  dynamicEphemeralFieldSpecs: RA<DynamicQuerySpec>
): IR<RA<string> | undefined> | undefined {
  const dynamicEphereralPromises = React.useMemo(
    () =>
      dynamicEphemeralFieldSpecs.length === 0
        ? undefined
        : dynamicEphermeralPromiseGenerator(dynamicEphemeralFieldSpecs),
    [dynamicEphemeralFieldSpecs]
  );
  const [dynamicEphemeralResults] = useMultipleAsyncState(
    dynamicEphereralPromises,
    false
  );
  return dynamicEphemeralResults;
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
            ajax<BackendStatsResult>(key, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
              expectedErrors: [Http.FORBIDDEN],
            }).then(({ data, status }) =>
              status === Http.FORBIDDEN ? undefined : data
            ),
          key
        ),
    ])
  );
}
// REFACTOR: use runQuery() function once merged with xml-editor
function dynamicEphermeralPromiseGenerator(
  dynamicEphemeralFieldSpecs: RA<DynamicQuerySpec>
): IR<() => Promise<RA<string> | undefined>> {
  return Object.fromEntries(
    dynamicEphemeralFieldSpecs.map(({ key, spec }) => [
      key,
      async () =>
        throttledPromise<RA<string> | undefined>(
          'queryStats',
          async () =>
            ajax<{ readonly results: RA<RA<number | string | null>> }>(
              '/stored_query/ephemeral/',
              {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                },
                body: keysToLowerCase({
                  ...serializeResource(
                    querySpecToResource(statsText.statistics(), spec)
                  ),
                  limit: 0,
                }),
                expectedErrors: Object.values(Http),
              }
            ).then(({ data }) =>
              filterArray(
                data.results.map(([_id, distinctGroup]) =>
                  distinctGroup === null ? undefined : distinctGroup.toString()
                )
              )
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
  query: SerializedResource<SpQuery>
): () => Promise<AjaxResponseObject<{ readonly count: number }>> {
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
        ...query,
        countOnly: true,
      }),
      expectedErrors: Object.values(Http),
    });
}

export const makeSerializedFieldsFromPaths = (
  tableName: keyof Tables,
  fields: RA<PartialQueryFieldWithPath>
): RA<SerializedResource<SpQueryField>> =>
  fields.map(({ path, ...field }, index) =>
    serializeResource(
      makeQueryField(tableName, path, {
        ...field,
        position: index,
      })
    )
  );

export const querySpecToResource = (
  label: string,
  querySpec: QuerySpec
): SpecifyResource<SpQuery> =>
  deserializeResource(
    addMissingFields('SpQuery', {
      name: label,
      contextName: querySpec.tableName,
      contextTableId: genericTables[querySpec.tableName].tableId,
      countOnly: false,
      selectDistinct: querySpec.isDistinct ?? false,
      searchSynonymy: querySpec.searchSynonymy ?? false,
      fields: makeSerializedFieldsFromPaths(
        querySpec.tableName,
        querySpec.fields
      ),
    })
  );

export function resolveStatsSpec(
  item: CustomStat | DefaultStat,
  formatterSpec: StatFormatterSpec
): BackEndStatResolve | QueryBuilderStat | undefined {
  if (item.type === 'CustomStat') {
    return {
      type: 'QueryStat',
      querySpec: item.querySpec,
    };
  }
  const statSpecItem =
    statsSpec[item.pageName]?.categories?.[item.categoryName]?.items?.[
      item.itemName
    ];
  if (statSpecItem === undefined) return undefined;
  const statUrl = generateStatUrl(
    statsSpec[item.pageName].urlPrefix,
    item.categoryName,
    item.itemName
  );
  if (statSpecItem.spec.type === 'BackEndStat') {
    const pathToValue = item.pathToValue ?? statSpecItem.spec.pathToValue;
    return {
      type: 'BackEndStat',
      pathToValue,
      fetchUrl: statUrl,
      formatter: statSpecItem.spec.formatterGenerator(formatterSpec),
      querySpec:
        pathToValue === undefined
          ? undefined
          : statSpecItem.spec.querySpec?.(pathToValue.toString()),
    };
  }
  if (
    statSpecItem.spec.type === 'DynamicStat' &&
    item.pathToValue !== undefined
  ) {
    const querySpec = statSpecItem.spec.querySpec(item.pathToValue.toString());
    return {
      type: 'QueryStat',
      querySpec,
    };
  }
  if (statSpecItem.spec.type === 'QueryStat')
    return {
      type: 'QueryStat',
      querySpec: statSpecItem.spec.querySpec,
    };
  return undefined;
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
export function getBackendUrlToFetch(layout: RA<StatLayout>): RA<string> {
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

export function getDynamicQuerySpecsToFetch(
  layout: RA<StatLayout>
): RA<DynamicQuerySpec> {
  return layout.flatMap(({ categories }) =>
    categories.flatMap(({ items }) =>
      filterArray(
        items.map((item) => {
          if (item.type === 'DefaultStat' && item.itemType === 'DynamicStat') {
            const itemKey = generateStatUrl(
              statsSpec[item.pageName].urlPrefix,
              item.categoryName,
              item.itemName
            );
            const dynamicSpec = dynamicStatsSpec.find(
              ({ responseKey }) => responseKey === itemKey
            );
            if (dynamicSpec !== undefined) {
              return {
                key: itemKey,
                spec: dynamicSpec.dynamicQuerySpec,
              };
            }
          }
          return undefined;
        })
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
      item.itemType === 'BackEndStat' &&
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
          label: localized(itemName),
          itemValue: formatter(rawValue),
          itemType: 'BackEndStat',
          pathToValue: itemName,
        })
      )
    : items;
}

/**
 * Iterates over the default layout and applies backend response for backend categories
 * to each source and page.
 *
 */

export function useDefaultBackendCategorySetter(
  defaultBackEndResponse: BackendStatsResult | undefined,
  setDefaultLayout: (
    previousGenerator: (
      oldLayout: RA<StatLayout> | undefined
    ) => RA<StatLayout> | undefined
  ) => void,
  statFormatterSpec: StatFormatterSpec
) {
  React.useEffect(() => {
    backEndStatsSpec.forEach(({ responseKey, formatterGenerator }) => {
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
export function useBackEndCategorySetter(
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
    backEndStatsSpec.forEach(({ responseKey, formatterGenerator }) => {
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

export function useDynamicCategorySetter(
  dynamicEphemeralResponse: IR<RA<string> | undefined> | undefined,
  handleChange: (
    newCategories: (
      oldCategory: StatLayout['categories']
    ) => StatLayout['categories']
  ) => void
) {
  React.useEffect(() => {
    dynamicStatsSpec.forEach(({ responseKey }) => {
      if (
        dynamicEphemeralResponse !== undefined &&
        dynamicEphemeralResponse[responseKey] !== undefined
      ) {
        handleChange((oldCategory) =>
          oldCategory.map((dynamicCategory) => ({
            ...dynamicCategory,
            items: applyDynamicCategoryResponse(
              dynamicEphemeralResponse[responseKey],
              dynamicCategory.items,
              responseKey,
              statsSpec
            ),
          }))
        );
      }
    });
  }, [handleChange, dynamicEphemeralResponse]);
}

export function useDefaultDynamicCategorySetter(
  defaultDynamicEphemeralResponse: IR<RA<string> | undefined> | undefined,
  setDefaultLayout: (
    previousGenerator: (
      oldLayout: RA<StatLayout> | undefined
    ) => RA<StatLayout> | undefined
  ) => void
) {
  React.useEffect(() => {
    dynamicStatsSpec.forEach(({ responseKey }) => {
      if (
        defaultDynamicEphemeralResponse !== undefined &&
        defaultDynamicEphemeralResponse[responseKey] !== undefined
      ) {
        setDefaultLayout((oldLayout) =>
          oldLayout === undefined
            ? undefined
            : oldLayout.map((oldPage) => ({
                ...oldPage,
                categories: oldPage.categories.map((oldCategory) => ({
                  ...oldCategory,
                  items: applyDynamicCategoryResponse(
                    defaultDynamicEphemeralResponse[responseKey],
                    oldCategory.items,
                    responseKey,
                    statsSpec
                  ),
                })),
              }))
        );
      }
    });
  }, [defaultDynamicEphemeralResponse, setDefaultLayout]);
}

function applyDynamicCategoryResponse(
  dynamicEphemeralResponse: RA<string> | undefined,
  items: RA<CustomStat | DefaultStat>,
  responseKey: string,
  statsSpec: StatsSpec
): RA<CustomStat | DefaultStat> {
  if (dynamicEphemeralResponse === undefined) return items;
  const dynamicPhantomItem = items.find(
    (item) =>
      item.type === 'DefaultStat' &&
      item.itemType === 'DynamicStat' &&
      item.pathToValue === undefined
  );
  const dynamicPhantomUrlPrefix =
    dynamicPhantomItem === undefined || dynamicPhantomItem.type === 'CustomStat'
      ? undefined
      : statsSpec[dynamicPhantomItem.pageName].urlPrefix;
  const dynamicPhantomItemResponseKey =
    dynamicPhantomUrlPrefix === undefined
      ? undefined
      : generateStatUrl(
          dynamicPhantomUrlPrefix,
          (dynamicPhantomItem as DefaultStat).categoryName,
          (dynamicPhantomItem as DefaultStat).itemName
        );
  const isMyResponse = dynamicPhantomItemResponseKey === responseKey;
  return dynamicPhantomItem !== undefined &&
    isMyResponse &&
    dynamicPhantomItem.type === 'DefaultStat'
    ? dynamicEphemeralResponse.map((pathToValue) => ({
        type: 'DefaultStat',
        pageName: dynamicPhantomItem.pageName,
        itemName: 'dynamicPhantomItem',
        categoryName: dynamicPhantomItem.categoryName,
        label: localized(pathToValue),
        itemValue: undefined,
        itemType: 'QueryStat',
        pathToValue,
      }))
    : items;
}

/**
 * Generates the API endpoint url using stats spec definition
 *
 */
export function generateStatUrl(
  urlPrefix: string,
  categoryKey: string,
  itemKey: string
): string {
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
export const getOffsetOne = (base: number, target: number): number =>
  Math.max(Math.min(Math.sign(target - base - 1), 0) + base, 0);

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
    if (pageLayout.lastUpdated === undefined) return pageLayout;
    const lastUpdatedParsed = new Date(pageLayout.lastUpdated).valueOf();
    const currentTime = Date.now();
    if (Number.isNaN(lastUpdatedParsed) || Number.isNaN(currentTime))
      return pageLayout;
    const timeDiffMillSecond = Math.round(currentTime - lastUpdatedParsed);
    if (timeDiffMillSecond < 0) return pageLayout;
    const timeDiffMinute = Math.floor(timeDiffMillSecond / MINUTE);
    if (timeDiffMinute >= refreshTimeMinutes)
      return setLayoutUndefined(pageLayout);
    return pageLayout;
  });
}
