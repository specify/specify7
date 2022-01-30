import React from 'react';
import type { Action, State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import { ping } from '../ajax';
import type { RecordSet, SpQuery, SpQueryField, Tables } from '../datamodel';
import type { SerializedModel, SerializedResource } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import queryText from '../localization/query';
import wbText from '../localization/workbench';
import * as navigation from '../navigation';
import NotFoundView from '../notfoundview';
import QueryFieldSpec, { DatePart } from '../queryfieldspec';
import queryFromTree from '../queryfromtree';
import * as querystring from '../querystring';
import router from '../router';
import { getModel } from '../schema';
import schema from '../schemabase';
import * as app from '../specifyapp';
import { setCurrentView } from '../specifyapp';
import type { default as SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { defined } from '../types';
import { getParser } from '../uiparse';
import userInfo from '../userinfo';
import { sortFunction, toLowerCase } from '../wbplanviewhelper';
import { generateMappingPathPreview } from '../wbplanviewmappingpreview';
import dataModelStorage from '../wbplanviewmodel';
import { dataModelPromise } from '../wbplanviewmodelfetcher';
import { getMappingLineData } from '../wbplanviewnavigator';
import { mappingPathIsComplete, mutateMappingPath } from '../wbplanviewutils';
import {
  Button,
  Checkbox,
  className,
  ContainerFull,
  H2,
  LabelForCheckbox,
  Submit,
  Ul,
} from './basic';
import { TableIcon } from './common';
import { EditResourceDialog } from './editresourcedialog';
import { useId, useResource } from './hooks';
import icons from './icons';
import { dateParts } from './internationalization';
import { Dialog, loadingBar, LoadingScreen } from './modaldialog';
import { QuerySaveDialog } from './querysavedialog';
import createBackboneView from './reactbackboneextend';
import { useCachedState } from './stateCache';
import {
  ButtonWithConfirmation,
  MappingPathComponent,
} from './wbplanviewcomponents';
import type { MappingPath } from './wbplanviewmapper';
import { MappingView } from './wbplanviewmappercomponents';
import { crash } from './errorboundary';

function QueryLine({
  baseTableName,
  field,
  forReport = false,
  onChange: handleChange,
  onRemove: handleRemove,
  onOpen: handleOpen,
  onClose: handleClose,
  onLineFocus: handleLineFocus,
  isFocused,
  openedElement,
  showHiddenFields,
}: {
  readonly baseTableName: Lowercase<keyof Tables>;
  readonly field: QueryField;
  readonly forReport?: boolean;
  readonly onChange: (newField: QueryField) => void;
  readonly onRemove: () => void;
  readonly onOpen: (index: number) => void;
  readonly onClose: () => void;
  readonly onLineFocus: (target: 'previous' | 'current' | 'next') => void;
  readonly isFocused: boolean;
  readonly openedElement: number | undefined;
  readonly showHiddenFields: boolean;
}): JSX.Element {
  const lineRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (isFocused && lineRef.current?.contains(document.activeElement) !== true)
      lineRef.current?.focus();
  }, [isFocused]);

  const lineData = getMappingLineData({
    baseTableName,
    mappingPath: field.mappingPath,
    generateLastRelationshipData: true,
    iterate: true,
    customSelectType: 'CLOSED_LIST',
    handleChange: (payload): void =>
      handleChange({
        ...field,
        mappingPath: mutateMappingPath({
          lines: [],
          mappingView: field.mappingPath,
          line: 'mappingView',
          index: payload.index,
          newValue: payload.newValue,
          isRelationship: payload.isRelationship,
          currentTableName: payload.currentTableName,
          newTableName: payload.newTableName,
        }),
      }),
    handleOpen,
    // TODO: detect outside click
    handleClose,
    openSelectElement: openedElement,
    showHiddenFields,
  });

  return (
    <li
      className="border-t-gray-500 gap-x-2 flex py-2 border-t"
      aria-current={isFocused}
    >
      <Button.Simple
        className={`${className.redButton} print:hidden`}
        title={commonText('remove')}
        aria-label={commonText('remove')}
        onClick={handleRemove}
      >
        {icons.trash}
      </Button.Simple>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className={`flex-1 print:gap-1 flex flex-wrap items-center gap-2 ${
          isFocused ? 'bg-gray-300 dark:bg-neutral-700' : ''
        }`}
        role="list"
        /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
        tabIndex={0}
        onClick={(): void => handleLineFocus('current')}
        // TODO: deduplicate this logic here and in mapping view
        onKeyDown={({ key }): void => {
          if (typeof openedElement === 'number') {
            if (key === 'ArrowLeft')
              if (openedElement > 0) handleOpen(openedElement - 1);
              else handleClose();
            else if (key === 'ArrowRight')
              if (openedElement + 1 < lineData.length)
                handleOpen(openedElement + 1);
              else handleClose();

            return;
          }

          if (key === 'ArrowLeft') handleOpen(lineData.length - 1);
          else if (key === 'ArrowRight' || key === 'Enter') handleOpen(0);
          else if (key === 'ArrowUp') handleLineFocus('previous');
          else if (key === 'ArrowDown') handleLineFocus('next');
        }}
        ref={lineRef}
      >
        <MappingPathComponent mappingLineData={lineData} />
      </div>
      <div className="contents print:hidden">
        <Button.Simple
          title={queryText('negate')}
          aria-label={queryText('negate')}
          className={`
        aria-handled
        op-negate
        field-state-hide
        operation-state-show
        datepart-state-hide
      `}
          aria-pressed={false}
        >
          {icons.ban}
        </Button.Simple>
        <Button.Simple
          title={queryText('showButtonDescription')}
          aria-label={queryText('showButtonDescription')}
          aria-pressed={false}
          className="field-show button aria-handled"
        >
          {icons.check}
        </Button.Simple>
        <Button.Simple title={queryText('sort')} aria-label={queryText('sort')}>
          {icons.stop}
        </Button.Simple>
        <Button.Simple
          title={queryText('moveUp')}
          aria-label={queryText('moveUp')}
        >
          {icons.chevronUp}
        </Button.Simple>
        <Button.Simple
          title={queryText('moveDown')}
          aria-label={queryText('moveDown')}
        >
          {icons.chevronDown}
        </Button.Simple>
      </div>
    </li>
  );
}

