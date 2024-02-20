import React from 'react';
import type { State } from 'typesafe-reducer';

import { useErrorContext } from '../../hooks/useErrorContext';
import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { cleanThrottledPromises } from '../../utils/ajax/throttledPromise';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { removeItem, removeKey, replaceItem } from '../../utils/utils';
import { H2, H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Form } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { softFail } from '../Errors/Crash';
import { useMenuItem } from '../Header/MenuContext';
import { DateElement } from '../Molecules/DateElement';
import { downloadFile } from '../Molecules/FilePicker';
import { hasPermission } from '../Permissions/helpers';
import { ProtectedAction } from '../Permissions/PermissionDenied';
import { collectionPreferences } from '../Preferences/collectionPreferences';
import { userPreferences } from '../Preferences/userPreferences';
import { AddStatDialog } from './AddStatDialog';
import { StatsAsideButton } from './Buttons';
import { Categories } from './Categories';
import {
  applyRefreshLayout,
  getBackendUrlToFetch,
  getDynamicQuerySpecsToFetch,
  getOffsetOne,
  setLayoutUndefined,
  statsToTsv,
  useBackendApi,
  useBackEndCategorySetter,
  useDefaultBackendCategorySetter,
  useDefaultDynamicCategorySetter,
  useDefaultStatsToAdd,
  useDynamicCategorySetter,
  useDynamicGroups,
} from './hooks';
import { StatsPageEditing } from './StatsPageEditing';
import {
  backEndStatsSpec,
  defaultLayoutGenerated,
  dynamicStatsSpec,
} from './StatsSpec';
import type {
  CustomStat,
  DefaultStat,
  DynamicQuerySpec,
  StatFormatterSpec,
  StatLayout,
} from './types';

export function StatsPage(): JSX.Element {
  return (
    <ProtectedAction action="execute" resource="/querybuilder/query">
      <ProtectedStatsPage />
    </ProtectedAction>
  );
}

