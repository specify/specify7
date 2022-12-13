import React from 'react';
import type { State } from 'typesafe-reducer';
import { commonText } from '../../localization/common';
import { removeItem, replaceItem } from '../../utils/utils';
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
import { useCachedState } from '../../hooks/useCachedState';

export function StatsPage(): JSX.Element {
  const [customLayout, setPrevLayout] = usePref(
    'statistics',
    'appearance',
    'layout'
  );
  const [layoutCache = [], setLayoutCache] = useCachedState(
    'statistics',
    'statsValue'
  );
  const setLayout = (layout: StatLayout) => setPrevLayout(layout);
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
  >(layoutCache.length > 0 ? { type: 'CacheState' } : { type: 'DefaultState' });
  const statsSpec = useStatsSpec(state.type === 'CacheState');
  const defaultLayout = useDefaultLayout(statsSpec);
  const layout = customLayout ?? defaultLayout;
  const isAddingItem = state.type === 'AddingState';
  const isEditing =
    state.type === 'EditingState' ||
    isAddingItem ||
    state.type === 'PageRenameState';
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
  const handleCategoryChange = (
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
    handleCategoryChange(
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
                setLayoutCache([]);
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
                setLayoutCache([]);
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
                  setState({
                    type: 'DefaultState',
                  });
                  setLayoutCache([]);
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
                        setLayoutCache((oldValue) =>
                          oldValue !== undefined
                            ? removeItem(oldValue, state.pageIndex!)
                            : undefined
                        );
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
                        : handleCategoryChange([
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
              pageCache={layoutCache?.[activePageIndex]}
              onClick={handleAdd}
              onRemove={
                isEditing
                  ? (categoryIndex, itemIndex): void => {
                      setLayoutCache((oldValue) =>
                        oldValue !== undefined && itemIndex !== undefined
                          ? replaceItem(
                              oldValue,
                              activePageIndex,
                              replaceItem(
                                oldValue[activePageIndex],
                                categoryIndex,
                                removeItem(
                                  oldValue[activePageIndex][categoryIndex],
                                  itemIndex
                                )
                              )
                            )
                          : undefined
                      );
                      handleCategoryChange(
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
                      handleCategoryChange(
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
                handleCategoryChange(
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
              onValueLoad={(categoryIndex, itemIndex, value, itemName) => {
                setLayoutCache((oldValue) => {
                  const tempPageArray = [...(oldValue ?? [])];
                  const tempPage = [...(tempPageArray[activePageIndex] ?? [])];
                  const tempCategory = [...(tempPage[categoryIndex] ?? [])];
                  tempCategory[itemIndex] = { itemName, value };
                  tempPage[categoryIndex] = [...tempCategory];
                  tempPageArray[activePageIndex] = [...tempPage];
                  return tempPageArray;
                });
              }}
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
        />
      )}
    </Form>
  );
}
