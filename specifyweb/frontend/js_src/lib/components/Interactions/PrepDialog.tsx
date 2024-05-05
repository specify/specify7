import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useId } from '../../hooks/useId';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { group, replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { ReadOnlyContext } from '../Core/Contexts';
import { getField, toTable } from '../DataModel/helpers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceApiUrl, getResourceViewUrl } from '../DataModel/resource';
import { serializeResource } from '../DataModel/serializers';
import type { Collection, SpecifyTable } from '../DataModel/specifyTable';
import { strictGetTable, tables } from '../DataModel/tables';
import type {
  Disposal,
  DisposalPreparation,
  Gift,
  GiftPreparation,
  Loan,
  LoanPreparation,
} from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import type { PreparationData } from './helpers';
import { PrepDialogRow } from './PrepDialogRow';

export function PrepDialog({
  onClose: handleClose,
  preparations: rawPreparations,
  table,
  itemCollection,
}: {
  readonly onClose: () => void;
  readonly preparations: RA<PreparationData>;
  readonly table: SpecifyTable<Disposal | Gift | Loan>;
  readonly itemCollection?: Collection<
    DisposalPreparation | GiftPreparation | LoanPreparation
  >;
}): JSX.Element {
  const preparations = React.useMemo(() => {
    if (itemCollection === undefined) return rawPreparations;
    const mutatedPreparations = rawPreparations.map((item) =>
      Object.fromEntries(Object.entries(item))
    );
    const indexedPreparations = Object.fromEntries(
      group(
        mutatedPreparations.map((preparation) => [
          getResourceApiUrl('Preparation', preparation.preparationId),
          preparation,
        ])
      )
    );
    itemCollection.models.forEach((preparation) => {
      if (!preparation.isNew()) return;
      const preparationUrl = preparation.get('preparation') ?? '';
      const indexed = indexedPreparations[preparationUrl];
      if (indexed === undefined) return;
      const loanPreparation = toTable(preparation, 'LoanPreparation');
      if (loanPreparation === undefined) return;
      const resolved = loanPreparation.get('quantityResolved') ?? 0;
      // @ts-expect-error REFACTOR: make this algorithm immutable
      indexed[0].available -= loanPreparation.get('quantity') - resolved;
    });
    return mutatedPreparations as RA<PreparationData>;
  }, [rawPreparations, itemCollection]);

  const [selected, setSelected] = useLiveState<RA<number>>(
    React.useCallback(
      () => Array.from({ length: preparations.length }).fill(0),
      [preparations.length]
    )
  );
  const canDeselect = selected.some((value) => value > 0);
  const canSelectAll = selected.some(
    (value, index) => value < preparations[index].available
  );

  const id = useId('prep-dialog');
  const navigate = useNavigate();

  // BUG: make this readOnly if don't have necessary permissions
  const isReadOnly = React.useContext(ReadOnlyContext);

  const [bulkValue, setBulkValue] = React.useState(0);
  const maxPrep = Math.max(...preparations.map(({ available }) => available));

  return (
    <Dialog
      buttons={
        isReadOnly ? (
          commonText.close()
        ) : (
          <>
            <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
            <Button.Info
              disabled={!canSelectAll}
              title={interactionsText.selectAllAvailablePreparations()}
              onClick={(): void =>
                setSelected(preparations.map(({ available }) => available))
              }
            >
              {interactionsText.selectAll()}
            </Button.Info>
            <Button.Info
              disabled={!canDeselect}
              title={commonText.clearAll()}
              onClick={(): void => setSelected(Array.from(selected).fill(0))}
            >
              {interactionsText.deselectAll()}
            </Button.Info>
            <Submit.Success
              form={id('form')}
              title={
                typeof itemCollection === 'object'
                  ? interactionsText.addItems()
                  : interactionsText.createRecord({
                      table: table.label,
                    })
              }
            >
              {commonText.apply()}
            </Submit.Success>
          </>
        )
      }
      header={interactionsText.preparations()}
      onClose={handleClose}
    >
      <Label.Inline className="gap-2">
        {commonText.bulkSelect()}
        <Input.Integer
          aria-label={interactionsText.selectedAmount()}
          className="!w-[unset]"
          max={maxPrep}
          min={0}
          title={interactionsText.selectedAmount()}
          value={bulkValue}
          onValueChange={(newCount): void => {
            setBulkValue(newCount);
            setSelected(
              preparations.map(({ available }) => Math.min(available, newCount))
            );
          }}
        />
      </Label.Inline>
      <Form
        id={id('form')}
        onSubmit={(): void => {
          const itemTable = strictGetTable(
            `${table.name}Preparation`
          ) as SpecifyTable<
            DisposalPreparation | GiftPreparation | LoanPreparation
          >;
          const items = filterArray(
            preparations.map((preparation, index) => {
              if (selected[index] === 0) return undefined;
              const result = new itemTable.Resource();
              result.set(
                'preparation',
                getResourceApiUrl('Preparation', preparation.preparationId)
              );
              result.set('quantity', selected[index]);
              const loanPreparation = toTable(result, 'LoanPreparation');
              loanPreparation?.set('quantityReturned', 0);
              loanPreparation?.set('quantityResolved', 0);
              return result;
            })
          );

          if (typeof itemCollection === 'object') {
            itemCollection.add(items);
            handleClose();
          } else {
            const interaction = new table.Resource();
            const loan = toTable(interaction, 'Loan');
            loan?.set(
              'loanPreparations',
              items as RA<SpecifyResource<LoanPreparation>>
            );
            loan?.set('isClosed', false);
            toTable(interaction, 'Gift')?.set(
              'giftPreparations',
              items as RA<SpecifyResource<GiftPreparation>>
            );
            toTable(interaction, 'Disposal')?.set(
              'disposalPreparations',
              items as RA<SpecifyResource<DisposalPreparation>>
            );
            navigate(getResourceViewUrl(table.name, undefined), {
              state: {
                type: 'RecordSet',
                resource: serializeResource(interaction),
              },
            });
          }
        }}
      >
        <table className="grid-table grid-cols-[min-content_repeat(6,auto)] gap-2">
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">{interactionsText.selectAll()}</span>
              </th>
              <th scope="col">
                {getField(tables.CollectionObject, 'catalogNumber').label}
              </th>
              <th scope="col">
                {getField(tables.Determination, 'taxon').label}
              </th>
              <th scope="col">
                {getField(tables.Preparation, 'prepType').label}
              </th>
              <th scope="col">{commonText.selected()}</th>
              <th scope="col">{interactionsText.available()}</th>
              <th scope="col">{interactionsText.unavailable()}</th>
            </tr>
          </thead>
          <tbody>
            {preparations.map((preparation, index) => (
              <PrepDialogRow
                key={index}
                preparation={preparation}
                selected={selected[index]}
                onChange={(newSelected): void =>
                  setSelected(replaceItem(selected, index, newSelected))
                }
              />
            ))}
          </tbody>
        </table>
      </Form>
    </Dialog>
  );
}
