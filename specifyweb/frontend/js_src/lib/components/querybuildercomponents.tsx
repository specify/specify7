import React from 'react';

import { ping } from '../ajax';
import type { RecordSet, SpQuery, SpQueryField, Tables } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import queryText from '../localization/query';
import * as navigation from '../navigation';
import type { QueryField } from '../querybuilderutils';
import { hasLocalityColumns } from '../querybuilderutils';
import { getModel, schema } from '../schema';
import type { RA } from '../types';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { f } from '../wbplanviewhelper';
import { generateMappingPathPreview } from '../wbplanviewmappingpreview';
import { mappingPathIsComplete } from '../wbplanviewutils';
import { Button } from './basic';
import { Dialog, loadingBar } from './modaldialog';
import { QuerySaveDialog } from './querysavedialog';
import { getDefaultFormMode, ResourceView } from './resourceview';
import { ButtonWithConfirmation } from './wbplanviewcomponents';

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
      dialogButtons={(confirm): JSX.Element => (
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

export function SaveQueryButtons({
  isReadOnly,
  fields,
  saveRequired,
  queryResource,
  setHasUnloadProtect,
  getQueryFieldRecords,
}: {
  readonly isReadOnly: boolean;
  readonly fields: RA<QueryField>;
  readonly saveRequired: boolean;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly setHasUnloadProtect: (
    isEnabled: boolean,
    callback: () => void
  ) => void;
  readonly getQueryFieldRecords: () => RA<SerializedResource<SpQueryField>>;
}): JSX.Element {
  const [showDialog, setShowDialog] = React.useState<false | 'save' | 'saveAs'>(
    false
  );
  const showConfirmation = (): boolean =>
    fields.some(({ mappingPath }) => !mappingPathIsComplete(mappingPath));

  function handleSave(newState: typeof showDialog): void {
    if (newState === 'save' || newState === 'saveAs')
      queryResource.set('fields', getQueryFieldRecords());
    setShowDialog(newState);
  }

  return (
    <>
      {typeof showDialog === 'string' && (
        <QuerySaveDialog
          isSaveAs={showDialog === 'saveAs'}
          onClose={(): void => setShowDialog(false)}
          onSaved={(queryId: number): void =>
            setHasUnloadProtect(false, () =>
              navigation.go(`/specify/query/${queryId}/`)
            )
          }
          query={queryResource}
        />
      )}
      {isReadOnly ||
      queryResource.get('specifyUser') !==
        userInformation.resource_uri ? undefined : (
        <QueryButton
          disabled={!saveRequired || fields.length === 0}
          onClick={(): void => handleSave('save')}
          showConfirmation={showConfirmation}
        >
          {commonText('save')}
        </QueryButton>
      )}
      {isReadOnly || queryResource.isNew() ? undefined : (
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

// TODO: allow selecting specific fields for record set creation
export function MakeRecordSetButton({
  baseTableName,
  queryResource,
  fields,
  getQueryFieldRecords,
}: {
  readonly baseTableName: keyof Tables;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly getQueryFieldRecords: () => RA<SerializedResource<SpQueryField>>;
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
        showConfirmation={(): boolean =>
          fields.some(({ mappingPath }) => !mappingPathIsComplete(mappingPath))
        }
        disabled={fields.length === 0}
        onClick={(): void => {
          setState('editing');
          queryResource.set('fields', getQueryFieldRecords());

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
            {typeof recordSet === 'object' && (
              <ResourceView
                dialog="modal"
                canAddAnother={false}
                resource={recordSet}
                onSaving={(): void => setState('saving')}
                onSaved={(): void => setState('saved')}
                onClose={(): void => setState(undefined)}
                onDeleted={f.never}
                mode={getDefaultFormMode()}
                isSubForm={false}
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
        ) : state === 'saved' && typeof recordSet === 'object' ? (
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

export function QueryExportButtons({
  baseTableName,
  fields,
  queryResource,
  getQueryFieldRecords,
}: {
  readonly baseTableName: keyof Tables;
  readonly fields: RA<QueryField>;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly getQueryFieldRecords: () => RA<SerializedResource<SpQueryField>>;
}): JSX.Element {
  const showConfirmation = (): boolean =>
    fields.some(({ mappingPath }) => !mappingPathIsComplete(mappingPath));

  const [state, setState] = React.useState<undefined | 'creating' | 'warning'>(
    undefined
  );

  function doQueryExport(url: string, captions?: RA<string>): void {
    queryResource.set('fields', getQueryFieldRecords());
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
                  .map(({ mappingPath }) =>
                    generateMappingPathPreview(baseTableName, mappingPath)
                  )
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
