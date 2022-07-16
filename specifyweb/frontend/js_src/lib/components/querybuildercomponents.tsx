import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, ping } from '../ajax';
import type {
  LoanPreparation,
  LoanReturnPreparation,
  RecordSet,
  SpQuery,
  SpQueryField,
  Tables,
} from '../datamodel';
import type { SerializedModel, SerializedResource } from '../datamodelutils';
import { getDateInputValue } from '../dayjs';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { queryText } from '../localization/query';
import { hasPermission } from '../permissionutils';
import type { QueryField } from '../querybuilderutils';
import { hasLocalityColumns } from '../querybuilderutils';
import { getResourceViewUrl, idFromUrl, resourceToJson } from '../resource';
import { getModel, getModelById, schema } from '../schema';
import type { RA, RR } from '../types';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { generateMappingPathPreview } from '../wbplanviewmappingpreview';
import { mappingPathIsComplete } from '../wbplanviewutils';
import { Button, Form, Link, Submit } from './basic';
import { TableIcon } from './common';
import { LoadingContext } from './contexts';
import { useAsyncState, useId } from './hooks';
import { Dialog, loadingBar } from './modaldialog';
import { goTo } from './navigation';
import { loanReturnPrepForm } from './prepreturndialog';
import { QuerySaveDialog } from './querysavedialog';
import { ResourceView } from './resourceview';
import { RenderForm } from './specifyform';
import { ButtonWithConfirmation } from './wbplanviewcomponents';
import { sortFunction } from '../helpers';

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
  onSaved: handleSaved,
  onTriedToSave: handleTriedToSave,
}: {
  readonly isReadOnly: boolean;
  readonly fields: RA<QueryField>;
  readonly saveRequired: boolean;
  readonly isValid: () => void;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly unsetUnloadProtect: () => void;
  readonly getQueryFieldRecords:
    | (() => RA<SerializedResource<SpQueryField>>)
    | undefined;
  readonly onSaved: () => void;
  readonly onTriedToSave: () => boolean;
}): JSX.Element {
  const [showDialog, setShowDialog] = React.useState<false | 'save' | 'saveAs'>(
    false
  );
  const showConfirmation = (): boolean =>
    fields.some(({ mappingPath }) => !mappingPathIsComplete(mappingPath));

  function handleSave(newState: typeof showDialog): void {
    if (
      typeof getQueryFieldRecords === 'function' &&
      (newState === 'save' || newState === 'saveAs')
    )
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
            handleSaved();
            setShowDialog(false);
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
          {queryText('saveQuery')}
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

/**
 * Create a Record Set from all query results.
 * See also `CreateRecordSet`
 */
export function MakeRecordSetButton({
  baseTableName,
  queryResource,
  fields,
  getQueryFieldRecords,
}: {
  readonly baseTableName: keyof Tables;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly getQueryFieldRecords:
    | (() => RA<SerializedResource<SpQueryField>>)
    | undefined;
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
          if (typeof getQueryFieldRecords === 'function')
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
        {queryText('createRecordSet')}
      </QueryButton>
      {state === 'editing' || state === 'saving' ? (
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
          {state === 'saving' && recordSetFromQueryLoading}
        </>
      ) : undefined}
      {state === 'saved' && typeof recordSet === 'object' ? (
        <RecordSetCreated
          recordSet={recordSet}
          onClose={(): void => setState(undefined)}
        />
      ) : undefined}
    </>
  );
}

export const recordSetFromQueryLoading = (
  <Dialog
    header={queryText('recordSetToQueryDialogHeader')}
    onClose={undefined}
    buttons={undefined}
  >
    {queryText('recordSetToQueryDialogText')}
    {loadingBar}
  </Dialog>
);

export function RecordSetCreated({
  recordSet,
  onClose: handleClose,
}: {
  readonly recordSet: SpecifyResource<RecordSet>;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      header={queryText('recordSetCreatedDialogHeader')}
      onClose={handleClose}
      buttons={
        <>
          <Link.Blue href={`/specify/recordset/${recordSet.id}/`}>
            {commonText('open')}
          </Link.Blue>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
        </>
      }
    >
      <Link.Default href={`/specify/recordset/${recordSet.id}/`}>
        <TableIcon
          name={defined(getModelById(recordSet.get('dbTableId'))).name}
          label
        />
        {recordSet.get('name')}
      </Link.Default>
    </Dialog>
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
  readonly getQueryFieldRecords:
    | (() => RA<SerializedResource<SpQueryField>>)
    | undefined;
}): JSX.Element {
  const showConfirmation = (): boolean =>
    fields.some(({ mappingPath }) => !mappingPathIsComplete(mappingPath));

  const [state, setState] = React.useState<undefined | 'creating' | 'warning'>(
    undefined
  );

  function doQueryExport(url: string, captions?: RA<string>): void {
    if (typeof getQueryFieldRecords === 'function')
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

  const canUseKml =
    (baseTableName === 'Locality' ||
      fields.some(({ mappingPath }) => mappingPath.includes('locality'))) &&
    hasPermission('/querybuilder/query', 'export_kml');

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
      {canUseKml && (
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

const returnLoanPreps = async (
  query: SerializedModel<SpQuery>,
  loanReturnPreparation: SpecifyResource<LoanReturnPreparation>,
  commit: boolean
): Promise<
  RA<{
    readonly loanId: number;
    readonly loanNumber: string;
    readonly totalPreps: number;
  }>
> =>
  ajax<
    RR<
      number,
      {
        readonly loanpreparations: RA<SerializedModel<LoanPreparation>>;
        readonly loannumber: string;
      }
    >
  >('/stored_query/return_loan_preps/', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: {
      query,
      commit,
      returneddate: loanReturnPreparation.get('returnedDate'),
      receivedby: idFromUrl(loanReturnPreparation.get('receivedBy') ?? ''),
    },
  }).then(({ data }) =>
    Object.entries(data)
      .map(([loanId, { loanpreparations, loannumber }]) => ({
        loanId: Number.parseInt(loanId),
        loanNumber: loannumber,
        totalPreps: loanpreparations.reduce(
          (count, { quantity }) => count + (quantity ?? 0),
          0
        ),
      }))
      .sort(sortFunction(({ loanNumber }) => loanNumber))
  );

export function QueryLoanReturn({
  fields,
  queryResource,
  getQueryFieldRecords,
}: {
  readonly fields: RA<QueryField>;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly getQueryFieldRecords:
    | (() => RA<SerializedResource<SpQueryField>>)
    | undefined;
}): JSX.Element {
  const showConfirmation = (): boolean =>
    fields.some(({ mappingPath }) => !mappingPathIsComplete(mappingPath));
  const [state, setState] = React.useState<
    | State<'Main'>
    | State<
        'Dialog',
        {
          queryResource: SerializedModel<SpQuery>;
          loanReturnPreparation: SpecifyResource<LoanReturnPreparation>;
        }
      >
    | State<'Returned'>
  >({
    type: 'Main',
  });
  const [toReturn] = useAsyncState(
    React.useCallback(
      () =>
        state.type === 'Dialog'
          ? returnLoanPreps(
              state.queryResource,
              state.loanReturnPreparation,
              false
            )
          : undefined,
      [state]
    ),
    true
  );
  const id = useId('query-loan-return');
  const loading = React.useContext(LoadingContext);
  return (
    <>
      <QueryButton
        disabled={fields.length === 0}
        onClick={(): void =>
          setState({
            type: 'Dialog',
            loanReturnPreparation:
              new schema.models.LoanReturnPreparation.Resource({
                returneddate: getDateInputValue(new Date()),
                receivedby: userInformation.agent.resource_uri,
              }),
            queryResource: resourceToJson(
              typeof getQueryFieldRecords === 'function'
                ? queryResource.set('fields', getQueryFieldRecords())
                : queryResource
            ),
          })
        }
        showConfirmation={showConfirmation}
      >
        {formsText('returnLoan')}
      </QueryButton>
      {state.type === 'Dialog' && Array.isArray(toReturn) ? (
        <Dialog
          header={schema.models.LoanPreparation.label}
          onClose={(): void => setState({ type: 'Main' })}
          buttons={
            toReturn.length === 0 ? (
              commonText('close')
            ) : (
              <>
                <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
                <Submit.Green
                  form={id('form')}
                  title={formsText('returnSelectedPreparations')}
                >
                  {formsText('return')}
                </Submit.Green>
              </>
            )
          }
        >
          {toReturn.length === 0 ? (
            queryText('noPreparationsToReturn')
          ) : (
            <Form
              id={id('form')}
              onSubmit={(): void =>
                loading(
                  returnLoanPreps(
                    state.queryResource,
                    state.loanReturnPreparation,
                    true
                  ).then((): void => setState({ type: 'Returned' }))
                )
              }
            >
              <RenderForm
                resource={state.loanReturnPreparation}
                viewDefinition={loanReturnPrepForm()}
                display="block"
              />
              <table className="grid-table grid-cols-2 gap-2">
                <thead>
                  <tr>
                    <th scope="col">
                      {
                        defined(
                          schema.models.Loan.getLiteralField('loanNumber')
                        ).label
                      }
                    </th>
                    <th scope="col">{commonText('quantity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {toReturn.map(({ loanId, loanNumber, totalPreps }) => (
                    <tr key={loanId}>
                      <td>
                        <Link.NewTab href={getResourceViewUrl('Loan', loanId)}>
                          {loanNumber}
                        </Link.NewTab>
                      </td>
                      <td className="tabular-nums justify-end">{totalPreps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Form>
          )}
        </Dialog>
      ) : undefined}
      {state.type === 'Returned' && (
        <Dialog
          header={schema.models.LoanPreparation.label}
          onClose={(): void => setState({ type: 'Main' })}
          buttons={commonText('close')}
        >
          {queryText('itemsReturned')}
        </Dialog>
      )}
    </>
  );
}
