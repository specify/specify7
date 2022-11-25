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
import type { SerializedResource } from '../DataModel/helperTypes';
import { fetchResource, strictIdFromUrl } from '../DataModel/resource';
import type { SpQueryField, Tables } from '../DataModel/types';

import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { QueryList, useQueries } from '../Toolbar/Query';
import { usePref } from '../UserPreferences/usePref';
import type { StatLayout } from './types';
import type { CustomStat, DefaultStat } from './types';
import type { StatCategoryReturn } from './StatsSpec';
import { statsSpec } from './StatsSpec';
import type { BackendStatsResult } from './utils';
import { StatsResult, useFrontEndStat, useFrontEndStatsQuery } from './utils';
import { userInformation } from '../InitialContext/userInformation';
import { SpQuery } from '../DataModel/types';
import { awaitPrefsSynced } from '../UserPreferences/helpers';
import { softFail } from '../Errors/Crash';
import { useId } from '../../hooks/useId';
import { Form, Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';

/**
 * Fetch backend statistics from the API
 */
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
    | State<'EditingState'>
    | State<
        'AddingState',
        {
          readonly pageIndex: number;
          readonly categoryIndex: number;
        }
      >
    | State<'DefaultState'>
    | State<
        'DialogRenameState',
        {
          readonly pageIndex: number | undefined;
        }
      >
  >({ type: 'DefaultState' });

  const isAddingItem = state.type === 'AddingState';
  const isEditing = state.type === 'EditingState' || isAddingItem;
  const [activePageIndex, setActivePageIndex] = React.useState<number>(0);
  const defaultStatsToAdd = useDefaultStatsToAdd(
    layout[activePageIndex],
    defaultLayout
  );
  const filters = React.useMemo(
    () => ({
      specifyUser: userInformation.id,
    }),
    []
  );
  const queries = useQueries(filters, false);
  const previousLayout = React.useRef(layout);

  return (
    <Form
      className={className.containerFullGray}
      onSubmit={(): void => {
        setState({ type: 'DefaultState' });
        awaitPrefsSynced().catch(softFail);
      }}
    >
      <div className="flex items-center gap-2">
        <H2 className="text-2xl">{commonText('statistics')}</H2>
        <span className="-ml-2 flex-1" />
        {isEditing ? (
          <>
            <Button.Red onClick={(): void => setLayout(defaultLayout)}>
              {commonText('reset')}
            </Button.Red>
            <Button.Red
              onClick={(): void => {
                setLayout(previousLayout.current);
                setState({ type: 'DefaultState' });
              }}
            >
              {commonText('cancel')}
            </Button.Red>
            <Submit.Green>{commonText('save')}</Submit.Green>
          </>
        ) : (
          <Button.Green
            onClick={(): void => {
              setState({
                type: 'EditingState',
              });
              previousLayout.current = layout;
            }}
          >
            {commonText('edit')}
          </Button.Green>
        )}
      </div>
      <div className="flex flex-col overflow-hidden">
        <div className="flex flex-col gap-2 overflow-y-hidden  md:flex-row">
          <aside
            className={`
                top-0 flex min-w-fit flex-1 flex-col divide-y-4 !divide-[color:var(--form-background)]
                md:sticky
            `}
          >
            {layout.map(({ label }, pageIndex) => (
              <PageButton
                key={pageIndex}
                label={label}
                isActive={pageIndex === activePageIndex}
                onDialogOpen={
                  isEditing
                    ? (): void => {
                        setState({
                          type: 'DialogRenameState',
                          pageIndex,
                        });
                      }
                    : undefined
                }
                onClick={(): void => {
                  setActivePageIndex(pageIndex);
                }}
              />
            ))}
            {isEditing && (
              <PageButton
                onClick={(): void => {
                  setState({
                    type: 'DialogRenameState',
                    pageIndex: undefined,
                  });
                }}
                isActive={false}
                label={commonText('add')}
                onDialogOpen={undefined}
              />
            )}
          </aside>
          {state.type === 'DialogRenameState' && (
            <PageName
              onClick={
                typeof state.pageIndex === 'number'
                  ? (): void => {
                      setLayout(removeItem(layout, state.pageIndex!));
                      setState({
                        type: 'EditingState',
                      });
                    }
                  : undefined
              }
              onRename={
                typeof state.pageIndex === 'number'
                  ? (value): void => {
                      setLayout(
                        replaceItem(layout, state.pageIndex!, {
                          ...layout[state.pageIndex!],
                          label: value,
                        })
                      );
                      setState({
                        type: 'EditingState',
                      });
                    }
                  : (value): void => {
                      setLayout([
                        ...layout,
                        {
                          label: value,
                          categories: [],
                        },
                      ]);
                      setState({
                        type: 'EditingState',
                      });
                      setActivePageIndex(layout.length);
                    }
              }
              onClose={(): void => {
                setState({ type: 'EditingState' });
              }}
              value={
                typeof state.pageIndex === 'number'
                  ? layout[state.pageIndex].label
                  : undefined
              }
            />
          )}
          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4 overflow-y-auto">
            <CategoriesBoxes
              onAdd={
                isEditing
                  ? (categoryindex): void =>
                      typeof categoryindex === 'number'
                        ? setState({
                            type: 'AddingState',
                            pageIndex: activePageIndex,
                            categoryIndex: categoryindex,
                          })
                        : setLayout(
                            replaceItem(layout, activePageIndex, {
                              ...layout[activePageIndex],
                              categories: [
                                ...layout[activePageIndex].categories,
                                {
                                  label: '',
                                  items: [],
                                },
                              ],
                            })
                          )
                  : undefined
              }
              pageLayout={layout[activePageIndex]}
              statsSpec={statsSpec}
              onClick={undefined}
              onRemove={
                isEditing
                  ? (categoryIndex, itemIndex): void =>
                      setLayout(
                        replaceItem(layout, activePageIndex, {
                          ...layout[activePageIndex],
                          categories:
                            typeof itemIndex === 'number'
                              ? replaceItem(
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
                                )
                              : removeItem(
                                  layout[activePageIndex].categories,
                                  categoryIndex
                                ),
                        })
                      )
                  : undefined
              }
              onRename={
                isEditing
                  ? (newName, categoryIndex): void =>
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
                              label: newName,
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

      {state.type === 'AddingState' && (
        <AddStatDialog
          defaultLayout={defaultStatsToAdd}
          statsSpec={statsSpec}
          queries={queries}
          onAdd={(item): void =>
            isAddingItem
              ? setLayout(
                  replaceItem(layout, activePageIndex, {
                    ...layout[activePageIndex],
                    categories: replaceItem(
                      layout[activePageIndex].categories,
                      state.categoryIndex,
                      {
                        ...layout[activePageIndex].categories[
                          state.categoryIndex
                        ],
                        items: [
                          ...layout[activePageIndex].categories[
                            state.categoryIndex
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
            })
          }
        />
      )}
    </Form>
  );
}

function PageName({
  value,
  onClick: handleClick,
  onRename: handleRename,
  onClose: handleClose,
}: {
  readonly value: string | undefined;
  readonly onClick: (() => void) | undefined;
  readonly onRename: (value: string) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const id = useId('stats');
  const [pageName, setPageName] = React.useState<string>(value ?? '');
  return (
    <Dialog
      buttons={
        <>
          <Submit.Blue form={id('form')}>{commonText('save')}</Submit.Blue>
          <span />
          {typeof handleClick === 'function' ? (
            <Button.Red onClick={handleClick}>
              {commonText('remove')}
            </Button.Red>
          ) : null}
        </>
      }
      header="Page Name"
      onClose={handleClose}
    >
      <Form id={id('form')} onSubmit={(): void => handleRename(pageName)}>
        <Label.Block>
          {commonText('name')}
          <Input.Text
            required
            value={pageName}
            onValueChange={(value): void => {
              setPageName(value);
            }}
          />
        </Label.Block>
      </Form>
    </Dialog>
  );
}

function AddStatDialog({
  defaultLayout,
  statsSpec,
  queries,
  onClose: handleClose,
  onAdd: handleAdd,
}: {
  readonly queries: RA<SerializedResource<SpQuery>> | undefined;
  readonly defaultLayout: StatLayout;
  readonly statsSpec: IR<
    IR<{
      readonly label: string;
      readonly items: StatCategoryReturn;
    }>
  >;
  readonly onClose: () => void;
  readonly onAdd: (item: CustomStat | DefaultStat) => void;
}): JSX.Element | null {
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
                    onAdd={undefined}
                    pageLayout={defaultLayoutItem}
                    statsSpec={statsSpec}
                    onClick={(item): void => {
                      handleAdd(item);
                    }}
                    onRemove={undefined}
                    onRename={undefined}
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
  onAdd: handleAdd,
  onClick: handleClick,
  onRemove: handleRemove,
  onRename: handleRename,
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
  readonly onAdd: ((categoryIndex: number | undefined) => void) | undefined;
  readonly onClick: ((item: CustomStat | DefaultStat) => void) | undefined;
  readonly onRemove:
    | ((categoryIndex: number, itemIndex: number | undefined) => void)
    | undefined;
  readonly onRename:
    | ((newName: string, categoryIndex: number) => void)
    | undefined;
}): JSX.Element {
  return (
    <>
      {pageLayout.categories.map(({ label, items }, categoryIndex) => (
        <div
          className="flex h-auto max-h-80 flex-col content-center gap-2 rounded border-[1px] border-black bg-white p-4"
          key={categoryIndex}
        >
          {handleRename === undefined ? (
            <H3 className="font-bold">{label}</H3>
          ) : (
            <Input.Text
              required
              value={label}
              onValueChange={(newname): void => {
                handleRename(newname, categoryIndex);
              }}
            />
          )}
          <div className="flex-1 overflow-auto pr-4">
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
                      : (): void => handleRemove(categoryIndex, itemIndex)
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
          {handleAdd !== undefined && handleRemove !== undefined && (
            <div className="flex gap-2">
              <Button.Small
                onClick={(): void => handleAdd(categoryIndex)}
                variant={className.greenButton}
              >
                {commonText('add')}
              </Button.Small>
              <span className="-ml-2 flex-1" />
              <Button.Small
                onClick={(): void => handleRemove(categoryIndex, undefined)}
                variant={className.redButton}
              >
                {commonText('delete')}
              </Button.Small>
            </div>
          )}
        </div>
      ))}
      {handleAdd !== undefined && (
        <Button.Green
          onClick={(): void => handleAdd(undefined)}
          className="!p-4"
        >
          {commonText('add')}
        </Button.Green>
      )}
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
      'QueryBuilderStat' ? (
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

function PageButton({
  label,
  isActive,
  onClick: handleClick,
  onDialogOpen: handleDialogOpen,
}: {
  readonly label: string;
  readonly isActive: boolean;
  readonly onClick: () => void;
  readonly onDialogOpen: (() => void) | undefined;
}): JSX.Element {
  return (
    <div className="flex">
      <Button.Gray
        onClick={handleClick}
        aria-current={isActive ? 'page' : undefined}
        className="min-w-28 flex-1"
      >
        {label}
      </Button.Gray>
      <Button.Icon
        title="remove"
        icon="pencil"
        onClick={handleDialogOpen}
        className={handleDialogOpen === undefined ? 'invisible' : undefined}
      />
    </div>
  );
}
