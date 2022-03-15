import React from 'react';

import type {
  Loan,
  LoanPreparation,
  LoanReturnPreparation,
} from '../datamodel';
import { getDateInputValue } from '../dayjs';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { ViewDescription } from '../parseform';
import { schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import * as s from '../stringlocalization';
import type { RA } from '../types';
import { defined } from '../types';
import { fieldFormat } from '../uiparse';
import { userInformation } from '../userinfo';
import { Button, Input } from './basic';
import { useAsyncState } from './hooks';
import { Dialog, LoadingScreen } from './modaldialog';
import { RenderForm } from './specifyform';

function formatCatNo(catNo: string): string {
  const field = schema.models.CollectionObject.getLiteralField('catalognumber');
  return typeof field === 'string' ? fieldFormat(field, undefined, catNo) : '';
}

const localize = <T extends string | undefined>(key: string, fallback?: T): T =>
  s.localizeFrom('resources', key, fallback) as T;

const metaDataFormDefinition: ViewDescription = {
  columns: Array.from<undefined>({ length: 4 }).fill(undefined),
  rows: [
    [
      {
        id: undefined,
        colSpan: undefined,
        type: 'Label',
        text: '',
        labelForCellId: 1,
      },
      {
        id: 1,
        colSpan: undefined,
        type: 'Field',
        fieldName: 'receivedBy',
        isRequired: true,
        fieldDefinition: {
          isReadOnly: false,
          type: 'QueryComboBox',
          hasCloneButton: false,
          typeSearch: 'Agent',
        },
      },
      {
        id: undefined,
        colSpan: undefined,
        type: 'Label',
        text: '',
        labelForCellId: 2,
      },
      {
        id: 2,
        colSpan: undefined,
        type: 'Field',
        fieldName: 'returnedDate',
        isRequired: true,
        fieldDefinition: {
          isReadOnly: false,
          type: 'Text',
          defaultValue: undefined,
          min: undefined,
          max: undefined,
          step: undefined,
        },
      },
    ],
    [
      {
        id: undefined,
        colSpan: 4,
        type: 'Separator',
        label: undefined,
      },
    ],
  ],
  formType: 'form',
  mode: 'edit',
  model: schema.models.LoanReturnPreparation as SpecifyModel,
};

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
                ...(await loanPreparation
                  .rgetPromise('collectionObject', true)
                  .then<{
                    readonly catalogNumber: string;
                    readonly taxon: string;
                  }>(async (collectionObject) => ({
                    catalogNumber: formatCatNo(
                      collectionObject.get('catalogNumber')
                    ),
                    taxon: await collectionObject
                      .rgetCollection('determinations')
                      .then(({ models }) =>
                        models
                          .find((determination) =>
                            determination.get('isCurrent')
                          )
                          ?.rgetPromise('preferredTaxon', true)
                      )
                      .then((taxon) => taxon?.get('fullName') ?? ''),
                  }))),
                prepType: await loanPreparation
                  .rgetPromise('prepType', true)
                  .then((prepType) => prepType.get('name')),
              }
        ),
      [preparation]
    )
  );

  const [showRemarks, setShowRemarks] = React.useState(false);

  return (
    <>
      <tr>
        <td>
          <Input.Checkbox
            title={formsText('selectAll')}
            aria-label={formsText('selectAll')}
            checked={resolve > 0}
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
        <td className="text-center">${unresolved}</td>
        <td>
          <Input.Number
            value={returns}
            min={0}
            max={unresolved}
            className="w-12"
            title={formsText('returnedAmount')}
            aria-label={formsText('returnedAmount')}
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
            value={resolve}
            min={returns}
            max={unresolved}
            className="w-12"
            title={formsText('resolvedAmount')}
            aria-label={formsText('resolvedAmount')}
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
              className="return-remark hidden w-full"
              title={formsText('remarks')}
              aria-label={formsText('remarks')}
              icon="annotation"
              onClick={(): void => setShowRemarks(!showRemarks)}
            />
          )}
        </td>
      </tr>
      {showRemarks && resolve > 0 ? (
        <tr>
          <td />
          <td colSpan={6}>
            <Input.Text
              placeholder={formsText('remarks')}
              title={formsText('remarks')}
              aria-label={formsText('remarks')}
              value={remarks}
              onValueChange={(remarks): void =>
                handleChange({
                  resolve,
                  returns,
                  unresolved,
                  remarks,
                })
              }
              // Focus the input when toggled
              forwardRef={(target): void => target?.focus()}
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
  return (
    <Dialog
      header={schema.models.LoanPreparation.label}
      onClose={handleClose}
      buttons={
        <>
          <Button.Blue
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
            title={formsText('returnAllPreparations')}
          >
            {localize('SELECTALL')}
          </Button.Blue>
          <Button.Blue
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
            title={commonText('clearAll')}
          >
            {localize('DESELECTALL')}
          </Button.Blue>
          <Button.Green
            onClick={(): void => {
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

                  if (
                    typeof preparation.dependentResources
                      .loanreturnpreparations === 'object'
                  ) {
                    (
                      preparation.dependentResources.loanreturnpreparations
                        .models as SpecifyResource<LoanReturnPreparation>[]
                    ).push(loanReturn);
                    // @ts-expect-error Manually changing collection
                    preparation.dependentResources.loanreturnpreparations.length += 1;
                    preparation.dependentResources.loanreturnpreparations.trigger(
                      'add'
                    );
                  }
                });
              handleClose();
            }}
            title={formsText('returnSelectedPreparations')}
          >
            {commonText('apply')}
          </Button.Green>
        </>
      }
    >
      <RenderForm
        resource={loanReturnPreparation.current}
        viewDefinition={metaDataFormDefinition}
        hasHeader={false}
      />
      <table>
        <thead>
          <tr>
            <td />
            <th scope="col" className="text-center">
              {
                defined(
                  schema.models.CollectionObject.getField('catalogNumber')
                ).label
              }
            </th>
            <th scope="col" className="text-center">
              {defined(schema.models.Determination.getField('taxon')).label}
            </th>
            <th scope="col" className="text-center">
              {defined(schema.models.Preparation.getField('prepType')).label}
            </th>
            <th scope="col" className="text-center">
              {formsText('unresolved')}
            </th>
            <th scope="col" className="text-center">
              {formsText('return')}
            </th>
            <th scope="col" className="text-center" colSpan={2}>
              {formsText('resolve')}
            </th>
          </tr>
        </thead>
        <tbody>
          {preparations.map((preparation, index) => (
            <Row
              preparation={preparation}
              key={preparation.cid}
              {...state[index]}
              onChange={(newState): void =>
                setState([
                  ...state.slice(0, index),
                  newState,
                  ...state.slice(index + 1),
                ])
              }
            />
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}

export function LoanReturn({
  resource,
  onClose: handleClose,
}: {
  readonly resource: SpecifyResource<Loan>;
  readonly onClose: () => void;
}): JSX.Element {
  const [preparations] = useAsyncState(
    React.useCallback(
      async () =>
        resource
          .rgetCollection('loanPreparations', true)
          .then(({ models }) =>
            models.filter(
              (preparation) =>
                (preparation.get('quantity') ?? 0) >
                (preparation.get('quantityResolved') ?? 0)
            )
          ),
      [resource]
    )
  );

  return Array.isArray(preparations) ? (
    preparations.length === 0 ? (
      <Dialog
        header={schema.models.LoanPreparation.label}
        onClose={handleClose}
        buttons={commonText('close')}
      >
        {formsText('noUnresolvedPreparations')}
      </Dialog>
    ) : (
      <PreparationReturn preparations={preparations} onClose={handleClose} />
    )
  ) : (
    <LoadingScreen />
  );
}