function ProtectedStatsPage(): JSX.Element | null {
  // REFACTOR: Make stats page component smaller.

  useMenuItem('statistics');
  const [initialSharedLayout, setSharedLayout] = collectionPreferences.use(
    'statistics',
    'appearance',
    'layout'
  );

  const [refreshRate] = collectionPreferences.use(
    'statistics',
    'appearance',
    'refreshRate'
  );

  const [sharedLayout, setLocalSharedLayout] = React.useState<
    RA<StatLayout> | undefined
  >(initialSharedLayout);

  const handleSharedLayoutChange = React.useCallback(
    (
      layout:
        | RA<StatLayout>
        | ((
            oldLayout: RA<StatLayout> | undefined
          ) => RA<StatLayout> | undefined)
        | undefined
    ) => {
      setLocalSharedLayout(layout);
      setSharedLayout(layout);
    },
    [setLocalSharedLayout, setSharedLayout]
  );

  const [initialPersonalLayout, setPersonalLayout] = userPreferences.use(
    'statistics',
    'appearance',
    'layout'
  );

  const [personalLayout, setLocalPersonalLayout] = React.useState<
    RA<StatLayout> | undefined
  >(initialPersonalLayout);

  const handlePersonalLayoutChange = React.useCallback(
    (
      layout:
        | RA<StatLayout>
        | ((
            oldLayout: RA<StatLayout> | undefined
          ) => RA<StatLayout> | undefined)
        | undefined
    ) => {
      setLocalPersonalLayout(layout);
      setPersonalLayout(layout);
    },
    [setLocalPersonalLayout, setPersonalLayout]
  );

  const [showPreparationsTotal] = collectionPreferences.use(
    'statistics',
    'appearance',
    'showPreparationsTotal'
  );

  const formatterSpec = React.useMemo<StatFormatterSpec>(
    () => ({ showPreparationsTotal }),
    [showPreparationsTotal]
  );
  const [defaultLayout, setDefaultLayout] = React.useState<
    RA<StatLayout> | undefined
  >(undefined);
  const layout = {
    [statsText.shared()]: sharedLayout,
    [statsText.private()]: personalLayout,
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
        'PageRenameState',
        {
          readonly pageIndex: number | undefined;
          readonly isShared: boolean;
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

  const hasEditPermission = hasPermission(
    '/preferences/statistics',
    'edit_shared'
  );

  const canEditIndex = (isCollection: boolean): boolean =>
    isCollection ? hasEditPermission : true;

  const [activePage, setActivePage] = React.useState<{
    readonly isShared: boolean;
    readonly pageIndex: number;
  }>({
    isShared: true,
    pageIndex: 0,
  });

  const errorContextState = React.useMemo(
    () => ({
      shared: sharedLayout,
      personal: personalLayout,
      default: defaultLayout,
      onShared: activePage.isShared,
      pageIndex: activePage.pageIndex,
      state,
    }),
    [
      sharedLayout,
      personalLayout,
      defaultLayout,
      activePage.isShared,
      activePage.pageIndex,
      state,
    ]
  );

  useErrorContext('statistics', errorContextState);

  const getSourceLayoutSetter = (isShared: boolean) =>
    isShared ? handleSharedLayoutChange : handlePersonalLayoutChange;

  const setCurrentLayout = getSourceLayoutSetter(activePage.isShared);

  const getSourceLayout = (isShared: boolean) =>
    isShared ? sharedLayout : personalLayout;

  const sourceLayout = getSourceLayout(activePage.isShared);

  const allCategories = React.useMemo(
    () => backEndStatsSpec.map(({ responseKey }) => responseKey),
    []
  );
  const allDynamicQueries = React.useMemo(
    () =>
      dynamicStatsSpec.map(({ responseKey, dynamicQuerySpec }) => ({
        key: responseKey,
        spec: dynamicQuerySpec,
      })),
    []
  );
  const [categoriesToFetch, setCategoriesToFetch] = React.useState<RA<string>>(
    []
  );
  const [dynamicQueriesToRun, setDynamicQueriesToRun] = React.useState<
    RA<DynamicQuerySpec>
  >([]);

  const [defaultCategoriesToFetch, setDefaultCategoriesToFetch] =
    React.useState<RA<string>>([]);

  const [defaultDynamicQueriesToRun, setDefaultDynamicQueriesToRun] =
    React.useState<RA<DynamicQuerySpec>>([]);
  /**
   * Checks layout for absent dynamic categories and makes request for those categories.
   *
   */
  React.useEffect(() => {
    const absentBackEndCategories =
      sourceLayout === undefined ? [] : getBackendUrlToFetch(sourceLayout);
    const notCurrentlyFetching = absentBackEndCategories.filter(
      (category) => !categoriesToFetch.includes(category)
    );
    if (notCurrentlyFetching.length > 0) {
      setCategoriesToFetch([...categoriesToFetch, ...notCurrentlyFetching]);
    }
  }, [sourceLayout, categoriesToFetch, setCategoriesToFetch]);

  React.useEffect(() => {
    const absentDynamicCategories =
      sourceLayout === undefined
        ? []
        : getDynamicQuerySpecsToFetch(sourceLayout);
    const notCurrentlyRunning = absentDynamicCategories.filter(
      (maybeRunningSpec) =>
        !dynamicQueriesToRun.some(({ key }) => key === maybeRunningSpec.key)
    );
    if (notCurrentlyRunning.length > 0) {
      setDynamicQueriesToRun([...dynamicQueriesToRun, ...notCurrentlyRunning]);
    }
  }, [sourceLayout, dynamicQueriesToRun, setDynamicQueriesToRun]);

  const backEndResponse = useBackendApi(categoriesToFetch);
  const defaultBackEndResponse = useBackendApi(defaultCategoriesToFetch);
  const dynamicCategoriesResponse = useDynamicGroups(dynamicQueriesToRun);
  const defaultDynamicCategoriesResponse = useDynamicGroups(
    defaultDynamicQueriesToRun
  );

  /*
   * Initial Load For Shared and Personal Pages
   * If collection and personal layout are undefined initially, then we need to
   * fetch all unknown categories.
   * It is simpler to make the promise twice since throttledPromise returns the
   * previous promise if the spec is same
   */
  React.useEffect(() => {
    if (sharedLayout === undefined) {
      // Have to set the last updated manually, since this is the first load
      handleSharedLayoutChange([defaultLayoutGenerated[0]]);
    }
  }, [sharedLayout, handleSharedLayoutChange]);

  React.useEffect(() => {
    if (personalLayout === undefined) {
      handlePersonalLayoutChange([defaultLayoutGenerated[1]]);
    }
  }, [handlePersonalLayoutChange, personalLayout]);

  /* Set Default Layout every time page is started from scratch*/
  React.useEffect(() => {
    setDefaultLayout(defaultLayoutGenerated);
    return cleanThrottledPromises;
  }, [setDefaultLayout]);

  const pageLastUpdated = activePage.isShared
    ? sharedLayout?.[activePage.pageIndex].lastUpdated
    : personalLayout?.[activePage.pageIndex].lastUpdated;

  const canEdit = !activePage.isShared || hasEditPermission;

  const pageLayout = activePage.isShared
    ? sharedLayout?.[activePage.pageIndex].categories === undefined
      ? undefined
      : sharedLayout[activePage.pageIndex]
    : personalLayout?.[activePage.pageIndex].categories === undefined
    ? undefined
    : personalLayout[activePage.pageIndex];

  const handleChange = React.useCallback(
    (
      newCategories: (
        oldCategory: StatLayout['categories']
      ) => StatLayout['categories']
    ): void =>
      setCurrentLayout((oldLayout: RA<StatLayout> | undefined) =>
        oldLayout === undefined
          ? undefined
          : replaceItem(oldLayout, activePage.pageIndex, {
              ...oldLayout[activePage.pageIndex],
              categories: newCategories(
                oldLayout[activePage.pageIndex].categories
              ),
            })
      ),
    [activePage.pageIndex, activePage.isShared]
  );
  // Used to set unknown categories once for layout initially, and every time for default layout
  useBackEndCategorySetter(
    backEndResponse,
    handleChange,
    categoriesToFetch,
    formatterSpec
  );
  useDefaultBackendCategorySetter(
    defaultBackEndResponse,
    setDefaultLayout,
    formatterSpec
  );
  useDefaultDynamicCategorySetter(
    defaultDynamicCategoriesResponse,
    setDefaultLayout
  );
  useDynamicCategorySetter(dynamicCategoriesResponse, handleChange);

  const previousCollectionLayout = React.useRef(
    sharedLayout as unknown as RA<StatLayout>
  );
  const previousLayout = React.useRef(
    personalLayout as unknown as RA<StatLayout>
  );

  React.useEffect(() => {
    handleSharedLayoutChange((layout) =>
      applyRefreshLayout(layout, refreshRate * 60)
    );
    handlePersonalLayoutChange((layout) =>
      applyRefreshLayout(layout, refreshRate * 60)
    );
  }, [handlePersonalLayoutChange, handleSharedLayoutChange]);

  React.useEffect(() => {
    /*
     * This function will be called every time layout changes so needs to filter
     * cases where page is already updated
     */
    if (pageLastUpdated !== undefined) return;
    setCurrentLayout((layout) =>
      layout === undefined
        ? undefined
        : layout.map((pageLayout, pageIndex) => {
            const date = new Date();
            return {
              ...pageLayout,
              lastUpdated:
                pageLayout.lastUpdated === undefined &&
                pageIndex === activePage.pageIndex
                  ? date.toJSON()
                  : pageLayout.lastUpdated,
            };
          })
    );
  }, [
    activePage.pageIndex,
    activePage.isShared,
    pageLastUpdated,
    setCurrentLayout,
    pageLayout,
  ]);

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
            ? [...oldCategory[categoryIndex ?? -1].items, modifyName(item)]
            : replaceItem(
                oldCategory[categoryIndex ?? -1].items,
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
      .flatMap(({ items }) => items)
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
                  oldValue[pageIndex].categories[categoryIndex].items,
                  itemIndex,
                  {
                    ...oldValue[pageIndex].categories[categoryIndex].items[
                      itemIndex
                    ],
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
          items: replaceItem(oldCategory[categoryIndex].items, itemIndex, {
            ...oldCategory[categoryIndex].items[itemIndex],
            itemValue: value,
          }),
        })
      ),
    [handleChange]
  );

  const refreshPage = () => {
    cleanThrottledPromises(false);
    setCurrentLayout((layout) =>
      layout === undefined
        ? undefined
        : replaceItem(
            layout,
            activePage.pageIndex,
            setLayoutUndefined(layout[activePage.pageIndex])
          )
    );
    setCategoriesToFetch([]);
  };

  const defaultStatsAddLeft = useDefaultStatsToAdd(
    layout[activePage.isShared ? statsText.shared() : statsText.private()]?.[
      activePage.pageIndex
    ],
    defaultLayout
  );

  return sharedLayout === undefined ? null : (
    <Form
      className={`${className.containerFullGray} md:overflow-y-none overflow-y-auto`}
      onSubmit={(): void => {
        setState({ type: 'DefaultState' });
        Promise.all([
          userPreferences.awaitSynced(),
          collectionPreferences.awaitSynced(),
        ]).catch(softFail);
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <H2 className="text-2xl">{statsText.statistics()}</H2>
        <span className="-ml-2 flex-1" />
        {pageLastUpdated !== undefined && (
          <span>
            {`${statsText.lastRefreshed()} `}
            <DateElement date={pageLastUpdated} />
          </span>
        )}
        <Button.BorderedGray onClick={(): void => refreshPage()}>
          {statsText.refresh()}
        </Button.BorderedGray>
        {Object.values(layout).every((layouts) => layouts !== undefined) && (
          <Button.BorderedGray
            onClick={(): void => {
              const date = new Date();
              const sourceIndex = activePage.isShared ? 0 : 1;
              const pageIndex = activePage.pageIndex;
              const statsTsv = statsToTsv(
                layout,
                activePage.pageIndex,
                activePage.isShared ? 0 : 1
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
          </Button.BorderedGray>
        )}
        {isEditing ? (
          <>
            {process.env.NODE_ENV === 'development' && (
              <Button.Secondary
                onClick={(): void => {
                  cleanThrottledPromises();
                  handleSharedLayoutChange(undefined);
                  handlePersonalLayoutChange(undefined);
                  setCategoriesToFetch([]);
                  setDynamicQueriesToRun([]);
                  setActivePage({
                    isShared: true,
                    pageIndex: 0,
                  });
                }}
              >
                {localized(`${commonText.reset()} [DEV]`)}
              </Button.Secondary>
            )}

            <Button.BorderedGray
              onClick={(): void => {
                handleSharedLayoutChange(previousCollectionLayout.current);
                handlePersonalLayoutChange(previousLayout.current);
                setState({ type: 'DefaultState' });
                setActivePage(({ isShared, pageIndex }) => {
                  /*
                   * Also handles cases where a new page is added and user clicks on cancel.
                   * Shifts to the last page in the current group
                   */
                  const previousLayoutRef = isShared
                    ? previousCollectionLayout
                    : previousLayout;
                  const newIndex = Math.min(
                    pageIndex,
                    previousLayoutRef.current.length - 1
                  );
                  return {
                    isShared,
                    pageIndex: newIndex,
                  };
                });
              }}
            >
              {commonText.cancel()}
            </Button.BorderedGray>
            <Submit.Save>{commonText.save()}</Submit.Save>
          </>
        ) : (
          canEdit && (
            <Button.BorderedGray
              onClick={(): void => {
                setState({
                  type: 'EditingState',
                });
                if (sharedLayout !== undefined)
                  previousCollectionLayout.current = sharedLayout;
                if (personalLayout !== undefined)
                  previousLayout.current = personalLayout;
              }}
            >
              {commonText.edit()}
            </Button.BorderedGray>
          )
        )}
      </div>
      <div className="flex flex-col md:overflow-hidden">
        <div className="flex flex-col gap-2 overflow-y-hidden md:flex-row">
          <aside
            className={`
                 top-0 flex min-w-fit flex-1 flex-col divide-y-4 !divide-[color:var(--form-background)]
                 md:sticky
              `}
          >
            <Ul className="flex flex-col gap-6">
              {Object.entries(layout).map(
                ([parentLayoutName, parentLayout], index) =>
                  parentLayout === undefined ? undefined : (
                    <li className="flex flex-col gap-2" key={index}>
                      <div className="flex flex-1 gap-2">
                        <H3 className="text-xl font-bold">
                          {parentLayoutName}
                        </H3>
                        {isEditing && canEditIndex(index === 0) && (
                          <div className="flex flex-1">
                            <Button.Icon
                              className="max-w-fit"
                              icon="plus"
                              title={commonText.add()}
                              onClick={(): void =>
                                setState({
                                  type: 'PageRenameState',
                                  pageIndex: undefined,
                                  isShared: index === 0,
                                })
                              }
                            />
                          </div>
                        )}
                      </div>

                      <Ul className="flex flex-col gap-2">
                        {parentLayout.map(({ label }, pageIndex) => (
                          <li key={pageIndex}>
                            <StatsAsideButton
                              isCurrent={
                                activePage.pageIndex === pageIndex &&
                                activePage.isShared === (index === 0)
                              }
                              label={label}
                              onClick={(): void =>
                                setActivePage({
                                  isShared: index === 0,
                                  pageIndex,
                                })
                              }
                              onRename={
                                isEditing && canEditIndex(index === 0)
                                  ? (): void =>
                                      setState({
                                        type: 'PageRenameState',
                                        isShared: index === 0,
                                        pageIndex,
                                      })
                                  : undefined
                              }
                            />
                          </li>
                        ))}
                      </Ul>
                    </li>
                  )
              )}
            </Ul>
          </aside>
          {state.type === 'PageRenameState' && (
            <StatsPageEditing
              label={
                typeof state.pageIndex === 'number'
                  ? state.isShared
                    ? localized(sharedLayout[state.pageIndex].label)
                    : localized(personalLayout?.[state.pageIndex].label)
                  : undefined
              }
              onAdd={
                typeof state.pageIndex === 'number'
                  ? undefined
                  : (label): void => {
                      const targetSourceLayout = getSourceLayout(
                        state.isShared
                      );
                      getSourceLayoutSetter(state.isShared)((layout) =>
                        layout === undefined
                          ? undefined
                          : [
                              ...layout,
                              {
                                label,
                                categories: [],
                                lastUpdated: undefined,
                              },
                            ]
                      );
                      setState({
                        type: 'EditingState',
                      });
                      if (targetSourceLayout !== undefined) {
                        setActivePage({
                          pageIndex: targetSourceLayout.length,
                          isShared: state.isShared,
                        });
                      }
                    }
              }
              onClose={(): void => setState({ type: 'EditingState' })}
              onRemove={
                state.pageIndex === undefined ||
                (getSourceLayout(state.isShared) ?? []).length <= 1
                  ? undefined
                  : (): void => {
                      const targetSourceLayout = getSourceLayout(
                        state.isShared
                      );
                      if (
                        targetSourceLayout !== undefined &&
                        state.pageIndex !== undefined
                      ) {
                        getSourceLayoutSetter(state.isShared)((oldLayout) =>
                          oldLayout === undefined
                            ? undefined
                            : removeItem(oldLayout, state.pageIndex!)
                        );
                        setState({
                          type: 'EditingState',
                        });
                        setActivePage({
                          pageIndex:
                            activePage.isShared === state.isShared
                              ? getOffsetOne(
                                  activePage.pageIndex,
                                  state.pageIndex
                                )
                              : activePage.pageIndex,
                          isShared: activePage.isShared,
                        });
                      }
                    }
              }
              onRename={
                state.pageIndex === undefined
                  ? undefined
                  : (value): void => {
                      const targetSourceLayout = getSourceLayout(
                        state.isShared
                      );
                      if (targetSourceLayout !== undefined) {
                        getSourceLayoutSetter(state.isShared)((layout) =>
                          layout === undefined || state.pageIndex === undefined
                            ? undefined
                            : replaceItem(layout, state.pageIndex, {
                                ...layout[state.pageIndex],
                                label: value,
                              })
                        );
                      }
                      setState({
                        type: 'EditingState',
                      });
                    }
              }
            />
          )}
          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4 overflow-y-auto px-4 pb-6">
            <Categories
              formatterSpec={formatterSpec}
              hasPermission={canEditIndex(activePage.isShared)}
              pageLayout={pageLayout}
              onAdd={
                isEditing && canEditIndex(activePage.isShared)
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
                              label: localized(''),
                              items: [],
                            },
                          ])
                  : undefined
              }
              onCategoryRename={
                isEditing && canEditIndex(activePage.isShared)
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
                            oldCategory[categoryIndex].items,
                            itemIndex,
                            {
                              ...oldCategory[categoryIndex].items[itemIndex],
                              ...(oldCategory[categoryIndex].items[itemIndex]
                                .type === 'DefaultStat'
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
                          oldCategory[categoryIndex].items,
                          itemIndex
                        ),
                      })
                    : removeItem(oldCategory, categoryIndex)
                )
              }
              onRename={
                isEditing
                  ? (categoryIndex, itemIndex, newLabel): void =>
                      handleChange((oldCategory) =>
                        replaceItem(oldCategory, categoryIndex, {
                          ...oldCategory[categoryIndex],
                          items: replaceItem(
                            oldCategory[categoryIndex].items,
                            itemIndex,
                            {
                              ...oldCategory[categoryIndex].items[itemIndex],
                              label: localized(newLabel),
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
          formatterSpec={formatterSpec}
          onAdd={(item, itemIndex): void => {
            handleAdd(item, state.categoryIndex, itemIndex);
          }}
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
          onInitialLoad={() => {
            setDefaultCategoriesToFetch(allCategories);
            setDefaultDynamicQueriesToRun(allDynamicQueries);
          }}
          onLoad={handleDefaultLoad}
        />
      )}
    </Form>
  );
}
