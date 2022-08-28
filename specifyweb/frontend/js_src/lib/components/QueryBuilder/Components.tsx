import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax } from '../../utils/ajax';
import { ping } from '../../utils/ajax/ping';
import type {
  LoanPreparation,
  LoanReturnPreparation,
  RecordSet,
  SpQuery,
  SpQueryField,
  Tables,
} from '../DataModel/types';
import type { SerializedModel, SerializedResource } from '../DataModel/helpers';
import { getDateInputValue } from '../../utils/dayJs';
import { f } from '../../utils/functools';
import { sortFunction } from '../../utils/utils';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { queryText } from '../../localization/query';
import { hasPermission } from '../Permissions/helpers';
import type { QueryField } from './helpers';
import { hasLocalityColumns } from './helpers';
import {
  getResourceViewUrl,
  idFromUrl,
  resourceToJson,
} from '../DataModel/resource';
import { getModel, getModelById, schema } from '../DataModel/schema';
import type { RA, RR } from '../../utils/types';
import { defined } from '../../utils/types';
import { userInformation } from '../InitialContext/userInformation';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import { mappingPathIsComplete } from '../WbPlanView/helpers';
import { Button, Form, Link, Submit } from '../Atoms/Basic';
import { TableIcon } from '../Molecules';
import { LoadingContext } from '../Core/Contexts';
import { useAsyncState, useId } from '../../hooks/hooks';
import { Dialog, loadingBar } from '../Molecules/Dialog';
import { loanReturnPrepForm } from '../Interactions/PrepReturnDialog';
import { QuerySaveDialog } from './Save';
import { ResourceView } from '../Forms/ResourceView';
import { RenderForm } from '../Forms/SpecifyForm';
import { ButtonWithConfirmation } from '../WbPlanView/Components';
import { useNavigate } from 'react-router-dom';

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
      dialogButtons={(confirm): JSX.Element => (
        <>
          <Button.Orange onClick={confirm}>
            {commonText('remove')}
          </Button.Orange>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
        </>
      )}
      dialogHeader={queryText('queryDeleteIncompleteDialogHeader')}
      dialogMessage={queryText('queryDeleteIncompleteDialogText')}
      disabled={disabled}
      showConfirmation={showConfirmation}
      onConfirm={handleClick}
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
  const [showDialog, setShowDialog] = React.useState<'save' | 'saveAs' | false>(
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

  const navigate = useNavigate();
  return (
    <>
      {typeof showDialog === 'string' && (
        <QuerySaveDialog
          isSaveAs={showDialog === 'saveAs'}
          query={queryResource}
          onClose={(): void => setShowDialog(false)}
          onSaved={(queryId: number): void => {
            handleSaved();
            setShowDialog(false);
            unsetUnloadProtect();
            navigate(`/specify/query/${queryId}/`);
          }}
        />
      )}
      {isReadOnly ||
      queryResource.get('specifyUser') !==
        userInformation.resource_uri ? undefined : (
        <QueryButton
          disabled={!saveRequired || fields.length === 0}
          showConfirmation={showConfirmation}
          onClick={(): void =>
            handleTriedToSave() && isValid() ? handleSave('save') : undefined
          }
        >
          {queryText('saveQuery')}
        </QueryButton>
      )}
      {isReadOnly || queryResource.isNew() ? undefined : (
        <QueryButton
          disabled={fields.length === 0}
          showConfirmation={showConfirmation}
          onClick={(): void =>
            handleTriedToSave() && isValid() ? handleSave('saveAs') : undefined
          }
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
    'editing' | 'saved' | 'saving' | undefined
  >(undefined);

  const [recordSet, setRecordSet] = React.useState<
    SpecifyResource<RecordSet> | undefined
  >(undefined);

  return (
    <>
      <QueryButton
        disabled={fields.length === 0}
        showConfirmation={(): boolean =>
          fields.some(({ mappingPath }) => !mappingPathIsComplete(mappingPath))
        }
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
              canAddAnother={false}
              dialog="modal"
              isDependent={false}
              isSubForm={false}
              mode="edit"
              resource={recordSet}
              onClose={(): void => setState(undefined)}
              onDeleted={f.never}
              onSaved={(): void => setState('saved')}
              onSaving={(): void => setState('saving')}
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
    buttons={undefined}
    header={queryText('recordSetToQueryDialogHeader')}
    onClose={undefined}
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
      buttons={<Button.DialogClose>{commonText('close')}</Button.DialogClose>}
      header={queryText('recordSetCreatedDialogHeader')}
      onClose={handleClose}
    >
      <Link.Default href={`/specify/recordset/${recordSet.id}/`}>
        <TableIcon
          label
          name={defined(getModelById(recordSet.get('dbTableId'))).name}
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

  const [state, setState] = React.useState<'creating' | 'warning' | undefined>(
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
          buttons={commonText('close')}
          header={queryText('queryExportStartedDialogHeader')}
          onClose={(): void => setState(undefined)}
        >
          {queryText('queryExportStartedDialogText')}
        </Dialog>
      ) : state === 'warning' ? (
        <Dialog
          buttons={commonText('close')}
          header={queryText('unableToExportAsKmlDialogHeader')}
          onClose={(): void => setState(undefined)}
        >
          {queryText('unableToExportAsKmlDialogText')}
        </Dialog>
      ) : undefined}
      {hasPermission('/querybuilder/query', 'export_csv') && (
        <QueryButton
          disabled={fields.length === 0}
          showConfirmation={showConfirmation}
          onClick={(): void => doQueryExport('/stored_query/exportcsv/')}
        >
          {queryText('createCsv')}
        </QueryButton>
      )}
      {canUseKml && (
        <QueryButton
          disabled={fields.length === 0}
          showConfirmation={showConfirmation}
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
    | State<
        'Dialog',
        {
          readonly queryResource: SerializedModel<SpQuery>;
          readonly loanReturnPreparation: SpecifyResource<LoanReturnPreparation>;
        }
      >
    | State<'Main'>
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
        showConfirmation={showConfirmation}
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
      >
        {formsText('returnLoan')}
      </QueryButton>
      {state.type === 'Dialog' && Array.isArray(toReturn) ? (
        <Dialog
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
          header={schema.models.LoanPreparation.label}
          onClose={(): void => setState({ type: 'Main' })}
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
                display="block"
                resource={state.loanReturnPreparation}
                viewDefinition={loanReturnPrepForm()}
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
                      <td className="justify-end tabular-nums">{totalPreps}</td>
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
          buttons={commonText('close')}
          header={schema.models.LoanPreparation.label}
          onClose={(): void => setState({ type: 'Main' })}
        >
          {queryText('itemsReturned')}
        </Dialog>
      )}
    </>
  );
}
