import React from 'react';

import { useUnloadProtect } from '../../hooks/navigation';
import { useResource } from '../../hooks/resource';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { useIsModified } from '../../hooks/useIsModified';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Container } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getModelById } from '../DataModel/schema';
import type { RecordSet, SpQuery } from '../DataModel/types';
import { useMenuItem } from '../Header/useMenuItem';
import { isTreeModel, treeRanksPromise } from '../InitialContext/treeRanks';
import { useTitle } from '../Molecules/AppTitle';
import { hasPermission } from '../Permissions/helpers';
import { usePref } from '../UserPreferences/usePref';
import { getMappedFields, mappingPathIsComplete } from '../WbPlanView/helpers';
import { getMappingLineProps } from '../WbPlanView/LineComponents';
import { MappingView } from '../WbPlanView/MapperComponents';
import {
  anyTreeRank,
  formattedEntry,
  formatTreeRank,
  valueIsTreeRank,
} from '../WbPlanView/mappingHelpers';
import { getMappingLineData } from '../WbPlanView/navigator';
import { CheckReadAccess } from './CheckReadAccess';
import { MakeRecordSetButton } from './Components';
import { QueryExportButtons } from './Export';
import { QueryFields } from './Fields';
import { QueryFromMap } from './FromMap';
import { QueryHeader } from './Header';
import { mutateLineData, smoothScroll, unParseQueryFields } from './helpers';
import { getInitialState, reducer } from './reducer';
import { QueryResultsWrapper } from './ResultsWrapper';
import { QueryToolbar } from './Toolbar';

const fetchTreeRanks = async (): Promise<true> => treeRanksPromise.then(f.true);

// Use this state while real state is being resolved
const pendingState = {
  type: 'MainState',
  fields: [],
  showMappingView: true,
  mappingView: ['0'],
  queryRunCount: 0,
  openedElement: { line: 1, index: undefined },
  saveRequired: false,
  baseTableName: 'CollectionObject',
} as const;

