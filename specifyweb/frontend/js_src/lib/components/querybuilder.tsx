import React from 'react';

import type { RecordSet, SpQuery } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import queryText from '../localization/query';
import wbText from '../localization/workbench';
import { reducer } from '../querybuilderreducer';
import { mutateLineData, parseQueryFields } from '../querybuilderutils';
import { schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { toLowerCase } from '../wbplanviewhelper';
import { mappingPathToString } from '../wbplanviewmappinghelper';
import { getMappingLineData } from '../wbplanviewnavigator';
import { mappingPathIsComplete } from '../wbplanviewutils';
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
import { useResource, useUnloadProtect } from './hooks';
import {
  MakeRecordSetButton,
  QueryExportButtons,
  SaveQueryButtons,
} from './querybuildercomponents';
import { QueryFields } from './querybuilderfields';
import { useCachedState } from './stateCache';
import { getMappingLineProps } from './wbplanviewcomponents';
import { MappingView } from './wbplanviewmappercomponents';

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

  const [state, dispatch] = React.useReducer(reducer, {
    type: 'MainState',
    // TODO: add default values for resources
    fields: parseQueryFields(query.fields ?? []),
    mappingView: ['0'],
    openedElement: { line: 1, index: undefined },
    saveRequired: queryResource.isNew(),
    baseTableName: toLowerCase(model.name),
  });

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

  React.useEffect(() => {
    queryResource.on('saverequired', () =>
      dispatch({ type: 'SaveRequiredAction' })
    );
  }, [queryResource]);

  const setHasUnloadProtect = useUnloadProtect(
    state.saveRequired,
    queryText('queryUnloadProtectDialogMessage')
  );

  const handleChange = (payload: {
    readonly line: 'mappingView' | number;
    readonly index: number;
    readonly close: boolean;
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly parentTableName: string;
    readonly currentTableName: string;
    readonly newTableName: string;
  }): void =>
    dispatch({
      type: 'ChangeSelectElementValueAction',
      ...payload,
    });

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
          endValue: '',
          details: { type: 'regularField' },
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
  return (
    <ContainerFull>
      <Form className="contents">
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
            onClick={(): void => setShowQueryDefinition(!showQueryDefinition)}
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
                    handleChange({ line, ...payload })
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
                />
                <MappingView
                  // TODO: display date part choose in mapping view
                  mappingElementProps={getMappingLineProps({
                    mappingLineData: mutateLineData(
                      getMappingLineData({
                        baseTableName: state.baseTableName,
                        mappingPath: state.mappingView,
                        iterate: true,
                        showHiddenFields,
                        generateFieldData: 'all',
                      }),
                      state.mappingView
                    ),
                    customSelectType: 'OPENED_LIST',
                    onChange({ isDoubleClick, ...rest }) {
                      if (isDoubleClick && mapButtonEnabled) handleAddField();
                      else handleChange({ line: 'mappingView', ...rest });
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
              <LabelForCheckbox>
                <Checkbox
                  // TODO: replace checkbox with a button
                  checked={query.countOnly ?? false}
                  onChange={({ target }): void =>
                    setQuery({
                      ...query,
                      countOnly: target.checked,
                    })
                  }
                />
                {queryText('countOnly')}
              </LabelForCheckbox>
              <LabelForCheckbox>
                <Checkbox
                  // TODO: replace checkbox with a button
                  checked={query.selectDistinct ?? false}
                  onChange={({ target }): void =>
                    setQuery({
                      ...query,
                      selectDistinct: target.checked,
                    })
                  }
                />
                {queryText('distinct')}
              </LabelForCheckbox>
              {query.contextTableId === schema.models.SpAuditLog.tableId ? (
                <LabelForCheckbox>
                  <Checkbox
                    checked={query.formatAuditRecIds ?? false}
                    onChange={({ target }): void =>
                      setQuery({
                        ...query,
                        formatAuditRecIds: target.checked,
                      })
                    }
                  />
                  {queryText('format')}
                </LabelForCheckbox>
              ) : undefined}
              <Submit.Simple>{commonText('query')}</Submit.Simple>
            </div>
            <div className="bg-red-800" style={{ height: '1000px' }} />
          </div>
        </div>
      </Form>
    </ContainerFull>
  );
}
