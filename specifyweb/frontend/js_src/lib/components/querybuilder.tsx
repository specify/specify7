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
import {
  useAsyncState,
  useBooleanState,
  useIsModified,
  useTitle,
} from './hooks';
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
  const [treeRanks] = useAsyncState(
    React.useCallback(async () => treeRanksPromise, []),
    true
  );

  const [query, setQuery] = useResource(queryResource);

  const model = defined(getModelById(query.contextTableId));
  const [state, dispatch] = React.useReducer(
    reducer,
    {
      query,
      queryResource,
      model,
      autoRun,
    },
    getInitialState
  );

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
    mode: 'regular' | 'count',
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
      state.mappingView.slice(-1)[0]
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

  return typeof treeRanks === 'object' ? (
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
          onClose={(): void => setMapFieldIndex(undefined)}
          onChange={(fields): void =>
            dispatch({ type: 'ChangeFieldsAction', fields })
          }
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
            <header className="whitespace-nowrap flex items-center gap-2">
              <TableIcon name={model.name} label />
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
              <span className="flex-1 ml-2" />
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
                  resource="/querybuilder/query"
                  action="execute"
                >
                  <ProtectedTable tableName="Loan" action="update">
                    <ProtectedTable
                      tableName="LoanReturnPreparation"
                      action="create"
                    >
                      <ProtectedTable tableName="LoanPreparation" action="read">
                        <ErrorBoundary dismissable>
                          <QueryLoanReturn
                            fields={state.fields}
                            queryResource={queryResource}
                            getQueryFieldRecords={getQueryFieldRecords}
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
                  isReadOnly={isReadOnly}
                  queryResource={queryResource}
                  fields={state.fields}
                  isValid={(): boolean =>
                    formRef.current?.reportValidity() ?? false
                  }
                  saveRequired={saveRequired}
                  unsetUnloadProtect={unsetUnloadProtect}
                  getQueryFieldRecords={getQueryFieldRecords}
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
          className={`gap-4 grid flex-1 overflow-y-auto grid-cols-1
            ${stickyScrolling ? 'snap-y snap-proximity' : ''}
            ${
              isEmbedded
                ? ''
                : state.queryRunCount === 0
                ? 'grid-rows-[100%]'
                : 'grid-rows-[100%_100%]'
            }
            ${isEmbedded ? '' : 'px-4 -mx-4'}
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
          <div className="snap-start flex flex-col gap-4">
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
                      ).includes(newMappingPath.slice(-1)[0])
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
                  className="justify-center p-2"
                  disabled={!mapButtonEnabled}
                  onClick={f.zero(handleAddField)}
                  aria-label={commonText('add')}
                  title={queryText('newButtonDescription')}
                >
                  {icons.plus}
                </Button.Small>
              )}
            </MappingView>
            <QueryFields
              baseTableName={state.baseTableName}
              fields={state.fields}
              enforceLengthLimit={triedToSave}
              openedElement={state.openedElement}
              showHiddenFields={showHiddenFields}
              getMappedFields={getMappedFieldsBind}
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
              onChangeField={
                isReadOnly
                  ? undefined
                  : (line, field): void =>
                      dispatch({ type: 'ChangeFieldAction', line, field })
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
              onOpenMap={setMapFieldIndex}
            />
            <div role="toolbar" className="flex flex-wrap gap-2">
              <Label.ForCheckbox>
                <Input.Checkbox
                  checked={showHiddenFields}
                  onValueChange={setShowHiddenFields}
                />
                {commonText('revealHiddenFormFields')}
              </Label.ForCheckbox>
              <span className="flex-1 -ml-2" />
              {hasPermission('/querybuilder/query', 'execute') && (
                <>
                  {/*
                   * Query Distinct for trees is disabled because of
                   * https://github.com/specify/specify7/pull/1019#issuecomment-973525594
                   */}
                  {!isTreeModel(model.name) && (
                    <Label.ForCheckbox>
                      <Input.Checkbox
                        disabled={!isEmpty}
                        checked={query.selectDistinct ?? false}
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
                  <Submit.Simple disabled={!isEmpty}>
                    {commonText('query')}
                  </Submit.Simple>
                </>
              )}
            </div>
          </div>
          {hasPermission('/querybuilder/query', 'execute') && (
            <QueryResultsWrapper
              baseTableName={state.baseTableName}
              model={model}
              queryResource={queryResource}
              fields={state.fields}
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
              createRecordSet={
                !isReadOnly &&
                hasPermission('/querybuilder/query', 'create_recordset') ? (
                  <MakeRecordSetButton
                    baseTableName={state.baseTableName}
                    fields={state.fields}
                    queryResource={queryResource}
                    getQueryFieldRecords={getQueryFieldRecords}
                  />
                ) : undefined
              }
              extraButtons={
                <QueryExportButtons
                  baseTableName={state.baseTableName}
                  fields={state.fields}
                  queryResource={queryResource}
                  getQueryFieldRecords={getQueryFieldRecords}
                />
              }
            />
          )}
        </div>
      </Form>
    </Container.Full>
  ) : null;
}
