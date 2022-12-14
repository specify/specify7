import React from 'react';
import type { State } from 'typesafe-reducer';
import { commonText } from '../../localization/common';
import { keysToLowerCase, removeItem, replaceItem } from '../../utils/utils';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { useQueries } from '../Toolbar/Query';
import { usePref } from '../UserPreferences/usePref';
import { userInformation } from '../InitialContext/userInformation';
import { awaitPrefsSynced } from '../UserPreferences/helpers';
import { softFail } from '../Errors/Crash';
import { Form } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { useDefaultLayout, useDefaultStatsToAdd, useStatsSpec } from './hooks';
import { Categories } from './Categories';
import { AddStatDialog } from './AddStatDialog';
import { StatsPageEditing } from './StatsPageEditing';
import { StatsPageButton } from './Buttons';
import { CustomStat, DefaultStat, StatLayout } from './types';
import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import { serializeResource } from '../DataModel/helpers';
import { formatNumber } from '../Atoms/Internationalization';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { SpQuery } from '../DataModel/types';
import { RA } from '../../utils/types';

export function StatsPage(): JSX.Element {
  const [layout, setLayout] = usePref('statistics', 'appearance', 'layout');
  const [defaultLayout, setDefaultLayout] = usePref(
    'statistics',
    'appearance',
    'defaultLayout'
  );
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
        'PageRenameState',
        {
          readonly pageIndex: number | undefined;
        }
      >
    | State<'CacheState'>
  >(layout === undefined ? { type: 'DefaultState' } : { type: 'CacheState' });
  const isAddingItem = state.type === 'AddingState';
  const isEditing =
    state.type === 'EditingState' ||
    isAddingItem ||
    state.type === 'PageRenameState';
  const [activePageIndex, setActivePageIndex] = React.useState<number>(0);

  const statsSpec = useStatsSpec(false);
  const defaultLayoutSpec = useDefaultLayout(statsSpec, undefined);
  // const customLayoutSpec = useDefaultLayout(statsSpec, layout);
  setDefaultLayout(defaultLayoutSpec);
  //setLayout(defaultLayoutSpec);
  const defaultStatsToAdd = useDefaultStatsToAdd(
    layout?.[activePageIndex],
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
  const statNetworkCount = React.useRef(0);
  const activeNetworkRequest = [];
  const VINNY_STAT_CONSTANT = 20;
  const useStatNetwork = async (
    query: SpecifyResource<SpQuery> | undefined
  ) => {
    if (
      statNetworkCount.current > VINNY_STAT_CONSTANT ||
      statNetworkCount.current < 0 ||
      query === undefined
    )
      return undefined;
    statNetworkCount.current += 1;
    while (statNetworkCount.current > VINNY_STAT_CONSTANT) {
      await Promise.any(activeNetworkRequest).then((value) => {});
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
    });
    activeNetworkRequest.push(statPromise);
    const x = await statPromise.then(({ data }) => {
      statNetworkCount.current = statNetworkCount.current - 1;
      return formatNumber(data.count);
    });
    return x;
  };

  const handleChange = (
    newCategories: StatLayout[number]['categories']
  ): void => {
    setLayout(
      replaceItem(layout, activePageIndex, {
        ...layout[activePageIndex],
        categories: newCategories,
      })
    );
  };

  const handleAdd = (
    item: CustomStat | DefaultStat,
    categoryIndex?: number,
    itemIndex?: number
  ): void => {
    handleChange(
      replaceItem(layout[activePageIndex].categories, categoryIndex ?? -1, {
        ...layout[activePageIndex].categories[categoryIndex ?? -1],
        items: replaceItem(
          layout[activePageIndex].categories[categoryIndex ?? -1].items,
          itemIndex === undefined ? -1 : itemIndex,
          item
        ),
      })
    );
  };

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
            <Button.Red
              onClick={(): void => {
                setLayout(defaultLayout);
              }}
            >
              {commonText('reset')}
            </Button.Red>
            <Button.Red
              onClick={(): void => {
                setLayout(previousLayout.current);
                setState({ type: 'DefaultState' });
                setActivePageIndex(
                  activePageIndex >= previousLayout.current.length
                    ? previousLayout.current.length - 1
                    : activePageIndex
                );
              }}
            >
              {commonText('cancel')}
            </Button.Red>
            <Submit.Blue>{commonText('save')}</Submit.Blue>
          </>
        ) : (
          <>
            <Button.Blue
              onClick={(): void => {
                setState({
                  type: 'EditingState',
                });
                previousLayout.current = layout;
              }}
            >
              {commonText('edit')}
            </Button.Blue>
            {state.type === 'CacheState' && (
              <Button.Blue
                onClick={(): void => {
                  layout !== undefined
                    ? setLayout(
                        layout.map((pageLayout) => ({
                          label: pageLayout.label,
                          categories: pageLayout.categories.map((category) => ({
                            label: category.label,
                            items: category.items.map((item) => ({
                              ...item,
                              cachedValue: undefined,
                            })),
                          })),
                        }))
                      )
                    : undefined;
                  setState({
                    type: 'DefaultState',
                  });
                }}
              >
                {commonText('update')}
              </Button.Blue>
            )}
          </>
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
              <StatsPageButton
                key={pageIndex}
                label={label}
                isCurrent={pageIndex === activePageIndex}
                onRename={
                  isEditing
                    ? (): void => {
                        setState({
                          type: 'PageRenameState',
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
              <StatsPageButton
                onClick={(): void => {
                  setState({
                    type: 'PageRenameState',
                    pageIndex: undefined,
                  });
                }}
                isCurrent={false}
                label={commonText('add')}
                onRename={undefined}
              />
            )}
          </aside>
          {state.type === 'PageRenameState' && (
            <StatsPageEditing
              onRemove={
                typeof state.pageIndex === 'number'
                  ? layout.length > 1
                    ? (): void => {
                        setLayout(removeItem(layout, state.pageIndex!));
                        setState({
                          type: 'EditingState',
                        });
                        setActivePageIndex(layout.length - 2);
                      }
                    : undefined
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
                  : undefined
              }
              onAdd={
                typeof state.pageIndex === 'number'
                  ? undefined
                  : (label): void => {
                      setLayout([
                        ...layout,
                        {
                          label,
                          categories: [],
                        },
                      ]);
                      setState({
                        type: 'EditingState',
                      });
                      setActivePageIndex(layout.length);
                    }
              }
              onClose={(): void => setState({ type: 'EditingState' })}
              label={
                typeof state.pageIndex === 'number'
                  ? layout[state.pageIndex].label
                  : undefined
              }
            />
          )}
          <div className="px-4 pb-6 grid w-full grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4 overflow-y-auto">
            <Categories
              onAdd={
                isEditing
                  ? (categoryindex): void =>
                      typeof categoryindex === 'number'
                        ? setState({
                            type: 'AddingState',
                            pageIndex: activePageIndex,
                            categoryIndex: categoryindex,
                          })
                        : handleChange([
                            ...layout[activePageIndex].categories,
                            {
                              label: '',
                              items: [],
                            },
                          ])
                  : undefined
              }
              pageLayout={layout[activePageIndex]}
              statsSpec={statsSpec}
              onClick={handleAdd}
              onRemove={
                isEditing
                  ? (categoryIndex, itemIndex): void => {
                      handleChange(
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
                            )
                      );
                    }
                  : undefined
              }
              onRename={
                isEditing
                  ? (newName, categoryIndex): void =>
                      handleChange(
                        replaceItem(
                          layout[activePageIndex].categories,
                          categoryIndex,
                          {
                            ...layout[activePageIndex].categories[
                              categoryIndex
                            ],
                            label: newName,
                          }
                        )
                      )
                  : undefined
              }
              onSpecChanged={(categoryIndex, itemIndex, fields): void =>
                handleChange(
                  replaceItem(
                    layout[activePageIndex].categories,
                    categoryIndex,
                    {
                      ...layout[activePageIndex].categories[categoryIndex],
                      items: replaceItem(
                        layout[activePageIndex].categories[categoryIndex].items,
                        itemIndex,
                        {
                          ...layout[activePageIndex].categories[categoryIndex]
                            .items[itemIndex],
                          fields,
                        }
                      ),
                    }
                  )
                )
              }
              onValueLoad={(
                categoryIndex,
                itemIndex,
                value,
                itemName,
                itemType
              ) => {
                handleChange(
                  replaceItem(
                    layout[activePageIndex].categories,
                    categoryIndex,
                    {
                      ...layout[activePageIndex].categories[categoryIndex],
                      items: replaceItem(
                        layout[activePageIndex].categories[categoryIndex].items,
                        itemIndex,
                        {
                          ...layout[activePageIndex].categories[categoryIndex]
                            .items[itemIndex],
                          cachedValue: value,
                          ...(itemType === 'DefaultStat'
                            ? { itemName: itemName }
                            : { itemLabel: itemName }),
                        }
                      ),
                    }
                  )
                );
              }}
              onStatNetwork={useStatNetwork}
            />
          </div>
        </div>
      </div>

      {state.type === 'AddingState' && (
        <AddStatDialog
          defaultLayout={defaultStatsToAdd}
          statsSpec={statsSpec}
          queries={queries}
          onAdd={(item, itemIndex): void =>
            handleAdd(item, state.categoryIndex, itemIndex)
          }
          onClose={(): void =>
            setState({
              type: 'EditingState',
            })
          }
          onStatNetwork={useStatNetwork}
        />
      )}
    </Form>
  );
}
