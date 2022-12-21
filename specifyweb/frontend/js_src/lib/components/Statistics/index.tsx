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
import {
  useCacheValid,
  useDefaultLayout,
  useDefaultStatsToAdd,
  useStatsSpec,
} from './hooks';
import { Categories } from './Categories';
import { AddStatDialog } from './AddStatDialog';
import { StatsPageEditing } from './StatsPageEditing';
import { StatsPageButton } from './Buttons';
import { useMenuItem } from '../Header';
import { CustomStat, DefaultStat, StatLayout } from './types';
import { useBooleanState } from '../../hooks/useBooleanState';
import { DateElement } from '../Molecules/DateElement';
import { statsText } from '../../localization/stats';

export function StatsPage(): JSX.Element | null {
  useMenuItem('statistics');

  const [layout, setPrevLayout] = usePref('statistics', 'appearance', 'layout');
  const [lastUpdated, setLastUpdated] = usePref(
    'statistics',
    'appearance',
    'lastUpdated'
  );

  const setLayout = (item: StatLayout): void => {
    setPrevLayout(item);
  };

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
  >({ type: 'DefaultState' });

  const isAddingItem = state.type === 'AddingState';
  const isEditing =
    state.type === 'EditingState' ||
    isAddingItem ||
    state.type === 'PageRenameState';
  const [activePageIndex, setActivePageIndex] = React.useState<number>(0);

  const filters = React.useMemo(
    () => ({
      specifyUser: userInformation.id,
    }),
    []
  );
  const specifyUserName = React.useMemo(
    () => ({
      specifyUser: userInformation.name,
    }),
    []
  );

  const isCacheValid = useCacheValid(layout);
  const statsSpec = useStatsSpec(isCacheValid, specifyUserName.specifyUser);
  const defaultLayoutSpec = useDefaultLayout(statsSpec);
  const isDefaultCacheValid = useCacheValid(defaultLayoutSpec);

  //setLayout(defaultLayoutSpec);
  /* Uncomment after every statsspec.tsx change
   React.useEffect(() => {
    if (isDefaultCacheValid) {
      setDefaultLayout(defaultLayoutSpec);
      setLayout(defaultLayoutSpec);
    }
  }, [isDefaultCacheValid]);*/

  const queries = useQueries(filters, false);
  const previousLayout = React.useRef(layout);

  const handleChange = React.useCallback(
    (
      newCategories: (
        previousCategory: StatLayout[number]['categories']
      ) => StatLayout[number]['categories']
    ): void => {
      setPrevLayout((oldLayout: StatLayout | undefined) =>
        oldLayout === undefined
          ? undefined
          : replaceItem(oldLayout, activePageIndex, {
              ...oldLayout[activePageIndex],
              categories: newCategories(oldLayout[activePageIndex].categories),
            })
      );
    },
    [activePageIndex]
  );

  const handleAdd = (
    item: CustomStat | DefaultStat,
    categoryIndex?: number,
    itemIndex?: number
  ): void => {
    handleChange((prevCategory) =>
      replaceItem(prevCategory, categoryIndex ?? -1, {
        ...prevCategory[categoryIndex ?? -1],
        items:
          itemIndex === undefined || itemIndex === -1
            ? [...prevCategory[categoryIndex ?? -1].items, item]
            : replaceItem(
                prevCategory[categoryIndex ?? -1].items,
                itemIndex,
                item
              ),
      })
    );
  };
  const defaultStatsAddLeft = useDefaultStatsToAdd(
    layout?.[activePageIndex],
    defaultLayout
  );
  const handleDefaultLoad = React.useCallback(
    (
      categoryIndex: number,
      itemIndex: number,
      value: string | number,
      itemName: string,
      pageIndex: number
    ) => {
      setDefaultLayout((oldValue) =>
        replaceItem(oldValue, pageIndex, {
          ...oldValue[pageIndex],
          categories: replaceItem(
            oldValue[pageIndex].categories,
            categoryIndex,
            {
              ...oldValue[pageIndex].categories[categoryIndex],
              items: replaceItem(
                oldValue[pageIndex].categories[categoryIndex].items,
                itemIndex,
                {
                  ...oldValue[pageIndex].categories[categoryIndex].items[
                    itemIndex
                  ],
                  itemValue: value,
                  itemLabel: itemName,
                }
              ),
            }
          ),
        })
      );
    },
    []
  );
  const handleLoad = React.useCallback(
    (
      categoryIndex: number,
      itemIndex: number,
      value: string | number,
      itemLabel: string
    ) => {
      handleChange((previousCategory) =>
        replaceItem(previousCategory, categoryIndex, {
          ...previousCategory[categoryIndex],
          items: replaceItem(previousCategory[categoryIndex].items, itemIndex, {
            ...previousCategory[categoryIndex].items[itemIndex],
            itemValue: value,
            itemLabel,
          }),
        })
      );
    },
    [handleChange]
  );

  return layout === undefined ? null : (
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
        <>
          <p>
            {`${statsText('lastUpdated')} `}
            <DateElement date={lastUpdated} />
          </p>

          <Button.Blue
            onClick={(): void => {
              const lastUpdatedDate = new Date();
              setLayout(
                layout.map((pageLayout) => ({
                  label: pageLayout.label,
                  categories: pageLayout.categories.map((category) => ({
                    label: category.label,
                    items: category.items.map((item) => ({
                      ...item,
                      itemValue: undefined,
                    })),
                  })),
                }))
              );

              setLastUpdated(lastUpdatedDate.toString());
            }}
          >
            {commonText('update')}
          </Button.Blue>
        </>
        {isEditing ? (
          <>
            <Button.Red
              onClick={(): void => {
                setLayout(defaultLayoutSpec);
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
                        setLayout((old) => removeItem(old, state.pageIndex!));
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
          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4 overflow-y-auto px-4 pb-6">
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
                        : handleChange((prevCategory) => [
                            ...prevCategory,
                            {
                              label: '',
                              items: [],
                            },
                          ])
                  : undefined
              }
              pageLayout={
                layout[activePageIndex].categories === undefined
                  ? undefined
                  : layout[activePageIndex]
              }
              statsSpec={statsSpec}
              onClick={handleAdd}
              onRemove={
                isEditing
                  ? (categoryIndex, itemIndex): void => {
                      handleChange((prevCategory) =>
                        typeof itemIndex === 'number'
                          ? replaceItem(prevCategory, categoryIndex, {
                              ...prevCategory[categoryIndex],
                              items: removeItem(
                                prevCategory[categoryIndex].items,
                                itemIndex
                              ),
                            })
                          : removeItem(prevCategory, categoryIndex)
                      );
                    }
                  : undefined
              }
              onCategoryRename={
                isEditing
                  ? (newName, categoryIndex): void =>
                      handleChange((prevCategory) =>
                        replaceItem(prevCategory, categoryIndex, {
                          ...prevCategory[categoryIndex],
                          label: newName,
                        })
                      )
                  : undefined
              }
              onItemRename={
                isEditing
                  ? (categoryIndex, itemIndex, newLabel): void =>
                      handleChange((prevCategory) =>
                        replaceItem(prevCategory, categoryIndex, {
                          ...prevCategory[categoryIndex],
                          items: replaceItem(
                            prevCategory[categoryIndex].items,
                            itemIndex,
                            {
                              ...prevCategory[categoryIndex].items[itemIndex],
                              itemLabel: newLabel,
                            }
                          ),
                        })
                      )
                  : undefined
              }
              onSpecChanged={(categoryIndex, itemIndex, fields): void =>
                setLayout(
                  replaceItem(layout, activePageIndex, {
                    ...layout[activePageIndex],
                    categories: replaceItem(
                      layout[activePageIndex].categories,
                      categoryIndex,
                      {
                        ...layout[activePageIndex].categories[categoryIndex],
                        items: replaceItem(
                          layout[activePageIndex].categories[categoryIndex]
                            .items,
                          itemIndex,
                          {
                            ...layout[activePageIndex].categories[categoryIndex]
                              .items[itemIndex],
                            fields,
                            itemValue: undefined,
                          }
                        ),
                      }
                    ),
                  })
                )
              }
              onValueLoad={handleLoad}
            />
          </div>
        </div>
      </div>

      {state.type === 'AddingState' && (
        <AddStatDialog
          defaultStatsAddLeft={defaultStatsAddLeft}
          statsSpec={statsSpec}
          queries={queries}
          onAdd={(item, itemIndex): void =>
            handleAdd(item, state.categoryIndex, itemIndex)
          }
          onClose={(): void => {
            setState({
              type: 'EditingState',
            });
            setDefaultLayout((layout) =>
              layout === undefined
                ? undefined
                : layout.map(({ label, categories }) => ({
                    label,
                    categories: categories.map(({ label, items }) => ({
                      label,
                      items: items.map((item) => ({ ...item, absent: false })),
                    })),
                  }))
            );
          }}
          onValueLoad={handleDefaultLoad}
        />
      )}
    </Form>
  );
}
