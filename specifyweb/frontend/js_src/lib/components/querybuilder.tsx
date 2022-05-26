import React from 'react';

import type { RecordSet, SpQuery } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { replaceItem } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { queryText } from '../localization/query';
import { wbText } from '../localization/workbench';
import { hasPermission, hasToolPermission } from '../permissions';
import { getInitialState, reducer } from '../querybuilderreducer';
import {
  mutateLineData,
  smoothScroll,
  unParseQueryFields,
} from '../querybuilderutils';
import { schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { isTreeModel, treeRanksPromise } from '../treedefinitions';
import { defined } from '../types';
import { getMappingLineData } from '../wbplanviewnavigator';
import { getMappedFields, mappingPathIsComplete } from '../wbplanviewutils';
import { Button, Container, Form, H2, Input, Label, Submit } from './basic';
import { TableIcon } from './common';
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
import { QueryResultsWrapper } from './queryresultstable';
import { useResource } from './resource';
import { useCachedState } from './statecache';
import { getMappingLineProps } from './wbplanviewcomponents';
import { MappingView } from './wbplanviewmappercomponents';

export function QueryBuilder({
  query: queryResource,
  isReadOnly,
  recordSet,
  model,
  // If present, this callback is called when a query result is selected
  onSelected: handleSelected,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly isReadOnly: boolean;
  readonly model: SpecifyModel;
  readonly recordSet?: SpecifyResource<RecordSet>;
  readonly onSelected?: (resource: SpecifyResource<AnySchema>) => void;
}): JSX.Element | null {
  const [treeRanks] = useAsyncState(
    React.useCallback(async () => treeRanksPromise, []),
    true
  );

  const isEmbedded = typeof handleSelected === 'function';

  const [query, setQuery] = useResource(queryResource);
  const [originalQueryFields] = React.useState(query.fields ?? []);

  const [state, dispatch] = React.useReducer(
    reducer,
    {
      query,
      queryResource,
      model,
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

  const [showHiddenFields = false, setShowHiddenFields] = useCachedState({
    bucketName: 'queryBuilder',
    cacheName: 'showHiddenFields',
    defaultValue: false,
    staleWhileRefresh: false,
  });

  const saveRequired =
    (useIsModified(queryResource) || state.saveRequired) && !isEmbedded;

  const unsetUnloadProtect = useUnloadProtect(
    saveRequired,
    queryText('queryUnloadProtectDialogText')
  );

  const handleAddField = (): void =>
    dispatch({
      type: 'ChangeFieldsAction',
      fields: [
        ...state.fields,
        {
          id: Math.max(-1, ...state.fields.map(({ id }) => id)) + 1,
          mappingPath: state.mappingView,
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

  const getQueryFieldRecords = (
    fields: typeof state.fields = state.fields
  ): ReturnType<typeof unParseQueryFields> =>
    unParseQueryFields(state.baseTableName, fields, originalQueryFields);

  function runQuery(
    mode: 'regular' | 'count',
    fields: typeof state.fields = state.fields
  ): void {
    if (!isEmpty || !hasPermission('/querybuilder/query', 'execute')) return;
    setQuery({
      ...query,
      fields: getQueryFieldRecords(fields),
      countOnly: mode === 'count',
    });
    setTimeout(() => dispatch({ type: 'RunQueryAction' }), 0);
  }

  const getMappedFieldsBind = getMappedFields.bind(undefined, state.fields);
  const mapButtonEnabled =
    !isReadOnly &&
    mappingPathIsComplete(state.mappingView) &&
    !getMappedFieldsBind(state.mappingView.slice(0, -1)).includes(
      state.mappingView.slice(-1)[0]
    );

  // Scroll down to query results when pressed the "Query" button
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (state.queryRunCount !== 0 && containerRef.current !== null)
      smoothScroll(containerRef.current, containerRef.current.scrollHeight);
  }, [state.queryRunCount]);

  useTitle(query.name);

  const formRef = React.useRef<HTMLFormElement | null>(null);

  const [stickyScrolling] = usePref(
    'queryBuilder',
    'behavior',
    'stickyScrolling'
  );

  return typeof treeRanks === 'object' ? (
    <Container.Full
      onClick={
        typeof state.openedElement.index === 'undefined'
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
      <Form
        className="contents"
        forwardRef={formRef}
        onSubmit={(): void => runQuery('regular')}
      >
        {!isEmbedded && (
          <header className="gap-x-2 whitespace-nowrap flex items-center">
            <TableIcon name={model.name} />
            <H2 className="overflow-x-auto">
              {typeof recordSet === 'object'
                ? queryText(
                    'queryRecordSetTitle',
                    query.name,
                    recordSet.get('name')
                  )
                : queryText('queryTaskTitle', query.name)}
            </H2>
            <span className="flex-1 ml-2" />
            {state.baseTableName === 'LoanPreparation' && (
              <ProtectedAction resource="/querybuilder/query" action="execute">
                <ProtectedTable tableName="Loan" action="update">
                  <ProtectedTable
                    tableName="LoanReturnPreparation"
                    action="create"
                  >
                    <ProtectedTable tableName="LoanPreparation" action="read">
                      <QueryLoanReturn
                        fields={state.fields}
                        queryResource={queryResource}
                        getQueryFieldRecords={getQueryFieldRecords}
                      />
                    </ProtectedTable>
                  </ProtectedTable>
                </ProtectedTable>
              </ProtectedAction>
            )}
            {hasToolPermission(
              'queryBuilder',
              queryResource.isNew() ? 'create' : 'update'
            ) && (
              <>
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
              </>
            )}
          </header>
        )}
        <div
          className={`gap-y-4 grid flex-1 overflow-y-auto grid-cols-1
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
          ref={containerRef}
        >
          <div className="gap-y-4 snap-start flex flex-col">
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
                  else
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
                  onClick={handleAddField}
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
              openedElement={state.openedElement}
              showHiddenFields={showHiddenFields}
              getMappedFields={getMappedFieldsBind}
            />
            <div role="toolbar" className="flex flex-wrap gap-2">
              <Label.ForCheckbox>
                <Input.Checkbox
                  checked={showHiddenFields}
                  onValueChange={setShowHiddenFields}
                />
                {wbText('revealHiddenFormFields')}
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
              extraButtons={
                <QueryExportButtons
                  baseTableName={state.baseTableName}
                  fields={state.fields}
                  queryResource={queryResource}
                  getQueryFieldRecords={getQueryFieldRecords}
                />
              }
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
            />
          )}
        </div>
      </Form>
    </Container.Full>
  ) : null;
}