function QueryFields({
  baseTableName,
  fields,
  onChangeField: handleChangeField,
  onRemoveField: handleRemoveField,
  onOpen: handleOpen,
  onClose: handleClose,
  onLineFocus: handleLineFocus,
  openedElement,
  showHiddenFields,
}: {
  readonly baseTableName: Lowercase<keyof Tables>;
  readonly fields: RA<QueryField>;
  readonly onChangeField: (line: number, field: QueryField) => void;
  readonly onRemoveField: (line: number) => void;
  readonly onOpen: (line: number, index: number) => void;
  readonly onClose: () => void;
  readonly onLineFocus: (line: number) => void;
  readonly openedElement?: {
    readonly line: number;
    readonly index?: number;
  };
  readonly showHiddenFields: boolean;
}): JSX.Element {
  return (
    <Ul className="spqueryfields">
      {fields.map((field, line) => (
        <QueryLine
          key={field.id}
          baseTableName={baseTableName}
          field={field}
          forReport={false}
          onChange={(newField): void => handleChangeField(line, newField)}
          onRemove={(): void => handleRemoveField(line)}
          onOpen={handleOpen.bind(undefined, line)}
          onClose={handleClose}
          onLineFocus={(target): void =>
            handleLineFocus(
              // TODO: check against out of bounds
              target === 'previous'
                ? line - 1
                : target === 'current'
                ? line
                : line + 1
            )
          }
          showHiddenFields={showHiddenFields}
          isFocused={openedElement?.line === line}
          openedElement={openedElement?.index}
        />
      ))}
    </Ul>
  );
}

