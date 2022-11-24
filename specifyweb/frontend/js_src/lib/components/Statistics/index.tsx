import React from 'react';
import type { State } from 'typesafe-reducer';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { ajax } from '../../utils/ajax';
import type { IR, RA } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { H2, H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import type { SerializedResource } from '../DataModel/helperTypes';
import { fetchResource, strictIdFromUrl } from '../DataModel/resource';
import type { SpQueryField, Tables } from '../DataModel/types';

import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { QueryList, useQueries } from '../Toolbar/Query';
import { usePref } from '../UserPreferences/usePref';
import type { StatLayout } from './definitions';
import type { CustomStat, DefaultStat } from './definitions';
import type { StatCategoryReturn } from './StatsSpec';
import { statsSpec } from './StatsSpec';
import type { BackendStatsResult } from './utils';
import { StatsResult, useFrontEndStat, useFrontEndStatsQuery } from './utils';
import { userInformation } from '../InitialContext/userInformation';

function useBackendApi(): BackendStatsResult | undefined {
  const [backendStatObject] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<BackendStatsResult>('/statistics/collection/global/', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }).then(({ data }) => data),
      []
    ),
    false
  );
  return backendStatObject;
}

function useStatsSpec(): IR<
  IR<{
    readonly label: string;
    readonly items: StatCategoryReturn;
  }>
