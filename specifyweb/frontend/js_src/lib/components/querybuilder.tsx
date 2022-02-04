import React from 'react';

import type { RecordSet, SpQuery } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import queryText from '../localization/query';
import wbText from '../localization/workbench';
import * as navigation from '../navigation';
import { reducer } from '../querybuilderreducer';
import { parseQueryFields } from '../querybuilderutils';
import schema from '../schemabase';
import type { SpecifyModel } from '../specifymodel';
import { toLowerCase } from '../wbplanviewhelper';
import { mappingPathIsComplete } from '../wbplanviewutils';
import {
  Button,
  Checkbox,
  ContainerFull,
  H2,
  LabelForCheckbox,
  Submit,
} from './basic';
import { TableIcon } from './common';
import { useId, useResource } from './hooks';
import { icons } from './icons';
import {
  MakeRecordSetButton,
  QueryExportButtons,
  SaveQueryButtons,
} from './querybuildercomponents';
import { QueryFields } from './querybuilderfields';
import { useCachedState } from './stateCache';
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
  });

  const [showHiddenFields = false, setShowHiddenFields] = useCachedState({
    bucketName: 'queryBuilder',
    cacheName: 'showHiddenFields',
    bucketType: 'localStorage',
    defaultValue: false,
  });
  const [showMappingView = true, setShowMappingView] = useCachedState({
    bucketName: 'queryBuilder',
    cacheName: 'showMappingView',
    bucketType: 'localStorage',
    defaultValue: false,
  });

  React.useEffect(() => {
    queryResource.on('saverequired', () =>
      dispatch({ type: 'SaveRequiredAction' })
    );
  }, [queryResource]);

  const id = useId('query-builder');
  const removeUnloadProtect = (): void =>
    navigation.removeUnloadProtect(id('unload-protect'));
  React.useEffect(() => {
    navigation.addUnloadProtect(
      id('unload-protect'),
      queryText('queryUnloadProtectDialogMessage')
    );
    return removeUnloadProtect;
  }, [id, state.saveRequired]);

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

  return (
    <ContainerFull>
      <form className="contents">
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
            className={showMappingView ? '' : 'active'}
            onClick={(): void => setShowMappingView(!showMappingView)}
            aria-pressed={!showMappingView}
          >
            {showMappingView
              ? wbText('hideMappingEditor')
              : wbText('showMappingEditor')}
          </Button.Simple>
          <QueryExportButtons
            baseTableName={toLowerCase(model.name)}
            fields={state.fields}
            queryResource={queryResource}
          />
          {!readOnly && (
            <MakeRecordSetButton
              baseTableName={toLowerCase(model.name)}
              fields={state.fields}
              queryResource={queryResource}
            />
          )}
          {!queryResource.isNew() && (
            <Button.Simple
              disabled={!state.saveRequired}
              onClick={(): void => {
                removeUnloadProtect();
                window.location.reload();
              }}
            >
              {queryText('abandonChanges')}
            </Button.Simple>
          )}
          <SaveQueryButtons
            readOnly={readOnly}
            baseTableName={toLowerCase(model.name)}
            queryResource={queryResource}
            fields={state.fields}
            saveRequired={state.saveRequired}
            removeUnloadProtect={removeUnloadProtect}
          />
        </header>
        {showMappingView && (
          <MappingView
            baseTableName={toLowerCase(model.name)}
            focusedLineExists={state.fields.length > 0}
            mappingPath={state.mappingView}
            hideToMany={true}
            showHiddenFields={showHiddenFields}
            mapButtonIsEnabled={
              typeof state.openedElement !== 'undefined' &&
              mappingPathIsComplete(state.mappingView)
            }
            readonly={false}
            mustMatchPreferences={{}}
            handleMapButtonClick={(): void =>
              dispatch({ type: 'MappingViewMapAction' })
            }
            handleMappingViewChange={(payload): void =>
              handleChange({ line: 'mappingView', ...payload })
            }
          />
        )}
        <QueryFields
          baseTableName={toLowerCase(model.name)}
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
                  type: 'ChangeOpenedElementAction',
                  line,
                  index: undefined,
                })
          }
          openedElement={state.openedElement}
          showHiddenFields={showHiddenFields}
        />
        <div role="toolbar" className="flex flex-wrap gap-2">
          <Button.Simple
            title={queryText('newButtonDescription')}
            aria-label={commonText('new')}
            onClick={(): void =>
              dispatch({
                type: 'ChangeFieldsAction',
                fields: [
                  ...state.fields,
                  {
                    id: Math.max(-1, ...state.fields.map(({ id }) => id)) + 1,
                    mappingPath: ['0'],
                    sortType: undefined,
                    filter: 'any',
                    startValue: '',
                    endValue: '',
                    details: undefined,
                    isNot: false,
                    isDisplay: true,
                  },
                ],
              })
            }
          >
            {icons.plus}
          </Button.Simple>
          <LabelForCheckbox>
            <Checkbox
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
          <LabelForCheckbox>
            <Checkbox
              checked={showHiddenFields}
              onChange={({ target }): void =>
                setShowHiddenFields(target.checked)
              }
            />
            {wbText('revealHiddenFormFields')}
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
          <span className="flex-1 -ml-2" />
          <Submit.Simple>{commonText('query')}</Submit.Simple>
        </div>
      </form>
    </ContainerFull>
  );
}