type DateField = {
  type: 'dateField';
  datePart: DatePart;
};

// TODO: find a better icon for sortType=undefined
const sortTypes = [undefined, 'ascending', 'descending'];

export type QueryField = {
  // Used as a React [key] prop only in order to optimize rendering
  readonly id: number;
  readonly mappingPath: MappingPath;
  readonly sortType: typeof sortTypes[number];
  // TODO: replace with "keyof"
  readonly filter: string;
  readonly startValue: string;
  readonly endValue: string;
  readonly details: DateField | undefined;
  readonly isNot: boolean;
  readonly isDisplay: boolean;
};

function parseQueryFields(
  queryFields: RA<SerializedResource<SpQueryField>>
): RA<QueryField> {
  return Array.from(queryFields)
    .sort(sortFunction(({ position }) => position))
    .map(({ id, isNot, isDisplay, ...field }) => {
      const fieldSpec = QueryFieldSpec.fromStringId(
        field.stringId,
        field.isRelFld ?? false
      );
      const parser = getParser(defined(fieldSpec.getField())) ?? {};

      return {
        id,
        mappingPath: fieldSpec.joinPath.map(({ name }) => name),
        sortType: sortTypes[field.sortType],
        filter: 'any',
        startValue: field.startValue ?? '',
        endValue: field.endValue ?? '',
        details:
          parser.type === 'date'
            ? {
                type: 'dateField',
                datePart: fieldSpec.datePart ?? 'fullDate',
              }
            : undefined,
        isNot,
        isDisplay,
      };
    });
}

const unParseQueryFields = (
  baseTableName: Lowercase<keyof Tables>,
  fields: RA<QueryField>
): RA<Partial<SerializedModel<SpQueryField>>> =>
  fields
    .filter(({ mappingPath }) => mappingPathIsComplete(mappingPath))
    .map((field, index) => {
      const fieldSpec = QueryFieldSpec.fromPath([
        baseTableName,
        ...field.mappingPath,
      ]);

      return {
        ...fieldSpec.toSpQueryAttributes(),
        sorttype: sortTypes.indexOf(field.sortType),
        position: index,
        startvalue: field.startValue,
        endvalue: field.endValue,
      };
    });

type MainState = State<
  'MainState',
  {
    readonly fields: RA<QueryField>;
    readonly mappingView: MappingPath;
    readonly openedElement: {
      readonly line: number;
      readonly index: number | undefined;
    };
    readonly saveRequired: boolean;
  }
>;
type ChangeOpenedElementAction = Action<
  'ChangeOpenedElementAction',
  {
    readonly line: number;
    readonly index: number | undefined;
  }
>;
type SaveRequiredAction = Action<'SaveRequiredAction'>;
type ChangeFieldsAction = Action<
  'ChangeFieldsAction',
  {
    readonly fields: RA<QueryField>;
  }
>;
type ChangeFieldAction = Action<
  'ChangeFieldAction',
  {
    readonly line: number;
    readonly field: QueryField;
  }
>;
type ChangeSelectElementValueAction = Action<
  'ChangeSelectElementValueAction',
  {
    readonly line: number | 'mappingView';
    readonly index: number;
    readonly close: boolean;
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly newTableName: string;
    readonly currentTableName: string;
  }
>;
type MappingViewMapAction = Action<'MappingViewMapAction'>;
type Actions =
  | ChangeOpenedElementAction
  | SaveRequiredAction
  | ChangeFieldsAction
  | ChangeFieldAction
  | ChangeSelectElementValueAction
  | MappingViewMapAction;
