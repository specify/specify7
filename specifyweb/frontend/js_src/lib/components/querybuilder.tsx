import React from 'react';

import type { RecordSet, SpQuery } from '../datamodel';
import { f } from '../functools';
import { replaceItem } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { queryText } from '../localization/query';
import { hasPermission, hasToolPermission } from '../permissionutils';
import { getInitialState, reducer } from '../querybuilderreducer';
import {
  mutateLineData,
  smoothScroll,
  unParseQueryFields,
} from '../querybuilderutils';
import { getModelById, schema } from '../schema';
import { isTreeModel, treeRanksPromise } from '../treedefinitions';
import type { RA } from '../types';
import { defined, filterArray } from '../types';
import {
  anyTreeRank,
  formattedEntry,
  formatTreeRank,
} from '../wbplanviewmappinghelper';
import { getMappingLineData } from '../wbplanviewnavigator';
import { getMappedFields, mappingPathIsComplete } from '../wbplanviewutils';
import { Button, Container, Form, H2, Input, Label, Submit } from './basic';
import { TableIcon } from './common';
import { ErrorBoundary } from './errorboundary';
import { useAsyncState, useBooleanState, useTitle } from './hooks';
import { useIsModified } from './useismodified';
import { icons } from './icons';
import { useUnloadProtect } from './navigation';
import { ProtectedAction, ProtectedTable } from './permissiondenied';
import { usePref } from './preferenceshooks';
import {
  MakeRecordSetButton,
  QueryExportButtons,
  QueryLoanReturn,
  SaveQueryButtons,
} from './querybuildercomponents';
import { QueryFields } from './querybuilderfields';
import { QueryEditButton } from './queryedit';
import { QueryFromMap } from './queryfrommap';
import { QueryResultsWrapper } from './queryresultstable';
import { useResource } from './resource';
import { useCachedState } from './statecache';
import { getMappingLineProps } from './wbplanviewcomponents';
import { MappingView } from './wbplanviewmappercomponents';
import { useMenuItem } from './header';
import { useErrorContext } from '../errorcontext';

const fetchTreeRanks = async (): Promise<true> => treeRanksPromise.then(f.true);

// Use this state while real state is being resolved
const pendingState = {
  type: 'MainState',
  fields: [],
  mappingView: ['0'],
  queryRunCount: 0,
  openedElement: { line: 1, index: undefined },
  saveRequired: false,
  baseTableName: 'CollectionObject',
} as const;

