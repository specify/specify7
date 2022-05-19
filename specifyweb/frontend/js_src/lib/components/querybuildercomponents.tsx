import React from 'react';

import { ping } from '../ajax';
import type { RecordSet, SpQuery, SpQueryField, Tables } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { queryText } from '../localization/query';
import { hasPermission } from '../permissions';
import type { QueryField } from '../querybuilderutils';
import { hasLocalityColumns } from '../querybuilderutils';
import { getModel, schema } from '../schema';
import type { RA } from '../types';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { generateMappingPathPreview } from '../wbplanviewmappingpreview';
import { mappingPathIsComplete } from '../wbplanviewutils';
import { Button, className, Link } from './basic';
import { Dialog, loadingBar } from './modaldialog';
import { goTo } from './navigation';
import { QuerySaveDialog } from './querysavedialog';
import { ResourceView } from './resourceview';
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
      dialogHeader={queryText('queryDeleteIncompleteDialogHeader')}
      dialogMessage={queryText('queryDeleteIncompleteDialogText')}
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
  isValid,
  queryResource,
  unsetUnloadProtect,
  getQueryFieldRecords,
  onTriedToSave: handleTriedToSave,
}: {
  readonly isReadOnly: boolean;
  readonly fields: RA<QueryField>;
  readonly saveRequired: boolean;
  readonly isValid: () => void;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly unsetUnloadProtect: () => void;
  readonly getQueryFieldRecords: () => RA<SerializedResource<SpQueryField>>;
  readonly onTriedToSave: () => boolean;
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
          onSaved={(queryId: number): void => {
            unsetUnloadProtect();
            goTo(`/specify/query/${queryId}/`);
          }}
          query={queryResource}
        />
      )}
      {isReadOnly ||
      queryResource.get('specifyUser') !==
        userInformation.resource_uri ? undefined : (
        <QueryButton
          disabled={!saveRequired || fields.length === 0}
          onClick={(): void =>
            handleTriedToSave() && isValid() ? handleSave('save') : undefined
          }
          showConfirmation={showConfirmation}
        >
          {commonText('save')}
        </QueryButton>
      )}
      {isReadOnly || queryResource.isNew() ? undefined : (
        <QueryButton
          disabled={fields.length === 0}
          onClick={(): void =>
            handleTriedToSave() && isValid() ? handleSave('saveAs') : undefined
          }
          showConfirmation={showConfirmation}
        >
          {queryText('saveAs')}
        </QueryButton>
      )}
    </>
  );
}

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
                mode="edit"
                isSubForm={false}
                isDependent={false}
              />
            )}
            {state === 'saving' && (
              <Dialog
                header={queryText('recordSetToQueryDialogHeader')}
                onClose={(): void => setState(undefined)}
                buttons={undefined}
              >
                {queryText('recordSetToQueryDialogText')}
                {loadingBar}
              </Dialog>
            )}
          </>
        ) : state === 'saved' && typeof recordSet === 'object' ? (
          <Dialog
            header={queryText('recordSetCreatedDialogHeader')}
            onClose={(): void => setState(undefined)}
            buttons={
              <>
                <Button.DialogClose>{commonText('no')}</Button.DialogClose>
                <Link.LikeButton
                  className={className.blueButton}
                  href={`/specify/recordset/${recordSet.id}/`}
                >
                  {commonText('open')}
                </Link.LikeButton>
              </>
            }
          >
            {queryText('recordSetCreatedDialogText')}
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
          header={queryText('queryExportStartedDialogHeader')}
          onClose={(): void => setState(undefined)}
          buttons={commonText('close')}
        >
          {queryText('queryExportStartedDialogText')}
        </Dialog>
      ) : state === 'warning' ? (
        <Dialog
          header={queryText('unableToExportAsKmlDialogHeader')}
          onClose={(): void => setState(undefined)}
          buttons={commonText('close')}
        >
          {queryText('unableToExportAsKmlDialogText')}
        </Dialog>
      ) : undefined}
      {hasPermission('/querybuilder/query', 'export_csv') && (
        <QueryButton
          disabled={fields.length === 0}
          onClick={(): void => doQueryExport('/stored_query/exportcsv/')}
          showConfirmation={showConfirmation}
        >
          {queryText('createCsv')}
        </QueryButton>
      )}
      {hasPermission('/querybuilder/query', 'export_kml') && (
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
      )}
    </>
  );
}
