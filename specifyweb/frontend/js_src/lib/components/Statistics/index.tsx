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
import { PageNameDialog } from './PageNameDialog';
import { PageButton } from './Buttons';

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
                setActivePageIndex(
                  activePageIndex >= previousLayout.current.length
                    ? previousLayout.current.length - 1
                    : activePageIndex
                );
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
              <PageButton
                onClick={(): void => {
                  setState({
                    type: 'PageRenameState',
                    pageIndex: undefined,
                  });
                }}
                isActive={false}
                label={commonText('add')}
                onDialogOpen={undefined}
              />
            )}
          </aside>
          {state.type === 'PageRenameState' && (
            <PageNameDialog
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
