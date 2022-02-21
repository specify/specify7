import React from 'react';

import type { RecordSet, SpQuery } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import queryText from '../localization/query';
import wbText from '../localization/workbench';
import { getInitialState, reducer } from '../querybuilderreducer';
import { mutateLineData, unParseQueryFields } from '../querybuilderutils';
import type { SpecifyModel } from '../specifymodel';
import { mappingPathToString } from '../wbplanviewmappinghelper';
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
} from './basic';
import { TableIcon } from './common';
import { useUnloadProtect } from './hooks';
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
 * TODO: test using sp7 queries in sp6 and vice versa
 * TODO: autorun query if opened without definition visible
 * TODO: update getMappingPathPreview to handle anyTreeRank and formattedEntry
 * TODO: don't allow mapping to any field for tree ranks
 * TODO: integrate sorting with column headers
 * TODO: handle trying to query with imcomplete fields
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
  const [showQueryDefinition = true, setShowQueryDefinition] = useCachedState({
    bucketName: 'queryBuilder',
    cacheName: 'showQueryDefinition',
    bucketType: 'localStorage',
    defaultValue: true,
  });

  // UnHide query definition if there are no fields
  React.useEffect(
    () =>
      !showQueryDefinition && state.fields.length === 0
        ? setShowQueryDefinition(true)
        : undefined,
    [showQueryDefinition, state.fields.length, setShowQueryDefinition]
  );

  React.useEffect(() => {
    queryResource.once('saverequired', () =>
      dispatch({ type: 'SaveRequiredAction' })
    );
  }, [queryResource]);

  const setHasUnloadProtect = useUnloadProtect(
    state.saveRequired,
    queryText('queryUnloadProtectDialogMessage')
  );

  const mapButtonEnabled = mappingPathIsComplete(state.mappingView);
  const handleAddField = (): void =>
    dispatch({
      type: 'ChangeFieldsAction',
      fields: [
        ...state.fields,
        {
          id: Math.max(-1, ...state.fields.map(({ id }) => id)) + 1,
          mappingPath: state.mappingView,
          sortType: undefined,
          filter: 'any',
          startValue: '',
          isNot: false,
          // If mapping path is not unique, don't display the field
          isDisplay: state.fields.every(
            ({ mappingPath }) =>
              mappingPathToString(mappingPath) !==
              mappingPathToString(state.mappingView)
          ),
        },
      ],
    });

  function runQuery(mode: 'regular' | 'distinct' | 'count'): void {
    if (state.fields.length === 0) return;
    setQuery({
      ...query,
      fields: unParseQueryFields(state.baseTableName, state.fields),
      selectDistinct: mode === 'distinct',
      countOnly: mode === 'count',
    });
    setTimeout(() => dispatch({ type: 'RunQuery' }), 0);
  }

  const getMappedFieldsBind = getMappedFields.bind(undefined, state.fields);

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
          <Button.Simple
            className={showQueryDefinition ? '' : 'active'}
            disabled={showQueryDefinition && state.fields.length === 0}
            onClick={(): void => {
              const newState = !showQueryDefinition;
              setShowQueryDefinition(newState);
              if (!newState) runQuery('regular');
            }}
            aria-pressed={!showQueryDefinition}
          >
            {showQueryDefinition
              ? queryText('hideDefinition')
              : queryText('editQuery')}
          </Button.Simple>
          <QueryExportButtons
            baseTableName={state.baseTableName}
            fields={state.fields}
            queryResource={queryResource}
          />
          {!readOnly && (
            <MakeRecordSetButton
              baseTableName={state.baseTableName}
              fields={state.fields}
              queryResource={queryResource}
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
            baseTableName={state.baseTableName}
            queryResource={queryResource}
            fields={state.fields}
            saveRequired={state.saveRequired}
            setHasUnloadProtect={setHasUnloadProtect}
          />
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="gap-y-4 flex flex-col">
            {showQueryDefinition && (
              <div className="gap-y-4 min-h-[50%] flex flex-col">
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
                      }),
                      state.mappingView
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
                      className="flex-col justify-center p-2"
                      disabled={!mapButtonEnabled}
                      onClick={handleAddField}
                      title={queryText('newButtonDescription')}
                    >
                      {commonText('add')}
                      <span
                        className={`text-green-500 ${
                          mapButtonEnabled ? '' : 'invisible'
                        }`}
                        aria-hidden="true"
                      >
                        &#8594;
                      </span>
                    </Button.Simple>
                  }
                />
              </div>
            )}
            <div role="toolbar" className="flex flex-wrap gap-2">
              {showQueryDefinition && (
                <LabelForCheckbox>
                  <Checkbox
                    checked={showHiddenFields}
                    onChange={({ target }): void =>
                      setShowHiddenFields(target.checked)
                    }
                  />
                  {wbText('revealHiddenFormFields')}
                </LabelForCheckbox>
              )}
              <span className="flex-1 -ml-2" />
              <Button.Simple
                disabled={state.fields.length === 0}
                onClick={(): void => runQuery('count')}
              >
                {queryText('countOnly')}
              </Button.Simple>
              <Button.Simple
                disabled={state.fields.length === 0}
                onClick={(): void => runQuery('distinct')}
              >
                {queryText('distinct')}
              </Button.Simple>
              <Submit.Simple disabled={state.fields.length === 0}>
                {commonText('query')}
              </Submit.Simple>
            </div>
            <QueryResultsWrapper
              baseTableName={state.baseTableName}
              model={model}
              queryResource={queryResource}
              fields={state.fields}
              queryRunCount={state.queryRunCount}
              recordSetId={recordSet?.id}
            />
          </div>
        </div>
      </Form>
    </ContainerFull>
  );
}
