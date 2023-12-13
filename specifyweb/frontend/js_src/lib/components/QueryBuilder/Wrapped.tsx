import React from 'react';

import { useUnloadProtect } from '../../hooks/navigation';
import { useResource } from '../../hooks/resource';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { throttle } from '../../utils/utils';
import { Container } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getModelById } from '../DataModel/schema';
import type { RecordSet, SpQuery, SpQueryField } from '../DataModel/types';
import { useMenuItem } from '../Header/useMenuItem';
import { isTreeModel, treeRanksPromise } from '../InitialContext/treeRanks';
import { useTitle } from '../Molecules/AppTitle';
import { hasPermission, hasToolPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { QueryBuilderSkeleton } from '../SkeletonLoaders/QueryBuilder';
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
import { IsQueryBasicContext, useQueryViewPref } from './Context';
import { QueryExportButtons } from './Export';
import { QueryFields } from './Fields';
import { QueryFromMap } from './FromMap';
import { QueryHeader } from './Header';
import { mutateLineData, smoothScroll, unParseQueryFields } from './helpers';
import { getInitialState, reducer } from './reducer';
import type { QueryResultRow } from './Results';
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
  baseTableName: 'CollectionObject',
} as const;

// REFACTOR: split this component
export function QueryBuilder({
  query: queryResource,
  recordSet,
  forceCollection,
  isEmbedded = false,
  autoRun = false,
  // If present, this callback is called when query results are selected
  onSelected: handleSelected,
  onChange: handleChange,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly recordSet?: SpecifyResource<RecordSet>;
  readonly forceCollection: number | undefined;
  readonly isEmbedded?: boolean;
  readonly autoRun?: boolean;
  readonly onSelected?: (selected: RA<number>) => void;
  readonly onChange?: ({
    fields,
    isDistinct,
  }: {
    readonly fields: RA<SerializedResource<SpQueryField>>;
    readonly isDistinct: boolean | null;
  }) => void;
}): JSX.Element | null {
  useMenuItem('queries');
  const isReadOnly =
    !hasPermission('/querybuilder/query', 'execute') &&
    !hasToolPermission(
      'queryBuilder',
      queryResource.isNew() ? 'create' : 'update'
    );
  const [treeRanksLoaded = false] = useAsyncState(fetchTreeRanks, false);

  const [query, setQuery] = useResource(queryResource);
  useErrorContext('query', query);

  const [selectedRows, setSelectedRows] = React.useState<ReadonlySet<number>>(
    new Set()
  );

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

  const [showMappingView = true, _] = useCachedState(
    'queryBuilder',
    'showMappingView'
  );

  const [state, dispatch] = React.useReducer(reducer, pendingState);

  const initialFields = React.useRef<string>('');

  const [saveRequired, setSaveRequired] = React.useState(false);

  React.useEffect(() => {
    const initialState = buildInitialState();
    dispatch({
      type: 'ResetStateAction',
      state: initialState,
    });
    initialFields.current = JSON.stringify(initialState.fields);
  }, [buildInitialState]);

  const checkForChanges = React.useMemo(
    () =>
      throttle(
        () =>
          setSaveRequired(
            state !== pendingState &&
              initialFields.current !== JSON.stringify(state.fields)
          ),
        200
      ),
    [initialFields.current, state.fields]
  );

  React.useEffect(checkForChanges, [state.fields]);

  React.useEffect(() => {
    handleChange?.({
      fields: unParseQueryFields(state.baseTableName, state.fields),
      isDistinct: query.selectDistinct,
    });
  }, [state, query.selectDistinct]);
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

  const promptToSave = saveRequired && !isEmbedded;

  const unsetUnloadProtect = useUnloadProtect(
    promptToSave,
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
    if (!hasPermission('/querybuilder/query', 'execute')) return;

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

  const [stickyScrolling] = userPreferences.use(
    'queryBuilder',
    'behavior',
    'stickyScrolling'
  );
  const resultsShown = state.queryRunCount !== 0;

  const [isBasic] = useQueryViewPref(query.id);

  const resultsRef = React.useRef<RA<QueryResultRow | undefined> | undefined>(
    undefined
  );

  return treeRanksLoaded ? (
    <IsQueryBasicContext.Provider value={isBasic}>
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
        <QueryHeader
          form={form}
          getQueryFieldRecords={getQueryFieldRecords}
          isEmbedded={isEmbedded}
          isReadOnly={isReadOnly}
          isScrolledTop={isScrolledTop}
          query={query}
          queryResource={queryResource}
          recordSet={recordSet}
          saveRequired={saveRequired}
          state={state}
          unsetUnloadProtect={unsetUnloadProtect}
          onSaved={(): void => {
            setSaveRequired(false);
            initialFields.current = JSON.stringify(state.fields);
            dispatch({ type: 'SavedQueryAction' });
          }}
          onTriedToSave={handleTriedToSave}
        />
        <CheckReadAccess query={query} />
        <Form
          className={`
          -mx-4 grid h-full gap-4 overflow-y-auto px-4
          ${stickyScrolling ? 'snap-y snap-proximity' : ''}
          ${resultsShown ? 'sm:grid-rows-[100%_100%]' : 'grid-rows-[100%]'}
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
          <div className="flex snap-start flex-col gap-4 overflow-y-auto">
            {showMappingView && (
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
                      const isTree =
                        typeof rest.newTableName === 'string' &&
                        isTreeModel(rest.newTableName);

                      const newMappingPath = filterArray([
                        ...state.mappingView.slice(0, -1),
                        isTree && !valueIsTreeRank(state.mappingView.at(-2))
                          ? formatTreeRank(anyTreeRank)
                          : undefined,
                        /*
                         * Use fullName instead of (formatted) for specific
                         * tree ranks
                         * Specifc tree ranks can not be formatted and use
                         * fullName instead. See #3026
                         */
                        !isTree ||
                        state.mappingView.at(-2) === formatTreeRank(anyTreeRank)
                          ? formattedEntry
                          : 'fullName',
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
                      dispatch({
                        type: 'ChangeFieldAction',
                        line,
                        field,
                      })
              }
              onChangeFields={
                isReadOnly
                  ? undefined
                  : (fields): void =>
                      dispatch({
                        type: 'ChangeFieldsAction',
                        fields,
                      })
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
                        fields: state.fields.filter(
                          (_, index) => index !== line
                        ),
                      })
              }
            />
            <QueryToolbar
              isDistinct={query.selectDistinct ?? false}
              modelName={model.name}
              showHiddenFields={showHiddenFields}
              onRunCountOnly={(): void => runQuery('count')}
              onSubmitClick={(): void =>
                form?.checkValidity() === false
                  ? runQuery('regular')
                  : undefined
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
              exportButtons={
                query.countOnly ? undefined : (
                  <QueryExportButtons
                    baseTableName={state.baseTableName}
                    fields={state.fields}
                    getQueryFieldRecords={getQueryFieldRecords}
                    queryResource={queryResource}
                    recordSetId={recordSet?.id}
                    results={resultsRef}
                    selectedRows={selectedRows}
                  />
                )
              }
              fields={state.fields}
              forceCollection={forceCollection}
              model={model}
              queryResource={queryResource}
              queryRunCount={state.queryRunCount}
              recordSetId={recordSet?.id}
              resultsRef={resultsRef}
              selectedRows={[selectedRows, setSelectedRows]}
              onReRun={(): void =>
                dispatch({
                  type: 'RunQueryAction',
                })
              }
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
    </IsQueryBasicContext.Provider>
  ) : (
    <QueryBuilderSkeleton />
  );
}
