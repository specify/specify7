import React from 'react';

import type { Loan, LoanPreparation } from '../DataModel/types';
import { getDateInputValue } from '../../utils/dayJs';
import { f } from '../../utils/functools';
import { autoGenerateViewDefinition } from '../Forms/generateFormDefinition';
import { replaceItem } from '../../utils/utils';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { ViewDescription } from '../FormParse';
import { schema } from '../DataModel/schema';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { fieldFormat } from '../../utils/uiParse';
import { userInformation } from '../InitialContext/userInformation';
import { Button, Form, Input, Submit } from '../Atoms/Basic';
import { AutoGrowTextArea } from '../Molecules';
import { useAsyncState, useBooleanState, useId } from '../../hooks/hooks';
import { Dialog } from '../Molecules/Dialog';
import { RenderForm } from '../Forms/SpecifyForm';

export const loanReturnPrepForm = f.store(
  (): ViewDescription =>
    autoGenerateViewDefinition(
      schema.models.LoanReturnPreparation,
      'form',
      'edit',
      ['receivedBy', 'returnedDate']
    )
);

type RowState = {
  readonly resolve: number;
  readonly returns: number;
  readonly unresolved: number;
  readonly remarks: string;
};

function Row({
  preparation,
  resolve,
  returns,
  unresolved,
  remarks,
  onChange: handleChange,
}: RowState & {
  readonly preparation: SpecifyResource<LoanPreparation>;
  readonly onChange: (newState: RowState) => void;
}): JSX.Element {
  const [data] = useAsyncState<{
    readonly catalogNumber: string;
    readonly taxon: string;
    readonly prepType: string;
  }>(
    React.useCallback(
      async () =>
        preparation.rgetPromise('preparation').then(async (loanPreparation) =>
          loanPreparation === null
            ? {
                catalogNumber: '',
                taxon:
                  preparation.get('descriptionOfMaterial')?.slice(0, 50) ??
                  formsText('unCataloged'),
                prepType: '',
              }
            : {
                ...(await loanPreparation.rgetPromise('collectionObject').then<{
                  readonly catalogNumber: string;
                  readonly taxon: string;
                }>(async (collectionObject) => ({
                  catalogNumber: await fieldFormat(
                    defined(
                      schema.models.CollectionObject.getLiteralField(
                        'catalogNumber'
                      )
                    ),
                    undefined,
                    collectionObject.get('catalogNumber')
                  ),
                  taxon: await collectionObject
                    .rgetCollection('determinations')
                    .then(({ models }) =>
                      models
                        .find((determination) => determination.get('isCurrent'))
                        ?.rgetPromise('preferredTaxon')
                    )
                    .then((taxon) => taxon?.get('fullName') ?? ''),
                }))),
                prepType: await loanPreparation
                  .rgetPromise('prepType')
                  .then((prepType) => prepType.get('name')),
              }
        ),
      [preparation]
    ),
    false
  );

  const [showRemarks, _, __, handleToggle] = useBooleanState();

  return (
    <>
      <tr>
        <td>
          <Input.Checkbox
            aria-label={formsText('selectAll')}
            checked={resolve > 0}
            title={formsText('selectAll')}
            onValueChange={(checked): void =>
              handleChange({
                resolve: checked ? unresolved : 0,
                returns: checked ? unresolved : 0,
                unresolved,
                remarks,
              })
            }
          />
        </td>
        <td>{data?.catalogNumber ?? commonText('loading')}</td>
        <td>{data?.taxon ?? commonText('loading')}</td>
        <td className="text-center">
          {data?.prepType ?? commonText('loading')}
        </td>
        <td className="text-center">{unresolved}</td>
        <td>
          <Input.Number
            aria-label={formsText('returnedAmount')}
            className="w-12"
            max={unresolved}
            min={0}
            title={formsText('returnedAmount')}
            value={returns}
            onValueChange={(returns): void =>
              handleChange({
                // Make return <= unresolved
                returns: Math.min(returns, unresolved),
                // Make resolved >= returned
                resolve: Math.max(returns, resolve),
                unresolved,
                remarks,
              })
            }
          />
        </td>
        <td>
          <Input.Number
            aria-label={formsText('resolvedAmount')}
            className="w-12"
            max={unresolved}
            min={returns}
            title={formsText('resolvedAmount')}
            value={resolve}
            onValueChange={(resolve): void =>
              handleChange({
                // Make resolve <= unresolved
                resolve: Math.min(resolve, unresolved),
                // Make returned <= resolved
                returns: Math.min(resolve, returns),
                unresolved,
                remarks,
              })
            }
          />
        </td>
        <td>
          {resolve > 0 && (
            <Button.Icon
              aria-pressed={showRemarks}
              className="return-remark w-full"
              icon="annotation"
              title={formsText('remarks')}
              onClick={handleToggle}
            />
          )}
        </td>
      </tr>
      {showRemarks && resolve > 0 ? (
        <tr>
          <td />
          <td className="col-span-7">
            <AutoGrowTextArea
              aria-label={formsText('remarks')}
              containerClassName="w-full"
              forwardRef={(target): void => target?.focus()}
              placeholder={formsText('remarks')}
              title={formsText('remarks')}
              value={remarks}
              // Focus the input when toggled
              onValueChange={(remarks): void =>
                handleChange({
                  resolve,
                  returns,
                  unresolved,
                  remarks,
                })
              }
            />
          </td>
        </tr>
      ) : undefined}
    </>
  );
  // Hide show remarks field here
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
  const [state, setState] = React.useState<RA<RowState>>(() =>
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
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Button.Blue
            disabled={!canSelectAll}
            title={formsText('returnAllPreparations')}
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
            {formsText('selectAll')}
          </Button.Blue>
          <Button.Blue
            disabled={!canDeselect}
            title={commonText('clearAll')}
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
            {formsText('deselectAll')}
          </Button.Blue>
          <Submit.Green
            form={id('form')}
            title={formsText('returnSelectedPreparations')}
          >
            {commonText('apply')}
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
        <RenderForm
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
                  defined(
                    schema.models.CollectionObject.getField('catalogNumber')
                  ).label
                }
              </th>
              <th className="text-center" scope="col">
                {defined(schema.models.Determination.getField('taxon')).label}
              </th>
              <th className="text-center" scope="col">
                {defined(schema.models.Preparation.getField('prepType')).label}
              </th>
              <th className="text-center" scope="col">
                {formsText('unresolved')}
              </th>
              <th className="text-center" scope="col">
                {formsText('return')}
              </th>
              <th className="col-span-2 text-center" scope="col">
                {formsText('resolve')}
              </th>
            </tr>
          </thead>
          <tbody>
            {preparations.map((preparation, index) => (
              <Row
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
        buttons={commonText('close')}
        header={schema.models.LoanPreparation.label}
        onClose={handleClose}
      >
        {formsText('noUnresolvedPreparations')}
      </Dialog>
    ) : (
      <PreparationReturn preparations={preparations} onClose={handleClose} />
    )
  ) : null;
}