> {
  const backEndResult = useBackendApi();
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

function useDefaultStatsToAdd(
  layout: {
    readonly label: string;
    readonly categories: RA<{
      readonly label: string;
      readonly items: RA<CustomStat | DefaultStat>;
    }>;
  },
  defaultLayout: StatLayout
): StatLayout {
  return React.useMemo((): StatLayout => {
    const listToUse = layout.categories.flatMap(({ items }) =>
      items.filter((item): item is DefaultStat => item.type === 'DefaultStat')
    );
    return defaultLayout.map((defaultLayoutPage) => ({
      label: defaultLayoutPage.label,
      categories: defaultLayoutPage.categories
        .map(({ label, items }) => ({
          label,
          items: items.filter(
            (defaultItem) =>
              defaultItem.type === 'DefaultStat' &&
              !listToUse.some(
                ({ pageName, categoryName, itemName }) =>
                  pageName === defaultItem.pageName &&
                  categoryName === defaultItem.categoryName &&
                  itemName === defaultItem.itemName
              )
          ),
        }))
        .filter(({ items }) => items.length > 0),
    }));
  }, [layout, defaultLayout]);
}

export function StatsPage(): JSX.Element {
  const [customLayout, setLayout] = usePref(
    'statistics',
    'appearance',
    'layout'
  );
  const statsSpec = useStatsSpec();

  const defaultLayout = useDefaultLayout(statsSpec);
  const layout = customLayout ?? defaultLayout;
  const [state, setState] = React.useState<
    | State<
        'EditingState',
        {
          readonly addingItem:
            | {
                readonly pageIndex: number;
                readonly categoryIndex: number;
              }
            | undefined;
        }
      >
    | State<'DefaultState'>
  >({ type: 'DefaultState' });
  const isEditing = state.type === 'EditingState';
  const isAddingItem = isEditing && state.addingItem !== undefined;
  const [activePageIndex, setActivePageIndex] = React.useState<number>(0);
  const defaultStatsToAdd = useDefaultStatsToAdd(
    layout[activePageIndex],
    defaultLayout
  );
  console.log(defaultStatsToAdd);

  return (
    <>
      {isAddingItem && (
        <AddStatDialog
          defaultLayout={defaultStatsToAdd}
          statsSpec={statsSpec}
          onAdd={(item): void =>
            isAddingItem
              ? setLayout(
                  replaceItem(layout, activePageIndex, {
                    ...layout[activePageIndex],
                    categories: replaceItem(
                      layout[activePageIndex].categories,
                      state.addingItem.categoryIndex,
                      {
                        ...layout[activePageIndex].categories[
                          state.addingItem.categoryIndex
                        ],
                        items: [
                          ...layout[activePageIndex].categories[
                            state.addingItem.categoryIndex
                          ].items,
                          item,
                        ],
                      }
                    ),
                  })
                )
              : undefined
          }
          onClose={(): void =>
            setState({
              type: 'EditingState',
              addingItem: undefined,
            })
          }
        />
      )}
      <div className="h-full w-full bg-[color:var(--form-background)]">
        <div className="mx-auto flex h-full max-w-[min(100%,var(--form-max-width))] flex-col gap-4 overflow-y-auto  p-4 ">
          <div className="flex items-center gap-2">
            <H2 className="text-2xl">{statsText('collectionStatistics')}</H2>
            <span className="-ml-2 flex-1" />
            {isEditing && (
              <Button.Red onClick={(): void => setLayout(defaultLayout)}>
                {commonText('reset')}
              </Button.Red>
            )}
            <Button.Green
              onClick={(): void =>
                setState(
                  isEditing
                    ? { type: 'DefaultState' }
                    : {
                        type: 'EditingState',
                        addingItem: undefined,
                      }
                )
              }
            >
              {isEditing ? commonText('save') : commonText('edit')}
            </Button.Green>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
            <CategoriesBoxes
              goToEditingState={(categoryindex): void =>
                setState({
                  type: 'EditingState',
                  addingItem: {
                    pageIndex: activePageIndex,
                    categoryIndex: categoryindex,
                  },
                })
              }
              isEditing={isEditing}
              pageLayout={layout[activePageIndex]}
              statsSpec={statsSpec}
              onClick={undefined}
              onRemove={
                isEditing
                  ? (categoryIndex, itemIndex): void =>
                      setLayout(
                        replaceItem(layout, activePageIndex, {
                          ...layout[activePageIndex],
                          categories: replaceItem(
                            layout[activePageIndex].categories,
                            categoryIndex,
                            {
                              ...layout[activePageIndex].categories[
                                categoryIndex
                              ],
                              items: removeItem(
                                layout[activePageIndex].categories[
                                  categoryIndex
                                ].items,
                                itemIndex
                              ),
                            }
                          ),
                        })
                      )
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}

function AddStatDialog({
  onClose: handleClose,
  onAdd: handleAdd,
  defaultLayout,
  statsSpec,
}: {
  readonly onClose: () => void;
  readonly onAdd: (item: CustomStat | DefaultStat) => void;
  readonly defaultLayout: StatLayout;
  readonly statsSpec: IR<
    IR<{
      readonly label: string;
      readonly items: StatCategoryReturn;
    }>
  >;
}): JSX.Element | null {
  const filters = React.useMemo(
    () => ({
      specifyUser: userInformation.id,
    }),
    []
  );
  const queries = useQueries(filters);
  const defaultStatsAddLeft = defaultLayout.filter(
    ({ categories }) => categories.length > 0
  );
  return Array.isArray(queries) ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText('close')}</Button.DialogClose>}
      className={{
        container: dialogClassNames.wideContainer,
      }}
      header={statsText('chooseStatistics')}
      onClose={handleClose}
    >
      <div>
        <H3>{statsText('selectCustomStatistics')}</H3>
        {Array.isArray(queries) && (
          <QueryList
            getQuerySelectCallback={(query) => () => {
              handleAdd({ type: 'CustomStat', queryId: query.id });
              handleClose();
            }}
            isReadOnly
            queries={queries}
          />
        )}
      </div>
      <div>
        {defaultStatsAddLeft.length > 0 && (
          <div>
            <H3>{statsText('selectDefaultStatistics')}</H3>
            {defaultStatsAddLeft.map((defaultLayoutItem, index) => (
              <div key={index}>
                <H3>{defaultLayoutItem.label}</H3>
                <div>
                  <CategoriesBoxes
                    goToEditingState={(): void => {}}
                    isEditing={false}
                    pageLayout={defaultLayoutItem}
                    statsSpec={statsSpec}
                    onClick={(item): void => {
                      handleAdd(item);
                      handleClose();
                    }}
                    onRemove={undefined}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  ) : null;
}

function CategoriesBoxes({
  pageLayout,
  statsSpec,
  isEditing,
  goToEditingState,
  onClick: handleClick,
  onRemove: handleRemove,
}: {
  readonly pageLayout: {
    readonly label: string;
    readonly categories: RA<{
      readonly label: string;
      readonly items: RA<CustomStat | DefaultStat>;
    }>;
  };
  readonly statsSpec: IR<
    IR<{
      readonly label: string;
      readonly items: StatCategoryReturn;
    }>
  >;
  readonly isEditing: boolean;
  readonly goToEditingState: (categoryIndex: number) => void;
  readonly onClick: ((item: CustomStat | DefaultStat) => void) | undefined;
  readonly onRemove:
    | ((categoryIndex: number, itemIndex: number) => void)
    | undefined;
}): JSX.Element {
  return (
    <>
      {pageLayout.categories.map(({ label, items }, categoryIndex) => (
        <div
          className="flex h-auto max-h-80 flex-col content-center rounded border-[1px] border-black bg-white p-4"
          key={categoryIndex}
        >
          <H3 className="font-bold">{label}</H3>
          <div className="overflow-auto pr-4">
            {items?.map((item, itemIndex) => {
              return item.type === 'DefaultStat' ? (
                <DefaultStatItem
                  categoryName={item.categoryName}
                  itemName={item.itemName}
                  pageName={item.pageName}
                  key={itemIndex}
                  statsSpec={statsSpec}
                  onClick={
                    handleClick !== undefined
                      ? (): void => {
                          handleClick({
                            type: 'DefaultStat',
                            pageName: item.pageName,
                            categoryName: item.categoryName,
                            itemName: item.itemName,
                          });
                        }
                      : undefined
                  }
                  onRemove={
                    handleRemove === undefined
                      ? undefined
                      : () => handleRemove(categoryIndex, itemIndex)
                  }
                />
              ) : (
                <CustomStatItem
                  key={itemIndex}
                  queryId={item.queryId}
                  onClick={
                    handleClick !== undefined
                      ? (): void => {
                          handleClick({
                            type: 'CustomStat',
                            queryId: item.queryId,
                          });
                        }
                      : undefined
                  }
                  onRemove={
                    handleRemove === undefined
                      ? undefined
                      : (): void => handleRemove(categoryIndex, itemIndex)
                  }
                />
              );
            })}
          </div>
          {isEditing && (
            <Button.LikeLink
              onClick={(): void => goToEditingState(categoryIndex)}
            >
              <span className={className.dataEntryAdd}>{icons.plus}</span>
              {commonText('add')}
            </Button.LikeLink>
          )}
        </div>
      ))}
    </>
  );
}

function useDefaultLayout(
  statsSpec: IR<
    IR<{
      readonly label: string;
      readonly items: StatCategoryReturn | undefined;
    }>
  >
): StatLayout {
  return React.useMemo(
    () =>
      Object.entries(statsSpec).map(([pageName, pageStatsSpec]) => ({
        label: pageName,
        categories: Object.entries(pageStatsSpec).map(
          ([categoryName, { label, items }]) => ({
            label,
            items: Object.entries(items ?? {}).map(([itemName]) => ({
              type: 'DefaultStat',
              pageName: pageName,
              categoryName,
              itemName,
            })),
          })
        ),
      })),
    [statsSpec]
  );
}

function useCustomStatQueryBuilderSpec(queryId: number):
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

function DefaultStatItem({
  statsSpec,
  pageName,
  categoryName,
  itemName,
  onRemove: handleRemove,
  onClick: handleClick,
}: {
  readonly statsSpec: IR<
    IR<{
      readonly label: string;
      readonly items: StatCategoryReturn;
    }>
  >;
  readonly pageName: string;
  readonly categoryName: keyof typeof statsSpec;
  readonly itemName: string;
  readonly onRemove: (() => void) | undefined;
  readonly onClick: (() => void) | undefined;
}): JSX.Element {
  const statSpecItemPage = statsSpec[pageName];
  const statSpecItemObject = statSpecItemPage[categoryName]?.items;
  const statSpecItem =
    statSpecItemObject === undefined ? undefined : statSpecItemObject[itemName];
  const statValue =
    statSpecItem === undefined ? undefined : statSpecItem.spec.type ===
      'Querybuildstat' ? (
      <QueryBuilderStat
        fields={statSpecItem.spec.fields}
        statLabel={statSpecItem.label}
        tableName={statSpecItem.spec.tableName}
        onClick={handleClick}
        onRemove={handleRemove}
      />
    ) : (
      <StatsResult
        query={undefined}
        statLabel={statSpecItem?.label}
        statValue={statSpecItem.spec.value}
        onClick={handleClick}
        onRemove={handleRemove}
      />
    );
  return statValue ?? <p> {commonText('loading')}</p>;
}

function CustomStatItem({
  queryId,
  onRemove: handleRemove,
  onClick: handleClick,
}: {
  readonly queryId: number;
  readonly onRemove: (() => void) | undefined;
  readonly onClick: (() => void) | undefined;
}): JSX.Element {
  const { tableName, fields, label } =
    useCustomStatQueryBuilderSpec(queryId) ?? {};
  const statValue =
    tableName === undefined ||
    fields === undefined ||
    label === undefined ? undefined : (
      <QueryBuilderStat
        fields={fields}
        statLabel={label}
        tableName={tableName}
        onClick={handleClick}
        onRemove={handleRemove}
      />
    );
  return statValue ?? <p>{commonText('loading')}</p>;
}

function QueryBuilderStat({
  tableName,
  fields,
  statLabel,
  onRemove: handleRemove,
  onClick: handleClick,
}: {
  readonly tableName: keyof Tables;
  readonly fields: RA<
    Partial<SerializedResource<SpQueryField>> & { readonly path: string }
  >;
  readonly statLabel: string;
  readonly onRemove: (() => void) | undefined;
  readonly onClick: (() => void) | undefined;
}): JSX.Element {
  const frontEndQuery = useFrontEndStatsQuery(tableName, fields);
  const frontEndStatValue = useFrontEndStat(frontEndQuery);
  return frontEndStatValue === undefined ? (
    <p>{commonText('loading')}</p>
  ) : (
    <StatsResult
      query={frontEndQuery}
      statLabel={statLabel}
      statValue={frontEndStatValue}
      onClick={handleClick}
      onRemove={handleRemove}
    />
  );
}
