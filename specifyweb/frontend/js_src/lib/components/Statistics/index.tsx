import React from 'react';
import type { State } from 'typesafe-reducer';

import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { cleanMaybeFulfilled } from '../../utils/ajax/throttledPromise';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { removeItem, removeKey, replaceItem } from '../../utils/utils';
import { H2, H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Form } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { softFail } from '../Errors/Crash';
import { useMenuItem } from '../Header/useMenuItem';
import { userInformation } from '../InitialContext/userInformation';
import { DateElement } from '../Molecules/DateElement';
import { downloadFile } from '../Molecules/FilePicker';
import { hasPermission } from '../Permissions/helpers';
import { collectionPreferences } from '../Preferences/collectionPreferences';
import { userPreferences } from '../Preferences/userPreferences';
import { useQueries } from '../Toolbar/Query';
import { AddStatDialog } from './AddStatDialog';
import { StatsAsideButton } from './Buttons';
import { Categories } from './Categories';
import {
  setAbsentCategoriesToFetch,
  statsToTsv,
  useBackendApi,
  useDefaultLayout,
  useDefaultStatsToAdd,
  useDynamicCategorySetter,
} from './hooks';
import { StatsPageEditing } from './StatsPageEditing';
import type { CustomStat, DefaultStat, StatLayout } from './types';
import { dynamicStatsSpec } from './StatsSpec';