const reducer = generateReducer<MainState, Actions>({
  ChangeOpenedElementAction: ({ action, state }) => ({
    ...state,
    openedElement: {
      line: action.line,
      index: action.index,
    },
  }),
  SaveRequiredAction: ({ state }) => ({
    ...state,
    saveRequired: true,
  }),
  ChangeFieldsAction: ({ action, state }) => ({
    ...state,
    fields: action.fields,
    saveRequired: true,
  }),
  ChangeFieldAction: ({ action, state }) => ({
    ...state,
    fields: [
      ...state.fields.slice(0, action.line),
      action.field,
      ...state.fields.slice(action.line + 1),
    ],
    saveRequired: true,
  }),
  ChangeSelectElementValueAction: ({ state, action }) => {
    const newMappingPath = mutateMappingPath({
      lines: [],
      mappingView:
        action.line === 'mappingView'
          ? state.mappingView
          : state.fields[action.line].mappingPath,
      line: 'mappingView',
      index: action.index,
      newValue: action.newValue,
      isRelationship: action.isRelationship,
      currentTableName: action.currentTableName,
      newTableName: action.newTableName,
    });

    if (action.line === 'mappingView')
      return {
        ...state,
        mappingView: newMappingPath,
      };

    return {
      ...state,
      fields: [
        ...state.fields.slice(0, action.line),
        {
          ...state.fields[action.line],
          mappingPath: newMappingPath,
        },
        ...state.fields.slice(action.line + 1),
      ],
      openedElement: {
        line: state.openedElement.line,
        index: action.close ? undefined : state.openedElement.index,
      },
      autoMapperSuggestions: undefined,
      saveRequired: true,
      mappingsAreValidated: false,
    };
  },
  MappingViewMapAction: ({ state }) => {
    const mappingViewPath = state.mappingView;
    const focusedLine = state.openedElement.line;
    if (
      !mappingPathIsComplete(mappingViewPath) ||
      typeof focusedLine === 'undefined' ||
      focusedLine >= state.fields.length
    )
      return state;

    return {
      ...state,
      fields: [
        ...state.fields.slice(0, focusedLine),
        {
          ...state.fields[focusedLine],
          mappingPath: mappingViewPath,
        },
        ...state.fields.slice(focusedLine + 1),
      ],
      changesMade: true,
      mappingsAreValidated: false,
    };
  },
});

function QueryButton({
  disabled,
  children,
  onClick: handleClick,
  showConfirmation,
}: {
  readonly disabled: boolean;
  readonly children: string;
  readonly onClick: () => void;
  readonly showConfirmation: () => boolean;
}): JSX.Element {
  return (
    <ButtonWithConfirmation
      dialogTitle={queryText('queryDeleteIncompleteDialogTitle')}
      dialogHeader={queryText('queryDeleteIncompleteDialogHeader')}
      dialogMessage={queryText('queryDeleteIncompleteDialogMessage')}
      dialogButtons={(confirm) => (
        <>
          <Button.Orange onClick={confirm}>
            {commonText('remove')}
          </Button.Orange>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
        </>
      )}
      showConfirmation={showConfirmation}
      onConfirm={handleClick}
      disabled={disabled}
    >
      {children}
    </ButtonWithConfirmation>
  );
}