// REFACTOR: split this component
export function QueryBuilder({
  query: queryResource,
  isReadOnly,
  recordSet,
  forceCollection,
  isEmbedded = false,
  autoRun = false,
  // If present, this callback is called when query results are selected
  onSelected: handleSelected,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly isReadOnly: boolean;
  readonly recordSet?: SpecifyResource<RecordSet>;
  readonly forceCollection: number | undefined;
  readonly isEmbedded?: boolean;
  readonly autoRun?: boolean;
  readonly onSelected?: (selected: RA<number>) => void;
}): JSX.Element | null {
  useMenuItem('queries');

  const [treeRanksLoaded = false] = useAsyncState(fetchTreeRanks, true);

  const [query, setQuery] = useResource(queryResource);
  useErrorContext('query', query);

  const model = getModelById(query.contextTableId);
  const buildInitialState = React.useCallback(
    () =>
      getInitialState({
        query,
        queryResource,
        model,
        autoRun,
      }),
    [queryResource, model, autoRun]
  );
  const [state, dispatch] = React.useReducer(reducer, pendingState);
  React.useEffect(() => {
    dispatch({
      type: 'ResetStateAction',
      state: buildInitialState(),
    });
  }, [buildInitialState]);
  useErrorContext('state', state);

  /**
   * If tried to save a query, enforce the field length limit for the
   * startValue field.
   * Until query is saved, that limit does not matter as ephemeral query
   * does not care about field length limits.
   * This allows for executing a query with a long value for the "IN" filter.
   */
  const [triedToSave, handleTriedToSave] = useBooleanState();

  const [showHiddenFields = false, setShowHiddenFields] = useCachedState(
    'queryBuilder',
    'showHiddenFields'
  );

  const isResourceModified = useIsModified(queryResource);
  const saveRequired =
    (isResourceModified || state.saveRequired) && !isEmbedded;

  const unsetUnloadProtect = useUnloadProtect(
    saveRequired,
    queryText.queryUnloadProtect()
  );

  const handleAddField = (mappingPath = state.mappingView): void =>
    dispatch({
      type: 'ChangeFieldsAction',
      fields: [
        ...state.fields,
        {
          id: Math.max(-1, ...state.fields.map(({ id }) => id)) + 1,
          mappingPath,
          sortType: undefined,
          filters: [
            {
              type: 'any',
              startValue: '',
              isNot: false,
            },
          ],
          isDisplay: true,
        },
      ],
    });

  const isEmpty = state.fields.every(
    ({ mappingPath }) => !mappingPathIsComplete(mappingPath)
  );

  /*
   * That function does not need to be called most of the time if query
   * fields haven't changed yet. This avoids triggering needless save blocker
   */
  const getQueryFieldRecords = saveRequired
    ? (
        fields: typeof state.fields = state.fields
      ): ReturnType<typeof unParseQueryFields> =>
        unParseQueryFields(state.baseTableName, fields)
    : undefined;

  /*
   * REFACTOR: simplify this (move "executed query" state into this component
   *    and get rid of queryRunCount)
   */
  function runQuery(
    mode: 'count' | 'regular',
    fields: typeof state.fields = state.fields
  ): void {
    if (isEmpty || !hasPermission('/querybuilder/query', 'execute')) return;
    setQuery({
      ...query,
      fields: getQueryFieldRecords?.(fields) ?? query.fields,
      countOnly: mode === 'count',
    });
    /*
     * Wait for new query to propagate before re running it
     * TEST: check if this still works after updating to React 18
     */
    globalThis.setTimeout(() => dispatch({ type: 'RunQueryAction' }), 0);
  }

  const getMappedFieldsBind = getMappedFields.bind(undefined, state.fields);
  const mapButtonEnabled =
    !isReadOnly &&
    mappingPathIsComplete(state.mappingView) &&
    !getMappedFieldsBind(state.mappingView.slice(0, -1)).includes(
      state.mappingView.at(-1)!
    );

  // Scroll down to query results when pressed the "Query" button
  const [form, setForm] = React.useState<HTMLFormElement | null>(null);
  React.useEffect(
    () =>
      state.queryRunCount !== 0 && form !== null
        ? smoothScroll(form, form.scrollHeight)
        : undefined,
    [state.queryRunCount, form]
  );

  useTitle(query.name);

  const [isQueryRunPending, handleQueryRunPending, handleNoQueryRunPending] =
    useBooleanState();
  React.useEffect(() => {
    if (!isQueryRunPending) return;
    handleNoQueryRunPending();
    runQuery('regular');
    // Only reRun when isQueryRunPending is true, not when runQuery changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQueryRunPending, handleNoQueryRunPending]);

  const [isScrolledTop, handleScrollTop, handleScrolledDown] =
    useBooleanState(true);

  const [mapFieldIndex, setMapFieldIndex] = React.useState<number | undefined>(
    undefined
  );

  const [stickyScrolling] = usePref(
    'queryBuilder',
    'behavior',
    'stickyScrolling'
  );
  const resultsShown = state.queryRunCount !== 0;

  return treeRanksLoaded ? (
    <Container.Full
      className={`overflow-hidden ${isEmbedded ? 'py-0' : ''}`}
      onClick={
        state.openedElement.index === undefined
          ? undefined
          : (event): void =>
              (event.target as HTMLElement).closest(
                '.custom-select-closed-list'
              ) === null &&
              (event.target as HTMLElement).closest(
                '.custom-select-options-list'
              ) === null
                ? dispatch({
                    type: 'ChangeOpenedElementAction',
                    line: state.openedElement.line,
                    index: undefined,
                  })
                : undefined
      }
    >
      {typeof mapFieldIndex === 'number' && (
        <QueryFromMap
          fields={state.fields}
          lineNumber={mapFieldIndex}
          onChange={(fields): void =>
            dispatch({ type: 'ChangeFieldsAction', fields })
          }
          onClose={(): void => setMapFieldIndex(undefined)}
        />
      )}
      {/*
       * FEATURE: For embedded queries, add a button to open query in new tab
       *   See https://github.com/specify/specify7/issues/3000
       */}
      {!isEmbedded && (
        <QueryHeader
          form={form}
          getQueryFieldRecords={getQueryFieldRecords}
          isReadOnly={isReadOnly}
          isScrolledTop={isScrolledTop}
          query={query}
          queryResource={queryResource}
          recordSet={recordSet}
          saveRequired={saveRequired}
          state={state}
          toggleMapping={(): void =>
            dispatch({
              type: 'ToggleMappingViewAction',
              isVisible: !state.showMappingView,
            })
          }
          unsetUnloadProtect={unsetUnloadProtect}
          onSaved={(): void => dispatch({ type: 'SavedQueryAction' })}
          onTriedToSave={handleTriedToSave}
        />
      )}
      <CheckReadAccess query={query} />
      <Form
        className={`
          -mx-4 grid h-full gap-4 overflow-y-auto px-4
          ${stickyScrolling ? 'snap-y snap-proximity' : ''}
          ${resultsShown ? 'grid-rows-[100%_100%]' : 'grid-rows-[100%]'}
        `}
        forwardRef={setForm}
        onScroll={(): void =>
          /*
           * Dividing by 4 results in button appearing only once user scrolled
           * 50% past the first half of the page
           */
          form === null || form.scrollTop < form.scrollHeight / 4
            ? handleScrollTop()
            : handleScrolledDown()
        }
        onSubmit={(): void => {
          /*
           * If a filter for a query field was changed, and the <input> is
           * still focused, the new value is not yet in global state.
           * The value would be in global state after onBlur on <input>.
           * If user hits "Enter", the form submission event is fired before
           * onBlur (at least in Chrome and Firefox), and the query is run
           * with the stale query field filter. This does not happen if query
           * is run by pressing the "Query" button as that triggers onBlur
           *
           * The workaround is to check if input field is focused before
           * submitting the query, and if it is, trigger blur, wait for
           * global state to get updated and only then re run the query.
           *
           * See more: https://github.com/specify/specify7/issues/1647
           */

          const focusedInput =
            document.activeElement?.tagName === 'INPUT'
              ? (document.activeElement as HTMLInputElement)
              : undefined;
          if (
            typeof focusedInput === 'object' &&
            focusedInput.type !== 'submit'
          ) {
            // Trigger onBlur handler that parses the filter field value
            focusedInput.blur();
            // Return focus back to the field
            focusedInput.focus();
            // ReRun the query after React propagates the change
            handleQueryRunPending();
          } else runQuery('regular');
        }}
      >
        <div className="flex snap-start flex-col gap-4 overflow-hidden">
          {state.showMappingView && (
            <MappingView
              mappingElementProps={getMappingLineProps({
                mappingLineData: mutateLineData(
                  getMappingLineData({
                    baseTableName: state.baseTableName,
                    mappingPath: state.mappingView,
                    showHiddenFields,
                    generateFieldData: 'all',
                    scope: 'queryBuilder',
                    getMappedFields: getMappedFieldsBind,
                  })
                ),
                customSelectType: 'OPENED_LIST',
                onChange({ isDoubleClick, ...rest }) {
                  if (isDoubleClick && mapButtonEnabled) handleAddField();
                  else if (
                    isDoubleClick &&
                    rest.isRelationship &&
                    !isReadOnly
                  ) {
                    const newMappingPath = filterArray([
                      ...state.mappingView.slice(0, -1),
                      typeof rest.newTableName === 'string' &&
                      isTreeModel(rest.newTableName) &&
                      !valueIsTreeRank(state.mappingView.at(-2))
                        ? formatTreeRank(anyTreeRank)
                        : undefined,
                      formattedEntry,
                    ]);
                    if (
                      !getMappedFieldsBind(
                        newMappingPath.slice(0, -1)
                      ).includes(newMappingPath.at(-1)!)
                    )
                      handleAddField(newMappingPath);
                  } else
                    dispatch({
                      type: 'ChangeSelectElementValueAction',
                      line: 'mappingView',
                      ...rest,
                    });
                },
              })}
            >
              {isReadOnly ? undefined : (
                <Button.Small
                  aria-label={commonText.add()}
                  className="justify-center p-2"
                  disabled={!mapButtonEnabled}
                  title={queryText.newButtonDescription()}
                  onClick={f.zero(handleAddField)}
                >
                  {icons.plus}
                </Button.Small>
              )}
            </MappingView>
          )}
          <QueryFields
            baseTableName={state.baseTableName}
            enforceLengthLimit={triedToSave}
            fields={state.fields}
            getMappedFields={getMappedFieldsBind}
            openedElement={state.openedElement}
            showHiddenFields={showHiddenFields}
            onChangeField={
              isReadOnly
                ? undefined
                : (line, field): void =>
                    dispatch({ type: 'ChangeFieldAction', line, field })
            }
            onClose={(): void =>
              dispatch({
                type: 'ChangeOpenedElementAction',
                line: state.openedElement.line,
                index: undefined,
              })
            }
            onLineFocus={
              isReadOnly
                ? undefined
                : (line): void =>
                    state.openedElement.line === line
                      ? undefined
                      : dispatch({
                          type: 'FocusLineAction',
                          line,
                        })
            }
            onLineMove={
              isReadOnly
                ? undefined
                : (line, direction): void =>
                    dispatch({
                      type: 'LineMoveAction',
                      line,
                      direction,
                    })
            }
            onMappingChange={
              isReadOnly
                ? undefined
                : (line, payload): void =>
                    dispatch({
                      type: 'ChangeSelectElementValueAction',
                      line,
                      ...payload,
                    })
            }
            onOpen={(line, index): void =>
              dispatch({
                type: 'ChangeOpenedElementAction',
                line,
                index,
              })
            }
            onOpenMap={setMapFieldIndex}
            onRemoveField={
              isReadOnly
                ? undefined
                : (line): void =>
                    dispatch({
                      type: 'ChangeFieldsAction',
                      fields: state.fields.filter((_, index) => index !== line),
                    })
            }
          />
          <QueryToolbar
            isDistinct={query.selectDistinct ?? false}
            isEmpty={isEmpty}
            modelName={model.name}
            showHiddenFields={showHiddenFields}
            onRunCountOnly={(): void => runQuery('count')}
            onSubmitClick={(): void =>
              form?.checkValidity() === false ? runQuery('regular') : undefined
            }
            onToggleDistinct={(): void =>
              setQuery({
                ...query,
                selectDistinct: !(query.selectDistinct ?? false),
              })
            }
            onToggleHidden={setShowHiddenFields}
          />
        </div>
        {hasPermission('/querybuilder/query', 'execute') && (
          <QueryResultsWrapper
            baseTableName={state.baseTableName}
            createRecordSet={
              !isReadOnly &&
              hasPermission('/querybuilder/query', 'create_recordset') ? (
                <MakeRecordSetButton
                  baseTableName={state.baseTableName}
                  fields={state.fields}
                  getQueryFieldRecords={getQueryFieldRecords}
                  queryResource={queryResource}
                />
              ) : undefined
            }
            extraButtons={
              query.countOnly ? undefined : (
                <QueryExportButtons
                  baseTableName={state.baseTableName}
                  fields={state.fields}
                  getQueryFieldRecords={getQueryFieldRecords}
                  queryResource={queryResource}
                  recordSetId={recordSet?.id}
                />
              )
            }
            fields={state.fields}
            forceCollection={forceCollection}
            model={model}
            queryResource={queryResource}
            queryRunCount={state.queryRunCount}
            recordSetId={recordSet?.id}
            onSelected={handleSelected}
            onSortChange={(fields): void => {
              dispatch({
                type: 'ChangeFieldsAction',
                fields,
              });
              runQuery('regular', fields);
            }}
          />
        )}
      </Form>
    </Container.Full>
  ) : null;
}
