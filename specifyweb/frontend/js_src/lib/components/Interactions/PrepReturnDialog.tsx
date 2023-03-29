import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { getDateInputValue } from '../../utils/dayJs';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { getField } from '../DataModel/helpers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { Loan, LoanPreparation } from '../DataModel/types';
import type { ViewDescription } from '../FormParse';
import { autoGenerateViewDefinition } from '../Forms/generateFormDefinition';
import { SpecifyForm } from '../Forms/SpecifyForm';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';
import { PrepReturnRow } from './PrepReturnRow';

export const loanReturnPrepForm = f.store(
  (): ViewDescription =>
    autoGenerateViewDefinition(
      schema.models.LoanReturnPreparation,
      'form',
      'edit',
      ['receivedBy', 'returnedDate']
    )
);

export type PrepReturnRowState = {
  readonly resolve: number;
  readonly returns: number;
  readonly unresolved: number;
  readonly remarks: string;
};

export function LoanReturn({
  resource,
  onClose: handleClose,
}: {
  readonly resource: SpecifyResource<Loan>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [preparations] = useAsyncState(
    React.useCallback(
      async () =>
        resource
          .rgetCollection('loanPreparations')
          .then(({ models }) =>
            models.filter(
              (preparation) =>
                (preparation.get('quantity') ?? 0) >
                (preparation.get('quantityResolved') ?? 0)
            )
          ),
      [resource]
    ),
    true
  );

  return Array.isArray(preparations) ? (
    preparations.length === 0 ? (
      <Dialog
        buttons={commonText.close()}
        header={schema.models.LoanPreparation.label}
        onClose={handleClose}
      >
        {interactionsText.noUnresolvedPreparations()}
      </Dialog>
    ) : (
      <PreparationReturn preparations={preparations} onClose={handleClose} />
    )
  ) : null;
}

function PreparationReturn({
  preparations,
  onClose: handleClose,
}: {
  readonly preparations: RA<SpecifyResource<LoanPreparation>>;
  readonly onClose: () => void;
}): JSX.Element {
  const loanReturnPreparation = React.useRef(
    new schema.models.LoanReturnPreparation.Resource({
      returneddate: getDateInputValue(new Date()),
      receivedby: userInformation.agent.resource_uri,
    })
  );
  const [state, setState] = React.useState<RA<PrepReturnRowState>>(() =>
    preparations.map((preparation) => ({
      resolve: 0,
      returns: 0,
      unresolved:
        (preparation.get('quantity') ?? 0) -
        (preparation.get('quantityResolved') ?? 0),
      remarks: '',
    }))
  );
  const canDeselect = state.some(({ resolve }) => resolve > 0);
  const canSelectAll = state.some(
    ({ resolve, unresolved }) => resolve < unresolved
  );

  const id = useId('prep-return-dialog');
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Blue
            disabled={!canSelectAll}
            title={interactionsText.returnAllPreparations()}
            onClick={(): void =>
              setState(
                state.map(({ unresolved, remarks }) => ({
                  resolve: unresolved,
                  returns: unresolved,
                  unresolved,
                  remarks,
                }))
              )
            }
          >
            {interactionsText.selectAll()}
          </Button.Blue>
          <Button.Blue
            disabled={!canDeselect}
            title={commonText.clearAll()}
            onClick={(): void =>
              setState(
                state.map(({ remarks }) => ({
                  resolve: 0,
                  returns: 0,
                  unresolved: 0,
                  remarks,
                }))
              )
            }
          >
            {interactionsText.deselectAll()}
          </Button.Blue>
          <Submit.Green
            form={id('form')}
            title={interactionsText.returnSelectedPreparations()}
          >
            {commonText.apply()}
          </Submit.Green>
        </>
      }
      header={schema.models.LoanPreparation.label}
      onClose={handleClose}
    >
      <Form
        id={id('form')}
        onSubmit={(): void => {
          state
            .map((state, index) => ({
              preparation: preparations[index],
              ...state,
            }))
            .filter(({ resolve }) => resolve > 0)
            .forEach(({ preparation, resolve, returns, remarks }) => {
              preparation.set(
                'quantityReturned',
                (preparation.get('quantityReturned') ?? 0) + returns
              );
              preparation.set(
                'quantityResolved',
                (preparation.get('quantityResolved') ?? 0) + resolve
              );
              preparation.set(
                'isResolved',
                (preparation.get('quantityResolved') ?? 0) >=
                  (preparation.get('quantity') ?? 0)
              );

              const loanReturn =
                new schema.models.LoanReturnPreparation.Resource();
              loanReturn.set('loanPreparation', preparation.url());
              loanReturn.set('remarks', remarks);
              loanReturn.set('quantityResolved', returns);
              loanReturn.set('quantityReturned', returns);
              loanReturn.set(
                'receivedBy',
                loanReturnPreparation.current.get('receivedBy')
              );
              loanReturn.set(
                'returnedDate',
                loanReturnPreparation.current.get('returnedDate')
              );

              const loanPreparations = preparation.getDependentResource(
                'loanReturnPreparations'
              );
              if (typeof loanPreparations === 'object')
                loanPreparations.add(loanReturn);
            });
          handleClose();
        }}
      >
        <SpecifyForm
          display="block"
          resource={loanReturnPreparation.current}
          viewDefinition={loanReturnPrepForm()}
        />
        <table className="grid-table grid-cols-[repeat(8,auto)] gap-2">
          <thead>
            <tr>
              <td />
              <th className="text-center" scope="col">
                {
                  getField(schema.models.CollectionObject, 'catalogNumber')
                    .label
                }
              </th>
              <th className="text-center" scope="col">
                {getField(schema.models.Determination, 'taxon').label}
              </th>
              <th className="text-center" scope="col">
                {getField(schema.models.Preparation, 'prepType').label}
              </th>
              <th className="text-center" scope="col">
                {interactionsText.unresolved()}
              </th>
              <th className="text-center" scope="col">
                {interactionsText.return()}
              </th>
              <th className="col-span-2 text-center" scope="col">
                {interactionsText.resolve()}
              </th>
            </tr>
          </thead>
          <tbody>
            {preparations.map((preparation, index) => (
              <PrepReturnRow
                key={preparation.cid}
                preparation={preparation}
                {...state[index]}
                onChange={(newState): void =>
                  setState(replaceItem(state, index, newState))
                }
              />
            ))}
          </tbody>
        </table>
      </Form>
    </Dialog>
  );
}