function SaveQueryButtons({
  readOnly,
  baseTableName,
  fields,
  saveRequired,
  queryResource,
  removeUnloadProtect,
}: {
  readonly readOnly: boolean;
  readonly baseTableName: Lowercase<keyof Tables>;
  readonly fields: RA<QueryField>;
  readonly saveRequired: boolean;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly removeUnloadProtect: () => void;
}): JSX.Element {
  const [showDialog, setShowDialog] = React.useState<false | 'save' | 'saveAs'>(
    false
  );
  const showConfirmation = (): boolean =>
    fields.some(({ mappingPath }) => !mappingPathIsComplete(mappingPath));

  const handleSave = (newState: typeof showDialog): void =>
    setShowDialog((oldState) => {
      if (
        (newState === 'save' || newState === 'saveAs') &&
        oldState === false
      ) {
        removeUnloadProtect();
        queryResource.set('fields', unParseQueryFields(baseTableName, fields));
      }
      return newState;
    });

  return (
    <>
      {typeof showDialog === 'string' && (
        <QuerySaveDialog
          isSaveAs={showDialog === 'saveAs'}
          onClose={(): void => setShowDialog(false)}
          onSaved={(queryId: number): void => {
            removeUnloadProtect();
            navigation.go(`/specify/query/${queryId}/`);
          }}
          query={queryResource}
        />
      )}
      {readOnly ||
      queryResource.get('specifyUser') !== userInfo.resource_uri ? undefined : (
        <QueryButton
          disabled={!saveRequired || fields.length === 0}
          onClick={(): void => handleSave('save')}
          showConfirmation={showConfirmation}
        >
          {commonText('save')}
        </QueryButton>
      )}
      {readOnly || queryResource.isNew() ? undefined : (
        <QueryButton
          disabled={fields.length === 0}
          onClick={(): void => handleSave('saveAs')}
          showConfirmation={showConfirmation}
        >
          {queryText('saveAs')}
        </QueryButton>
      )}
    </>
  );
}

function hasLocalityColumns(fields: RA<QueryField>): boolean {
  const fieldNames = new Set(
    fields
      .filter(({ isDisplay }) => isDisplay)
      .map(({ mappingPath }) => mappingPath.slice(-1)[0])
  );
  return fieldNames.has('latitude1') && fieldNames.has('longitude1');
}

// TODO: allow selecting specific fields for record set creation
function MakeRecordSetButton({
  baseTableName,
  queryResource,
  fields,
}: {
  readonly baseTableName: Lowercase<keyof Tables>;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
}): JSX.Element {
  const [state, setState] = React.useState<
    undefined | 'editing' | 'saving' | 'saved'
  >(undefined);

  const [recordSet, setRecordSet] = React.useState<
    SpecifyResource<RecordSet> | undefined
  >(undefined);

  return (
    <>
      <QueryButton
        showConfirmation={() =>
          fields.some(({ mappingPath }) => !mappingPathIsComplete(mappingPath))
        }
        disabled={fields.length === 0}
        onClick={(): void => {
          setState('editing');
          queryResource.set(
            'fields',
            unParseQueryFields(baseTableName, fields)
          );

          const recordSet = new schema.models.RecordSet.Resource();
          recordSet.set('dbTableId', defined(getModel(baseTableName)).tableId);
          // @ts-expect-error Adding a non-datamodel field
          recordSet.set('fromQuery', queryResource.toJSON());
          // @ts-expect-error Overwriting the resource back-end URL
          recordSet.url = '/stored_query/make_recordset/';
          setRecordSet(recordSet);
        }}
      >
        {queryText('makeRecordSet')}
      </QueryButton>
      {typeof state === 'string' ? (
        state === 'editing' || state === 'saving' ? (
          <>
            {typeof recordSet !== 'undefined' && (
              <EditResourceDialog
                resource={recordSet}
                onSaving={(): void => setState('saving')}
                onSaved={(): void => setState('saved')}
                onClose={(): void => setState(undefined)}
              />
            )}
            {state === 'saving' && (
              <Dialog
                title={queryText('recordSetToQueryDialogTitle')}
                header={queryText('recordSetToQueryDialogHeader')}
                onClose={(): void => setState(undefined)}
                buttons={undefined}
              >
                {queryText('recordSetToQueryDialogMessage')}
                {loadingBar}
              </Dialog>
            )}
          </>
        ) : state === 'saved' && typeof recordSet !== 'undefined' ? (
          <Dialog
            title={queryText('recordSetCreatedDialogTitle')}
            header={queryText('recordSetCreatedDialogHeader')}
            onClose={(): void => setState(undefined)}
            buttons={
              <>
                <Button.DialogClose>{commonText('no')}</Button.DialogClose>
                <Button.Blue
                  onClick={(): void =>
                    navigation.go(`/specify/recordset/${recordSet.id}/`)
                  }
                >
                  {commonText('open')}
                </Button.Blue>
              </>
            }
          >
            {queryText('recordSetCreatedDialogMessage')}
          </Dialog>
        ) : undefined
      ) : undefined}
    </>
  );
}

