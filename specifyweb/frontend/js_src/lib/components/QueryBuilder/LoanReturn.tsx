import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { queryText } from '../../localization/query';
import { ajax } from '../../utils/ajax';
import { getDateInputValue } from '../../utils/dayJs';
import type { RA, RR } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { getField } from '../DataModel/helpers';
import type {
  SerializedRecord,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  getResourceViewUrl,
  idFromUrl,
  resourceToJson,
} from '../DataModel/resource';
import { tables } from '../DataModel/tables';
import type {
  LoanPreparation,
  LoanReturnPreparation,
  SpQuery,
  SpQueryField,
} from '../DataModel/types';
import { SpecifyForm } from '../Forms/SpecifyForm';
import { userInformation } from '../InitialContext/userInformation';
import { loanReturnPrepForm } from '../Interactions/LoanReturn';
import { Dialog } from '../Molecules/Dialog';
import { mappingPathIsComplete } from '../WbPlanView/helpers';
import { QueryButton } from './Components';
import type { QueryField } from './helpers';

const returnLoanPreps = async (
  query: SerializedRecord<SpQuery>,
  loanReturnPreparation: SpecifyResource<LoanReturnPreparation>,
  commit: boolean
): Promise<
  RA<{
    readonly loanId: number;
    readonly loanNumber: LocalizedString;
    readonly totalPreps: number;
  }>
> =>
  ajax<
    RR<
      number,
      {
        readonly loanpreparations: RA<SerializedRecord<LoanPreparation>>;
        readonly loannumber: LocalizedString;
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
          readonly queryResource: SerializedRecord<SpQuery>;
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
      async () =>
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
            loanReturnPreparation: new tables.LoanReturnPreparation.Resource({
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
        {interactionsText.returnLoan({
          tableLoan: tables.Loan.label,
        })}
      </QueryButton>
      {state.type === 'Dialog' && Array.isArray(toReturn) ? (
        <Dialog
          buttons={
            toReturn.length === 0 ? (
              commonText.close()
            ) : (
              <>
                <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
                <Submit.Success
                  form={id('form')}
                  title=
                    {interactionsText.returnSelectedPreparations({
                      preparationTable: String(tables.Preparation.label).toLowerCase(),
                    })}
                >
                  {interactionsText.return()}
                </Submit.Success>
              </>
            )
          }
          header={tables.LoanPreparation.label}
          onClose={(): void => setState({ type: 'Main' })}
        >
          {toReturn.length === 0 ? (
            queryText.noPreparationsToReturn()
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
              <SpecifyForm
                display="block"
                resource={state.loanReturnPreparation}
                viewDefinition={loanReturnPrepForm()}
              />
              <table className="grid-table grid-cols-2 gap-2">
                <thead>
                  <tr>
                    <th scope="col">
                      {getField(tables.Loan, 'loanNumber').label}
                    </th>
                    <th scope="col">
                      {getField(tables.LoanPreparation, 'quantity').label}
                    </th>
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
          buttons={commonText.close()}
          header={tables.LoanPreparation.label}
          onClose={(): void => setState({ type: 'Main' })}
        >
          {queryText.itemsReturned()}
        </Dialog>
      )}
    </>
  );
}
