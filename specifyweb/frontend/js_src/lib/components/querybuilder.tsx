import React from 'react';

import type { RecordSet, SpQuery } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import queryText from '../localization/query';
import wbText from '../localization/workbench';
import { getInitialState, reducer } from '../querybuilderreducer';
import { mutateLineData, unParseQueryFields } from '../querybuilderutils';
import type { SpecifyModel } from '../specifymodel';
import { isTreeModel } from '../treedefinitions';
import { getMappingLineData } from '../wbplanviewnavigator';
import { getMappedFields, mappingPathIsComplete } from '../wbplanviewutils';
import {
  Button,
  Checkbox,
  ContainerFull,
  Form,
  H2,
  LabelForCheckbox,
  Submit,
  transitionDuration,
} from './basic';
import { TableIcon } from './common';
import { useTitle, useUnloadProtect } from './hooks';
import { icons } from './icons';
import {
  MakeRecordSetButton,
  QueryExportButtons,
  SaveQueryButtons,
} from './querybuildercomponents';
import { QueryFields } from './querybuilderfields';
import { QueryResultsWrapper } from './queryresultstable';
import { useResource } from './resource';
import { useCachedState } from './stateCache';
import { getMappingLineProps } from './wbplanviewcomponents';
import { MappingView } from './wbplanviewmappercomponents';

/*
 * Query Results:
 * TODO: query results editing & deleting & view in new tab
 * TODO: creating record set out of a subset of results
 * TODO: make query scrollable even while viewing the resutls
 * To Test:
 * TODO: test "any" filters in sp6 and sp7
 * TODO: test query reports
 * TODO: test using sp7 queries in sp6 and vice versa
 */