function QueryExportButtons({
  baseTableName,
  fields,
  queryResource,
}: {
  readonly baseTableName: Lowercase<keyof Tables>;
  readonly fields: RA<QueryField>;
  readonly queryResource: SpecifyResource<SpQuery>;
}): JSX.Element {
  const showConfirmation = (): boolean =>
    fields.some(({ mappingPath }) => !mappingPathIsComplete(mappingPath));

  const [state, setState] = React.useState<undefined | 'creating' | 'warning'>(
    undefined
  );

  function doQueryExport(url: string, captions?: RA<string>): void {
    queryResource.set('fields', unParseQueryFields(baseTableName, fields));
    const serialized = queryResource.toJSON();
    setState('creating');
    void ping(url, {
      method: 'POST',
      body: {
        ...serialized,
        captions,
      },
    });
  }

  return (
    <>
      {state === 'creating' ? (
        <Dialog
          title={queryText('queryExportStartedDialogTitle')}
          header={queryText('queryExportStartedDialogHeader')}
          onClose={(): void => setState(undefined)}
          buttons={commonText('close')}
        >
          {queryText('queryExportStartedDialogMessage')}
        </Dialog>
      ) : state === 'warning' ? (
        <Dialog
          title={queryText('unableToExportAsKmlDialogTitle')}
          header={queryText('unableToExportAsKmlDialogHeader')}
          onClose={(): void => setState(undefined)}
          buttons={commonText('close')}
        >
          {queryText('unableToExportAsKmlDialogMessage')}
        </Dialog>
      ) : undefined}
      <QueryButton
        disabled={fields.length === 0}
        onClick={(): void => doQueryExport('/stored_query/exportcsv/')}
        showConfirmation={showConfirmation}
      >
        {queryText('createCsv')}
      </QueryButton>
      <QueryButton
        disabled={fields.length === 0}
        onClick={(): void =>
          hasLocalityColumns(fields)
            ? doQueryExport(
                '/stored_query/exportkml/',
                fields
                  .filter(({ isDisplay }) => isDisplay)
                  .map(({ mappingPath, details }) => {
                    const mappingPathPreview = generateMappingPathPreview(
                      baseTableName,
                      mappingPath
                    );
                    return details?.type === 'dateField' &&
                      details.datePart !== 'fullDate'
                      ? `${mappingPathPreview} (${dateParts[details.datePart]})`
                      : mappingPathPreview;
                  })
              )
            : setState('warning')
        }
        showConfirmation={showConfirmation}
      >
        {queryText('createKml')}
      </QueryButton>
    </>
  );
}

function QueryBuilder({
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
        <header className="gap-x-2 flex items-center">
          <TableIcon tableName={model.name} />
          <H2>
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
          <Submit.Simple value={commonText('query')} />
        </div>
      </form>
    </ContainerFull>
  );
}

function useQueryRecordSet(): SpecifyResource<RecordSet> | undefined | false {
  const [recordSet, setRecordSet] = React.useState<
    SpecifyResource<RecordSet> | undefined | false
  >(undefined);
  React.useEffect(() => {
    const recordSetId = querystring.parse().recordsetid;
    if (typeof recordSetId === 'undefined') {
      setRecordSet(false);
      return;
    }
    const recordSet = new schema.models.RecordSet.LazyCollection({
      filters: { id: Number.parseInt(recordSetId) },
    });
    recordSet
      .fetch()
      .then(({ models }) => setRecordSet(models[0]), console.error);
  }, []);

  return recordSet;
}

