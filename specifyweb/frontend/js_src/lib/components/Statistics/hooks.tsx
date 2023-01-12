import { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import type { IR, RA, WritableArray } from '../../utils/types';
import { useMultipleAsyncState } from '../../hooks/useAsyncState';
import React from 'react';
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
  StatSpecCalculated,
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
import { unknownCategories, urlSpec } from './definitions';
import { SerializedResource } from '../DataModel/helperTypes';

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
        throttledAjax<BackendStatsResult, string>(
          'backendStats',
          async () =>
            ajax<BackendStatsResult>(urlSpec[key as keyof typeof urlSpec], {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
            }).then(({ data }) => data),
          urlSpec[key as keyof typeof urlSpec]
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
                  items: (categories as () => StatCategoryReturn)(),
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
    const listToUse = layout.categories.flatMap(({ items }) =>
      (items ?? []).filter(
        (item): item is DefaultStat => item.type === 'DefaultStat'
      )
    );
    let statNotFound = false;
    const defaultLayoutFlagged = defaultLayout.map((defaultLayoutPage) => ({
      label: defaultLayoutPage.label,
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
        itemType: spec.type === 'BackEndStat' ? 'BackendStat' : 'QueryStat',
        pathToValue: spec.type === 'BackEndStat' ? spec.pathToValue : undefined,
      }));

export function useDefaultLayout(statsSpec: StatsSpec): StatLayout {
  return React.useMemo(
    () =>
      Object.entries(statsSpec).map(([pageName, pageStatsSpec]) => ({
        label: pageName,
        categories: Object.entries(pageStatsSpec).map(
          ([categoryName, { label, items }]) => ({
            label,
            items: unknownCategories.includes(
              categoryName as keyof typeof urlSpec
            )
              ? undefined
              : statSpecToItems(categoryName, pageName, items),
            categoryToFetch: unknownCategories.includes(
              categoryName as keyof typeof urlSpec
            )
              ? (categoryName as keyof typeof urlSpec)
              : undefined,
          })
        ),
        lastUpdated: undefined,
      })),
    [statsSpec]
  );
}

export function queryCountPromiseGenerator(
  query: SpecifyResource<SpQuery>
): () => Promise<string> {
  return async () => {
    const ajaxPromise = ajax<{
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
    return ajaxPromise;
  };
}

export function useResolvedSpec(
  statSpecItem:
    | { readonly label: string; readonly spec: StatItemSpec }
    | undefined,
  itemLabel: string,
  pathToValueLayout: string | undefined
): StatSpecCalculated {
  return React.useMemo(() => {
    if (statSpecItem?.spec.type === 'BackEndStat') {
      return pathToValueLayout === undefined &&
        statSpecItem?.spec.pathToValue === undefined
        ? undefined
        : {
            type: 'BackEndStat',
            pathToValue: pathToValueLayout ?? statSpecItem?.spec.pathToValue,
            urlToFetch: statSpecItem?.spec.urlToFetch,
            formatter: statSpecItem?.spec.formatter,
          };
    } else {
      return statSpecItem?.spec.tableName !== undefined &&
        statSpecItem?.spec.fields !== undefined
        ? {
            type: 'QueryStat',
            tableName: statSpecItem?.spec.tableName,
            fields: statSpecItem?.spec.fields,
            label: itemLabel,
          }
        : undefined;
    }
  }, [statSpecItem, itemLabel, pathToValueLayout]);
}

export const useResolvedSpecToQueryResource = (
  statSpecCalculated: StatSpecCalculated
): SpecifyResource<SpQuery> | undefined =>
  React.useMemo(
    () =>
      statSpecCalculated?.type === 'QueryStat'
        ? deserializeResource(
            addMissingFields('SpQuery', {
              name: statSpecCalculated.label,
              contextName: statSpecCalculated.tableName,
              contextTableId:
                schema.models[statSpecCalculated.tableName].tableId,
              countOnly: false,
              selectDistinct: false,
              fields: statSpecCalculated.fields.map(
                ({ path, ...field }, index) =>
                  serializeResource(
                    makeQueryField(statSpecCalculated.tableName, path, {
                      ...field,
                      position: index,
                    })
                  )
              ),
            })
          )
        : undefined,
    [statSpecCalculated]
  );
export const querySpecToResource = (
  label: string,
  tableName: keyof Tables,
  fields: RA<
    Partial<SerializedResource<SpQueryField>> & { readonly path: string }
  >
): SpecifyResource<SpQuery> =>
  deserializeResource(
    addMissingFields('SpQuery', {
      name: label,
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
  );

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
            item.itemType === 'BackendStat' &&
            item.itemValue === undefined
          )
            categoriesToFetch.push(item.categoryName);
        });
      })
    );
    return categoriesToFetch.filter((categoryToFetch) =>
      unknownCategories.includes(categoryToFetch as keyof typeof urlSpec)
    );
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
    statsText('source'),
    statsText('pageName'),
    statsText('categoryName'),
    statsText('itemName'),
    statsText('itemValue'),
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

export const newLabelIndex = (itemLabel: string) => {
  const labelRegEx = new RegExp(
    `^\\s*${itemLabel}\\s*\\(\\s*\\d\\s*\\)\\s*$`,
    'u'
  );
};