export function StatsPage(): JSX.Element | null {
  useMenuItem('statistics');
  const [collectionLayout, setCollectionLayout] = collectionPreferences.use(
    'statistics',
    'appearance',
    'layout'
  );

  const [personalLayout, setPersonalLayout] = userPreferences.use(
    'statistics',
    'appearance',
    'layout'
  );

  const [defaultLayout, setDefaultLayout] = collectionPreferences.use(
    'statistics',
    'appearance',
    'defaultLayout'
  );

  const layout = {
    [statsText.shared()]: collectionLayout,
    [statsText.personal()]: personalLayout,
  };

  const [state, setState] = React.useState<
    | State<
        'AddingState',
        {
          readonly pageIndex: number;
          readonly categoryIndex: number;
        }
      >
    | State<
        'DeletingCategoryState',
        { readonly categoryContainsCustom: boolean }
      >
    | State<
        'PageRenameState',
        {
          readonly pageIndex: number | undefined;
          readonly isCollection: boolean;
        }
      >
    | State<'DefaultState'>
    | State<'EditingState'>
  >({ type: 'DefaultState' });

  const isAddingItem = state.type === 'AddingState';
  const isEditing =
    state.type === 'EditingState' ||
    isAddingItem ||
    state.type === 'PageRenameState';
  const isEditingCollection = React.useRef(false);
  const canEditIndex = (isCollection: boolean): boolean =>
    isCollection
      ? hasPermission('/preferences/statistics', 'edit_protected') &&
        isEditingCollection.current
      : !isEditingCollection.current;

  const [activePage, setActivePage] = React.useState<{
    readonly isCollection: boolean;
    readonly pageIndex: number;
  }>({
    isCollection: true,
    pageIndex: 0,
  });

  const setLayout = activePage.isCollection
    ? setCollectionLayout
    : setPersonalLayout;
  const sourceLayout = activePage.isCollection
    ? collectionLayout
    : personalLayout;

  const allCategories = React.useMemo(
    () => dynamicStatsSpec.map(({ categoryName }) => categoryName),
    []
  );
  const [categoriesToFetch, setCategoriesToFetch] = React.useState<RA<string>>(
    []
  );

  setAbsentCategoriesToFetch(
    sourceLayout,
    categoriesToFetch,
    setCategoriesToFetch
  );
  const backEndResponse = useBackendApi(categoriesToFetch);
  const defaultBackEndResponse = useBackendApi(allCategories);
  const defaultLayoutSpec = useDefaultLayout();

  /*
   * Initial Load For Collection and Personal Pages
   * If collection and personal layout are undefined initially, then we need to
   * fetch all unknown categories.
   * It is simpler to make the promise twice since throttledPromise returns the
   * previous promise if the spec is same
   */
  React.useEffect(() => {
    if (collectionLayout === undefined) {
      setCollectionLayout([defaultLayoutSpec[0]]);
      setCategoriesToFetch(allCategories);
    }
    if (personalLayout === undefined) {
      setPersonalLayout([defaultLayoutSpec[1]]);
      setCategoriesToFetch(allCategories);
    }
  }, [
    collectionLayout,
    defaultLayoutSpec,
    personalLayout,
    setCollectionLayout,
    setPersonalLayout,
    allCategories,
    setCategoriesToFetch,
  ]);

  /* Set Default Layout every time page is started from scratch*/
  React.useEffect(() => {
    setDefaultLayout(defaultLayoutSpec);
  }, [setDefaultLayout, defaultLayoutSpec]);

  const pageLastUpdated = activePage.isCollection
    ? collectionLayout?.[activePage.pageIndex].lastUpdated
    : personalLayout?.[activePage.pageIndex].lastUpdated;
  const canEdit =
    !activePage.isCollection ||
    hasPermission('/preferences/statistics', 'edit_protected');

  const pageLayout = activePage.isCollection
    ? collectionLayout?.[activePage.pageIndex].categories === undefined
      ? undefined
      : collectionLayout[activePage.pageIndex]
    : personalLayout?.[activePage.pageIndex].categories === undefined
    ? undefined
    : personalLayout[activePage.pageIndex];

  const handleChange = React.useCallback(
    (
      newCategories: (
        oldCategory: StatLayout[number]['categories']
      ) => StatLayout[number]['categories']
    ): void =>
      setLayout((oldLayout: StatLayout | undefined) =>
        oldLayout === undefined
          ? undefined
          : replaceItem(oldLayout, activePage.pageIndex, {
              ...oldLayout[activePage.pageIndex],
              categories: newCategories(
                oldLayout[activePage.pageIndex].categories
              ),
            })
      ),
    [activePage.pageIndex, setLayout]
  );

  const handleDefaultChange = React.useCallback(
    (
      newCategories: (
        oldCategory: StatLayout[number]['categories']
      ) => StatLayout[number]['categories']
    ): void =>
      setDefaultLayout((oldLayout: StatLayout | undefined) =>
        oldLayout === undefined
          ? undefined
          : replaceItem(oldLayout, 0, {
              ...oldLayout[0],
              categories: newCategories(oldLayout[0].categories),
            })
      ),
    [setDefaultLayout]
  );

  // Used to set unknown categories once for layout initially, and every time for default layout
  useDynamicCategorySetter(backEndResponse, handleChange);
  useDynamicCategorySetter(defaultBackEndResponse, handleDefaultChange);

  const filters = React.useMemo(
    () => ({
      specifyUser: userInformation.id,
    }),
    []
  );
  const queries = useQueries(filters, false);
  const previousCollectionLayout = React.useRef(
    collectionLayout as unknown as StatLayout
  );
  const previousLayout = React.useRef(personalLayout as unknown as StatLayout);

  const defaultStatsAddLeft = useDefaultStatsToAdd(
    layout[
      activePage.isCollection ? statsText.shared() : statsText.personal()
    ]?.[activePage.pageIndex],
    defaultLayout
  );

  const getValueUndefined = (
    layout: StatLayout,
    pageIndex: number
  ): StatLayout => {
    const lastUpdatedDate = new Date();
    return layout.map((pageLayout, index) => ({
      label: pageLayout.label,
      categories: pageLayout.categories.map((category) => ({
        label: category.label,
        items: category.items?.map((item) => ({
          ...item,
          itemValue: pageIndex === index ? undefined : item.itemValue,
        })),
      })),
      lastUpdated:
        index === pageIndex ? lastUpdatedDate.toJSON() : pageLayout.lastUpdated,
    }));
  };

  const handleAdd = (
    item: CustomStat | DefaultStat,
    categoryIndex?: number,
    itemIndex?: number
  ): void =>
    handleChange((oldCategory) =>
      replaceItem(oldCategory, categoryIndex ?? -1, {
        ...oldCategory[categoryIndex ?? -1],
        items:
          itemIndex === undefined || itemIndex === -1
            ? [
                ...(oldCategory[categoryIndex ?? -1].items ?? []),
                modifyName(item),
              ]
            : replaceItem(
                oldCategory[categoryIndex ?? -1].items ?? [],
                itemIndex,
                item
              ),
      })
    );

  const modifyName = (
    item: CustomStat | DefaultStat
  ): CustomStat | DefaultStat => {
    if (pageLayout === undefined) {
      return item;
    }
    const itemsLabelMatched = pageLayout.categories
      .flatMap(({ items }) => items ?? [])
      .map((anyItem) => anyItem.label)
      .filter(Boolean);
    return {
      ...item,
      label: getUniqueName(item.label, itemsLabelMatched),
    };
  };

  const handleDefaultLoad = React.useCallback(
    (
      pageIndex: number,
      categoryIndex: number,
      itemIndex: number,
      value: number | string
    ) =>
      setDefaultLayout((oldValue) =>
        f.maybe(oldValue, (oldValue) =>
          replaceItem(oldValue, pageIndex, {
            ...oldValue[pageIndex],
            categories: replaceItem(
              oldValue[pageIndex].categories,
              categoryIndex,
              {
                ...oldValue[pageIndex].categories[categoryIndex],
                items: replaceItem(
                  oldValue[pageIndex].categories[categoryIndex].items ?? [],
                  itemIndex,
                  {
                    ...(oldValue[pageIndex].categories[categoryIndex].items ??
                      [])[itemIndex],
                    itemValue: value,
                  }
                ),
              }
            ),
          })
        )
      ),
    [setDefaultLayout]
  );
  const handleLoad = React.useCallback(
    (categoryIndex: number, itemIndex: number, value: number | string) =>
      handleChange((oldCategory) =>
        replaceItem(oldCategory, categoryIndex, {
          ...oldCategory[categoryIndex],
          items: replaceItem(
            oldCategory[categoryIndex].items ?? [],
            itemIndex,
            {
              ...(oldCategory[categoryIndex].items ?? [])[itemIndex],
              itemValue: value,
            }
          ),
        })
      ),
    [handleChange]
  );

  return collectionLayout === undefined ? null : (
    <Form
      className={className.containerFullGray}
      onSubmit={(): void => {
        setState({ type: 'DefaultState' });
        Promise.all([
          userPreferences.awaitSynced(),
          collectionPreferences.awaitSynced(),
        ]).catch(softFail);
      }}
    >
      <div className="flex items-center gap-2">
        <H2 className="text-2xl">{statsText.statistics()}</H2>
        <span className="-ml-2 flex-1" />
        {pageLastUpdated !== undefined && (
          <span>
            {`${statsText.lastUpdated()} `}
            <DateElement date={pageLastUpdated} />
          </span>
        )}
        <Button.Blue
          onClick={(): void => {
            cleanMaybeFulfilled();
            setLayout((layout) =>
              layout === undefined
                ? undefined
                : getValueUndefined(layout, activePage.pageIndex)
            );
            setCategoriesToFetch([]);
          }}
        >
          {commonText.update()}
        </Button.Blue>
        {Object.values(layout).every((layouts) => layouts !== undefined) && (
          <Button.Green
            onClick={(): void => {
              const date = new Date();
              const sourceIndex = activePage.isCollection ? 0 : 1;
              const pageIndex = activePage.pageIndex;
              const statsTsv = statsToTsv(
                layout,
                activePage.isCollection ? 0 : 1,
                activePage.pageIndex
              );
              const sourceName = Object.keys(layout)[sourceIndex];
              const pageName =
                Object.values(layout)[sourceIndex]?.[pageIndex].label;
              const fileName = `Specify 7 Statistics ${sourceName} ${
                pageName ?? ''
              } ${date.toDateString()} ${
                date.toTimeString().split(' ')[0]
              }.tsv`;
              downloadFile(fileName, statsTsv).catch(softFail);
            }}
          >
            {statsText.downloadAsTSV()}
          </Button.Green>
        )}
        {isEditing ? (
          <>
            <Button.Red
              onClick={(): void => {
                cleanMaybeFulfilled();
                setCollectionLayout(undefined);
                setPersonalLayout(undefined);
                setCategoriesToFetch([]);
              }}
            >
              {commonText.reset()}
            </Button.Red>

            <Button.Red
              onClick={(): void => {
                setCollectionLayout(previousCollectionLayout.current);
                setPersonalLayout(previousLayout.current);
                setState({ type: 'DefaultState' });
                setActivePage(({ isCollection, pageIndex }) => {
                  /*
                   * Also handles cases where a new page is added and user clicks on cancel.
                   * Shifts to the last page in the current group
                   */
                  const previousLayoutRef = isCollection
                    ? previousCollectionLayout
                    : previousLayout;
                  const newIndex =
                    pageIndex >= previousLayoutRef.current.length
                      ? previousLayoutRef.current.length - 1
                      : pageIndex;
                  return {
                    isCollection,
                    pageIndex: newIndex,
                  };
                });
              }}
            >
              {commonText.cancel()}
            </Button.Red>
            <Submit.Blue>{commonText.save()}</Submit.Blue>
          </>
        ) : (
          canEdit && (
            <Button.Blue
              onClick={(): void => {
                setState({
                  type: 'EditingState',
                });
                if (collectionLayout !== undefined)
                  previousCollectionLayout.current = collectionLayout;
                if (personalLayout !== undefined)
                  previousLayout.current = personalLayout;
                isEditingCollection.current = activePage.isCollection;
              }}
            >
              {commonText.edit()}
            </Button.Blue>
          )
        )}
      </div>
      <div className="flex flex-col overflow-hidden">
        <div className="flex flex-col gap-2 overflow-y-hidden md:flex-row">
          <aside
            className={`
                 top-0 flex min-w-fit flex-1 flex-col divide-y-4 !divide-[color:var(--form-background)]
                  md:sticky
              `}
          >
            {
              <Ul className="flex flex-col gap-2">
                {Object.entries(layout).map(
                  ([parentLayoutName, parentLayout], index) =>
                    parentLayout === undefined ? undefined : (
                      <li className="flex flex-col gap-2" key={index}>
                        <H3 className="text-lg font-bold">
                          {parentLayoutName}
                        </H3>
                        <Ul className="flex flex-col gap-2">
                          {parentLayout.map(({ label }, pageIndex) => (
                            <li key={pageIndex}>
                              {
                                <StatsAsideButton
                                  isCurrent={
                                    activePage.pageIndex === pageIndex &&
                                    activePage.isCollection === (index === 0)
                                  }
                                  label={label}
                                  onClick={(): void =>
                                    setActivePage({
                                      isCollection: index === 0,
                                      pageIndex,
                                    })
                                  }
                                  onRename={
                                    isEditing && canEditIndex(index === 0)
                                      ? (): void =>
                                          setState({
                                            type: 'PageRenameState',
                                            isCollection: index === 0,
                                            pageIndex,
                                          })
                                      : undefined
                                  }
                                />
                              }
                            </li>
                          ))}

                          {isEditing && canEditIndex(index === 0) && (
                            <StatsAsideButton
                              isCurrent={false}
                              label={commonText.add()}
                              onClick={(): void =>
                                setState({
                                  type: 'PageRenameState',
                                  pageIndex: undefined,
                                  isCollection: index === 0,
                                })
                              }
                              onRename={undefined}
                            />
                          )}
                        </Ul>
                      </li>
                    )
                )}
              </Ul>
            }
          </aside>
          {state.type === 'PageRenameState' && (
            <StatsPageEditing
              label={
                typeof state.pageIndex === 'number'
                  ? state.isCollection
                    ? collectionLayout[state.pageIndex].label
                    : personalLayout?.[state.pageIndex].label
                  : undefined
              }
              onAdd={
                typeof state.pageIndex === 'number'
                  ? undefined
                  : (label): void => {
                      if (sourceLayout !== undefined) {
                        setLayout([
                          ...sourceLayout,
                          {
                            label,
                            categories: [],
                            lastUpdated: undefined,
                          },
                        ]);
                        setState({
                          type: 'EditingState',
                        });
                        setActivePage({
                          pageIndex: sourceLayout.length,
                          isCollection: state.isCollection,
                        });
                      }
                    }
              }
              onClose={(): void => setState({ type: 'EditingState' })}
              onRemove={
                state.pageIndex === undefined ||
                (state.isCollection && collectionLayout.length === 1)
                  ? undefined
                  : () => {
                      if (state.pageIndex === undefined) return undefined;
                      if (sourceLayout !== undefined) {
                        setLayout((oldLayout) =>
                          oldLayout === undefined
                            ? undefined
                            : removeItem(oldLayout, state.pageIndex!)
                        );
                        setState({
                          type: 'EditingState',
                        });
                        setActivePage({
                          ...(!state.isCollection && sourceLayout.length === 1
                            ? {
                                pageIndex: 0,
                                isCollection: true,
                              }
                            : {
                                pageIndex: sourceLayout.length - 2,
                                isCollection: state.isCollection,
                              }),
                        });
                      }
                      return undefined;
                    }
              }
              onRename={
                state.pageIndex === undefined
                  ? undefined
                  : (value) => {
                      if (state.pageIndex === undefined) return undefined;
                      if (sourceLayout !== undefined) {
                        setLayout(
                          replaceItem(sourceLayout, state.pageIndex, {
                            ...sourceLayout[state.pageIndex],
                            label: value,
                          })
                        );
                        setState({
                          type: 'EditingState',
                        });
                      }
                      return undefined;
                    }
              }
            />
          )}
          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4 overflow-y-auto px-4 pb-6">
            <Categories
              pageLayout={pageLayout}
              onAdd={
                isEditing && canEditIndex(activePage.isCollection)
                  ? (categoryindex): void =>
                      typeof categoryindex === 'number'
                        ? setState({
                            type: 'AddingState',
                            pageIndex: activePage.pageIndex,
                            categoryIndex: categoryindex,
                          })
                        : handleChange((oldCategory) => [
                            ...oldCategory,
                            {
                              label: '',
                              items: [],
                            },
                          ])
                  : undefined
              }
              onCategoryRename={
                isEditing && canEditIndex(activePage.isCollection)
                  ? (newName, categoryIndex): void =>
                      handleChange((oldCategory) =>
                        replaceItem(oldCategory, categoryIndex, {
                          ...oldCategory[categoryIndex],
                          label: newName,
                        })
                      )
                  : undefined
              }
              onClick={handleAdd}
              onEdit={
                isEditing
                  ? undefined
                  : (categoryIndex, itemIndex, querySpec): void =>
                      handleChange((oldCategory) =>
                        replaceItem(oldCategory, categoryIndex, {
                          ...oldCategory[categoryIndex],
                          items: replaceItem(
                            oldCategory[categoryIndex].items ?? [],
                            itemIndex,
                            {
                              ...(oldCategory[categoryIndex].items ?? [])[
                                itemIndex
                              ],
                              ...((oldCategory[categoryIndex].items ?? [])[
                                itemIndex
                              ].type === 'DefaultStat'
                                ? {}
                                : {
                                    querySpec,
                                    itemValue: undefined,
                                  }),
                            }
                          ),
                        })
                      )
              }
              onLoad={handleLoad}
              onRemove={(categoryIndex, itemIndex): void =>
                handleChange((oldCategory) =>
                  typeof itemIndex === 'number'
                    ? replaceItem(oldCategory, categoryIndex, {
                        ...oldCategory[categoryIndex],
                        items: removeItem(
                          oldCategory[categoryIndex].items ?? [],
                          itemIndex
                        ),
                      })
                    : removeItem(oldCategory, categoryIndex)
                )
              }
              onRename={
                isEditing && canEditIndex(activePage.isCollection)
                  ? (categoryIndex, itemIndex, newLabel): void =>
                      handleChange((oldCategory) =>
                        replaceItem(oldCategory, categoryIndex, {
                          ...oldCategory[categoryIndex],
                          items: replaceItem(
                            oldCategory[categoryIndex].items ?? [],
                            itemIndex,
                            {
                              ...(oldCategory[categoryIndex].items ?? [])[
                                itemIndex
                              ],
                              label: newLabel,
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
          defaultStatsAddLeft={defaultStatsAddLeft}
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
                : layout.map(({ label, categories, lastUpdated }) => ({
                    label,
                    categories: categories.map(({ label, items }) => ({
                      label,
                      items: items?.map((item) =>
                        item.type === 'DefaultStat'
                          ? (removeKey(item, 'isVisible') as DefaultStat)
                          : item
                      ),
                    })),
                    lastUpdated,
                  }))
            );
          }}
          onLoad={handleDefaultLoad}
        />
      )}
    </Form>
  );
}