function QueryBuilderWrapper({
  query,
  recordSet,
}: {
  query: SpecifyResource<SpQuery>;
  recordSet?: SpecifyResource<RecordSet> | false;
}) {
  const [isLoading, setIsLoading] = React.useState(
    typeof dataModelStorage.tables === 'undefined'
  );
  React.useEffect(() => {
    dataModelPromise.then(() => setIsLoading(false)).catch(crash);
  }, []);

  return isLoading ? (
    <LoadingScreen />
  ) : (
    <QueryBuilder
      query={query}
      readOnly={userInfo.isReadOnly}
      model={defined(getModel(query.get('contextName')))}
      recordSet={typeof recordSet === 'object' ? recordSet : undefined}
    />
  );
}

function QueryBuilderById({
  queryId,
}: {
  readonly queryId: number;
}): JSX.Element {
  const [query, setQuery] = React.useState<SpecifyResource<SpQuery>>();
  const recordSet = useQueryRecordSet();
  React.useEffect(() => {
    const query = new schema.models.SpQuery.Resource({ id: queryId });
    query.fetch().then(setQuery, app.handleError);
  }, [queryId]);

  return typeof query === 'undefined' || typeof recordSet === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <QueryBuilderWrapper query={query} recordSet={recordSet} />
  );
}

const QueryById = createBackboneView(QueryBuilderById);

function NewQuery({ tableName }: { readonly tableName: string }): JSX.Element {
  const [query, setQuery] = React.useState<
    SpecifyResource<SpQuery> | undefined
  >(undefined);
  const recordSet = useQueryRecordSet();

  React.useEffect(() => {
    const query = new schema.models.SpQuery.Resource();
    const model = getModel(tableName);
    if (typeof model === 'undefined') {
      setCurrentView(new NotFoundView());
      return;
    }

    query.set('name', queryText('newQueryName'));
    query.set('contextName', model.name);
    query.set('contextTableId', model.tableId);
    query.set('selectDistinct', false);
    query.set('countOnly', false);
    query.set('formatAuditRecIds', false);
    query.set('specifyUser', userInfo.resource_uri);
    query.set('isFavorite', true);
    /*
     * Ordinal seems to always get set to 32767 by Specify 6
     * needs to be set for the query to be visible in Specify 6
     */
    query.set('ordinal', 32_767);
    setQuery(query);
  }, [tableName]);

  return typeof query === 'undefined' || typeof recordSet === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <QueryBuilderWrapper query={query} recordSet={recordSet} />
  );
}

const NewQueryView = createBackboneView(NewQuery);

function QueryBuilderFromTree({
  tableName,
  nodeId,
}: {
  readonly tableName: string;
  readonly nodeId: number;
}): JSX.Element {
  const [query, setQuery] = React.useState<
    SpecifyResource<SpQuery> | undefined
  >(undefined);

  React.useEffect(
    // TODO: convert to react
    () => queryFromTree(userInfo, tableName, nodeId).then(setQuery),
    [tableName, nodeId]
  );

  return typeof query === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <QueryBuilderWrapper query={query} />
  );
}

const QueryFromTree = createBackboneView(QueryBuilderFromTree);

export default function Routes(): void {
  router.route('newQuery/:id/', 'storedQuery', (id) =>
    app.setCurrentView(new QueryById({ queryId: Number.parseInt(id) }))
  );
  router.route('newQuery/new/:table/', 'ephemeralQuery', (tableName) =>
    app.setCurrentView(new NewQueryView({ tableName }))
  );
  router.route(
    'newQuery/fromtree/:table/:id/',
    'queryFromTree',
    (tableName, nodeId) =>
      app.setCurrentView(
        new QueryFromTree({
          tableName,
          nodeId: Number.parseInt(nodeId),
        })
      )
  );
}