export function QueryBuilder({
  query: queryResource,
  isReadOnly,
  recordSet,
  isEmbedded = false,
  autoRun = false,
  // If present, this callback is called when query results are selected
  onSelected: handleSelected,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly isReadOnly: boolean;
  readonly recordSet?: SpecifyResource<RecordSet>;
  readonly isEmbedded?: boolean;
  readonly autoRun?: boolean;
  readonly onSelected?: (selected: RA<number>) => void;
}): JSX.Element | null {
  useMenuItem('queries');

  const [treeRanksLoaded = false] = useAsyncState(fetchTreeRanks, true);

  const [query, setQuery] = useResource(queryResource);
  useErrorContext('query', query);

  const model = defined(getModelById(query.contextTableId));
  const buildInitialState = React.useCallback(
    () =>
      getInitialState({
        query,
        queryResource,
        model,
        autoRun,
      }),
    [query, queryResource, model, autoRun]
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
   * Until query is saved, that limit does not matter as ephermal query
   * does not care about field length limits.
   * This allows for executing a query with a long value for the "IN" filter.
   */
  const [triedToSave, handleTriedToSave] = useBooleanState();

  const [showHiddenFields = false, setShowHiddenFields] = useCachedState(
    'queryBuilder',
    'showHiddenFields'
  );

  const saveRequired =
    (useIsModified(queryResource) || state.saveRequired) && !isEmbedded;

  const unsetUnloadProtect = useUnloadProtect(
    saveRequired,
    queryText('queryUnloadProtectDialogText')
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

  const isEmpty = state.fields.some(({ mappingPath }) =>
    mappingPathIsComplete(mappingPath)
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
    if (!isEmpty || !hasPermission('/querybuilder/query', 'execute')) return;
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
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  React.useEffect(
    () =>
      state.queryRunCount !== 0 && container !== null
        ? smoothScroll(container, container.scrollHeight)
        : undefined,
    [state.queryRunCount, container]
  );

  useTitle(query.name);

  const formRef = React.useRef<HTMLFormElement | null>(null);

  const [stickyScrolling] = usePref(
    'queryBuilder',
    'behavior',
    'stickyScrolling'
  );

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

  return treeRanksLoaded ? (
    <Container.Full
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
      <Form
        className="contents"
        forwardRef={formRef}
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
        {
          /* FEATURE: For embedded queries, add a button to open query in new tab */
          !isEmbedded && (
            <header className="flex items-center gap-2 whitespace-nowrap">
              <TableIcon label name={model.name} />
              <H2 className="overflow-x-auto">
                {typeof recordSet === 'object'
                  ? queryText(
                      'queryRecordSetTitle',
                      query.name,
                      recordSet.get('name')
                    )
                  : queryText('queryTaskTitle', query.name)}
              </H2>
              {!queryResource.isNew() && <QueryEditButton query={query} />}
              <span className="ml-2 flex-1" />
              {!isScrolledTop && (
                <Button.Small
                  onClick={(): void =>
                    container === null ? undefined : smoothScroll(container, 0)
                  }
                >
                  {queryText('editQuery')}
                </Button.Small>
              )}
              {state.baseTableName === 'LoanPreparation' && (
                <ProtectedAction
                  action="execute"
                  resource="/querybuilder/query"
                >
                  <ProtectedTable action="update" tableName="Loan">
                    <ProtectedTable
                      action="create"
                      tableName="LoanReturnPreparation"
                    >
                      <ProtectedTable action="read" tableName="LoanPreparation">
                        <ErrorBoundary dismissable>
                          <QueryLoanReturn
                            fields={state.fields}
                            getQueryFieldRecords={getQueryFieldRecords}
                            queryResource={queryResource}
                          />
                        </ErrorBoundary>
                      </ProtectedTable>
                    </ProtectedTable>
                  </ProtectedTable>
                </ProtectedAction>
              )}
              {hasToolPermission(
                'queryBuilder',
                queryResource.isNew() ? 'create' : 'update'
              ) && (
                <SaveQueryButtons
                  fields={state.fields}
                  getQueryFieldRecords={getQueryFieldRecords}
                  isReadOnly={isReadOnly}
                  isValid={(): boolean =>
                    formRef.current?.reportValidity() ?? false
                  }
                  queryResource={queryResource}
                  saveRequired={saveRequired}
                  unsetUnloadProtect={unsetUnloadProtect}
                  onSaved={(): void => dispatch({ type: 'SavedQueryAction' })}
                  onTriedToSave={(): boolean => {
                    handleTriedToSave();
                    const fieldLengthLimit =
                      defined(
                        schema.models.SpQueryField.getLiteralField('startValue')
                      ).length ?? Number.POSITIVE_INFINITY;
                    return state.fields.every((field) =>
                      field.filters.every(
                        ({ startValue }) => startValue.length < fieldLengthLimit
                      )
                    );
                  }}
                />
              )}
            </header>
          )
        }
        <div
          className={`
            grid flex-1 grid-cols-1 gap-4 overflow-y-auto
            ${stickyScrolling ? 'snap-y snap-proximity' : ''}
            ${
              isEmbedded
                ? ''
                : state.queryRunCount === 0
                ? 'grid-rows-[100%]'
                : 'grid-rows-[100%_100%]'
            }
            ${isEmbedded ? '' : '-mx-4 px-4'}
          `}
          ref={setContainer}
          onScroll={(): void =>
            /*
             * Dividing by 4 results in button appearing only once user scrolled
             * 50% past the first half of the page
             */
            container === null ||
            container.scrollTop < container.scrollHeight / 4
              ? handleScrollTop()
              : handleScrolledDown()
          }
        >
          <div className="flex snap-start flex-col gap-4">
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
                      isTreeModel(rest.newTableName)
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
                  aria-label={commonText('add')}
                  className="justify-center p-2"
                  disabled={!mapButtonEnabled}
                  title={queryText('newButtonDescription')}
                  onClick={f.zero(handleAddField)}
                >
                  {icons.plus}
                </Button.Small>
              )}
            </MappingView>
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
                        fields: state.fields.filter(
                          (_, index) => index !== line
                        ),
                      })
              }
            />
            <div className="flex flex-wrap gap-2" role="toolbar">
              <Label.ForCheckbox>
                <Input.Checkbox
                  checked={showHiddenFields}
                  onValueChange={setShowHiddenFields}
                />
                {commonText('revealHiddenFormFields')}
              </Label.ForCheckbox>
              <span className="-ml-2 flex-1" />
              {hasPermission('/querybuilder/query', 'execute') && (
                <>
                  {/*
                   * Query Distinct for trees is disabled because of
                   * https://github.com/specify/specify7/pull/1019#issuecomment-973525594
                   */}
                  {!isTreeModel(model.name) && (
                    <Label.ForCheckbox>
                      <Input.Checkbox
                        checked={query.selectDistinct ?? false}
                        disabled={!isEmpty}
                        onChange={(): void =>
                          setQuery({
                            ...query,
                            selectDistinct: !(query.selectDistinct ?? false),
                          })
                        }
                      />
                      {queryText('distinct')}
                    </Label.ForCheckbox>
                  )}
                  <Button.Small
                    disabled={!isEmpty}
                    onClick={(): void => runQuery('count')}
                  >
                    {queryText('countOnly')}
                  </Button.Small>
                  <Submit.Small disabled={!isEmpty}>
                    {commonText('query')}
                  </Submit.Small>
                </>
              )}
            </div>
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
                <QueryExportButtons
                  baseTableName={state.baseTableName}
                  fields={state.fields}
                  getQueryFieldRecords={getQueryFieldRecords}
                  queryResource={queryResource}
                />
              }
              fields={state.fields}
              model={model}
              queryResource={queryResource}
              queryRunCount={state.queryRunCount}
              recordSetId={recordSet?.id}
              onSelected={handleSelected}
              onSortChange={(index, sortType): void => {
                dispatch({
                  type: 'ChangeFieldAction',
                  line: index,
                  field: { ...state.fields[index], sortType },
                });
                runQuery(
                  'regular',
                  replaceItem(state.fields, index, {
                    ...state.fields[index],
                    sortType,
                  })
                );
              }}
            />
          )}
        </div>
      </Form>
    </Container.Full>
  ) : null;
}