export function QueryBuilder({
  query: queryResource,
  readOnly,
  recordSet,
  model,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly readOnly: boolean;
  readonly model: SpecifyModel;
  readonly recordSet?: SpecifyResource<RecordSet>;
}): JSX.Element {
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

  const [showHiddenFields = false, setShowHiddenFields] = useCachedState({
    bucketName: 'queryBuilder',
    cacheName: 'showHiddenFields',
    bucketType: 'localStorage',
    defaultValue: false,
  });

  React.useEffect(() => {
    queryResource.once('saverequired', () =>
      dispatch({ type: 'SaveRequiredAction' })
    );
  }, [queryResource]);

  const setHasUnloadProtect = useUnloadProtect(
    state.saveRequired,
    queryText('queryUnloadProtectDialogMessage')
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
    if (!isEmpty) return;
    setQuery({
      ...query,
      fields: getQueryFieldRecords(fields),
      countOnly: mode === 'count',
    });
    setTimeout(() => dispatch({ type: 'RunQueryAction' }), 0);
  }

  const getMappedFieldsBind = getMappedFields.bind(undefined, state.fields);
  const mapButtonEnabled =
    mappingPathIsComplete(state.mappingView) &&
    !getMappedFieldsBind(state.mappingView.slice(0, -1)).includes(
      state.mappingView.slice(-1)[0]
    );

  // Scroll down to query results when pressed the "Query" button
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (state.queryRunCount !== 0 && containerRef.current !== null)
      (containerRef.current as HTMLElement).scrollTo({
        top: containerRef.current.clientHeight,
        behavior: transitionDuration === 0 ? 'auto' : 'smooth',
      });
  }, [state.queryRunCount]);

  useTitle(query.name);

  return (
    <ContainerFull
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
        onSubmit={(event): void => {
          event.preventDefault();
          runQuery('regular');
        }}
      >
        <header className="gap-x-2 whitespace-nowrap flex items-center">
          <TableIcon tableName={model.name} />
          <H2 className="overflow-x-auto">
            {typeof recordSet === 'object'
              ? queryText('queryRecordSetTitle')(
                  query.name,
                  recordSet.get('name')
                )
              : queryText('queryTaskTitle')(query.name)}
          </H2>
          <span className="flex-1 ml-2" />
          <QueryExportButtons
            baseTableName={state.baseTableName}
            fields={state.fields}
            queryResource={queryResource}
            getQueryFieldRecords={getQueryFieldRecords}
          />
          {!readOnly && (
            <MakeRecordSetButton
              baseTableName={state.baseTableName}
              fields={state.fields}
              queryResource={queryResource}
              getQueryFieldRecords={getQueryFieldRecords}
            />
          )}
          {!queryResource.isNew() && (
            <Button.Simple
              disabled={!state.saveRequired}
              onClick={(): void =>
                setHasUnloadProtect(false, () => window.location.reload())
              }
            >
              {queryText('abandonChanges')}
            </Button.Simple>
          )}
          <SaveQueryButtons
            readOnly={readOnly}
            queryResource={queryResource}
            fields={state.fields}
            saveRequired={state.saveRequired}
            setHasUnloadProtect={setHasUnloadProtect}
            getQueryFieldRecords={getQueryFieldRecords}
          />
        </header>
        <div
          className={`gap-y-4 grid flex-1 overflow-y-auto px-4 -mx-4 grid-cols-1
            ${
              state.queryRunCount === 0
                ? 'grid-rows-[100%]'
                : 'grid-rows-[100%_100%]'
            }
          `}
          ref={containerRef}
        >
          <div className="gap-y-4 flex flex-col">
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
              mapButton={
                <Button.Simple
                  className="justify-center p-2"
                  disabled={!mapButtonEnabled}
                  onClick={handleAddField}
                  aria-label={commonText('add')}
                  title={queryText('newButtonDescription')}
                >
                  {icons.plus}
                </Button.Simple>
              }
            />
            <QueryFields
              baseTableName={state.baseTableName}
              fields={state.fields}
              onRemoveField={(line): void =>
                dispatch({
                  type: 'ChangeFieldsAction',
                  fields: state.fields.filter((_, index) => index !== line),
                })
              }
              onChangeField={(line, field): void =>
                dispatch({ type: 'ChangeFieldAction', line, field })
              }
              onMappingChange={(line, payload): void =>
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
              onLineFocus={(line): void =>
                state.openedElement.line === line
                  ? undefined
                  : dispatch({
                      type: 'FocusLineAction',
                      line,
                    })
              }
              onLineMove={(line, direction): void =>
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
              <LabelForCheckbox>
                <Checkbox
                  checked={showHiddenFields}
                  onChange={({ target }): void =>
                    setShowHiddenFields(target.checked)
                  }
                />
                {wbText('revealHiddenFormFields')}
              </LabelForCheckbox>
              <span className="flex-1 -ml-2" />
              {/*
               * Query Distinct for trees is disabled because of
               * https://github.com/specify/specify7/pull/1019#issuecomment-973525594
               */}
              {!isTreeModel(model.name) && (
                <LabelForCheckbox>
                  <Checkbox
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
                </LabelForCheckbox>
              )}
              <Button.Simple
                disabled={!isEmpty}
                onClick={(): void => runQuery('count')}
              >
                {queryText('countOnly')}
              </Button.Simple>
              <Submit.Simple disabled={!isEmpty}>
                {commonText('query')}
              </Submit.Simple>
            </div>
          </div>
          <QueryResultsWrapper
            baseTableName={state.baseTableName}
            model={model}
            queryResource={queryResource}
            fields={state.fields}
            queryRunCount={state.queryRunCount}
            recordSetId={recordSet?.id}
            onSortChange={(index, sortType): void => {
              dispatch({
                type: 'ChangeFieldAction',
                line: index,
                field: { ...state.fields[index], sortType },
              });
              runQuery('regular', [
                ...state.fields.slice(0, index),
                { ...state.fields[index], sortType },
                ...state.fields.slice(index + 1),
              ]);
            }}
          />
        </div>
      </Form>
    </ContainerFull>
  );
}
