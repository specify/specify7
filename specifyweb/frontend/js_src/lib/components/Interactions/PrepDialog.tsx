import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useId } from '../../hooks/useId';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import type { RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { group } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { ReadOnlyContext } from '../Core/Contexts';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { getField, toTable } from '../DataModel/helpers';
import type { AnyInteractionPreparation } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceApiUrl, getResourceViewUrl } from '../DataModel/resource';
import { serializeResource } from '../DataModel/serializers';
import type { Collection, SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type { ExchangeOut, ExchangeOutPrep } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import type { InteractionWithPreps, PreparationData } from './helpers';
import { interactionPrepTables } from './helpers';
import { PrepDialogRow } from './PrepDialogRow';

export function PrepDialog({
  onClose: handleClose,
  preparations: rawPreparations,
  table,
  itemCollection,
}: {
  readonly onClose: () => void;
  readonly preparations: RA<PreparationData>;
  readonly table: SpecifyTable<InteractionWithPreps>;
  readonly itemCollection?: Collection<AnyInteractionPreparation>;
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

  // Change to use an object for selected state allowing null values
  const [selected, setSelected] = useLiveState<{
    [key: string]: number | null;
  }>(
    React.useCallback(() => {
      return preparations.reduce<R<number | null>>((acc, preparation) => {
        acc[preparation.preparationId] = null;
        return acc;
      }, {});
        acc[preparation.preparationId] = null;
        return acc;
      }, {} as { [key: string]: number | null });
    }, [preparations])
  );

  const canDeselect = Object.values(selected).some((value) => value > 0);
  const canSelectAll = Object.values(selected).some(
    (value, index) => value < preparations[index].available
  );

  const id = useId('prep-dialog');
  const navigate = useNavigate();

  // BUG: make this readOnly if don't have necessary permissions
  const isReadOnly = React.useContext(ReadOnlyContext);

  const [bulkValue, setBulkValue] = React.useState<number | null>(null); // Allow bulkValue to be null
  const maxPrep = Math.max(...preparations.map(({ available }) => available));

  const [sortConfig, handleSort, applySortConfig] = useSortConfig(
    'preparations',
    'catalogNumber',
    false
  );

  const sortedPreparations = applySortConfig(
    preparations,
    ({ catalogNumber, taxon, prepType, available, unavailable }) =>
      sortConfig.sortField === 'catalogNumber'
        ? catalogNumber
        : sortConfig.sortField === 'taxon'
        ? taxon
        : sortConfig.sortField === 'prepType'
        ? prepType
        : sortConfig.sortField === 'available'
        ? available
        : unavailable
  );

  // Handle selection change
  const handleSelectChange = (preparationId: string, newSelected: number | null): void => {
    setSelected((prev) => ({
      ...prev,
      [preparationId]: newSelected,
    }));
  };

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
                setSelected((prev) => {
                  const newSelected = { ...prev };
                  sortedPreparations.forEach((prep) => {
                    newSelected[prep.preparationId] = prep.available;
                  });
                  return newSelected;
                })
              }
            >
              {interactionsText.selectAll()}
            </Button.Info>
            <Button.Info
              disabled={!canDeselect}
              title={commonText.clearAll()}
              onClick={(): void => setSelected((prev) => {
                const newSelected = { ...prev };
                Object.keys(newSelected).forEach((key) => {
                  newSelected[key] = null;
                });
                return newSelected;
              })}
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
          value={bulkValue || 0}
          onValueChange={(newCount): void => {
            if (newCount === '') {
              setBulkValue(0);
              setSelected((prev) => {
                const newSelected = { ...prev };
                sortedPreparations.forEach((prep) => {
                  newSelected[prep.preparationId] = null;
                });
                return newSelected;
              });
            } else {
              const count = newCount;
              setBulkValue(count);
              setSelected((prev) => {
                const newSelected = { ...prev };
                sortedPreparations.forEach((prep) => {
                  newSelected[prep.preparationId] = count === 0 ? 0 : Math.min(prep.available, count);
                });
                return newSelected;
              });
            }
          }}
        />
      </Label.Inline>
      <Form
        id={id('form')}
        onSubmit={(): void => {
          const itemTable = defined(
            table.relationships.find((relationship) =>
              interactionPrepTables.includes(
                (
                  relationship.relatedTable as SpecifyTable<AnyInteractionPreparation>
                ).name
              )
            )?.relatedTable
          ) as SpecifyTable<AnyInteractionPreparation>;

          const items = filterArray(
            preparations.map((preparation) => {
              const selectedQuantity = selected[preparation.preparationId];
              if (selectedQuantity === null || selectedQuantity === 0) return undefined;
              const result = new itemTable.Resource();
              result.set(
                'preparation',
                getResourceApiUrl('Preparation', preparation.preparationId)
              );
              result.set('quantity', selectedQuantity);
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
            setPreparationItems(interaction, items);

            const loan = toTable(interaction, 'Loan');
            loan?.set('isClosed', false);
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
                <Button.LikeLink onClick={(): void => handleSort('catalogNumber')}>
                  {getField(tables.CollectionObject, 'catalogNumber').label}
                  <SortIndicator fieldName="catalogNumber" sortConfig={sortConfig} />
                </Button.LikeLink>
              </th>
              <th scope="col">
                <Button.LikeLink onClick={(): void => handleSort('taxon')}>
                  {getField(tables.Determination, 'taxon').label}
                  <SortIndicator fieldName="taxon" sortConfig={sortConfig} />
                </Button.LikeLink>
              </th>
              <th scope="col">
                <Button.LikeLink onClick={(): void => handleSort('prepType')}>
                  {getField(tables.Preparation, 'prepType').label}
                  <SortIndicator fieldName="prepType" sortConfig={sortConfig} />
                </Button.LikeLink>
              </th>
              <th scope="col">{commonText.selected()}</th>
              <th scope="col">
                <Button.LikeLink onClick={(): void => handleSort('available')}>
                  {interactionsText.available()}
                  <SortIndicator fieldName="available" sortConfig={sortConfig} />
                </Button.LikeLink>
              </th>
              <th scope="col">
                <Button.LikeLink onClick={(): void => handleSort('unavailable')}>
                  {interactionsText.unavailable()}
                  <SortIndicator fieldName="unavailable" sortConfig={sortConfig} />
                </Button.LikeLink>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPreparations.map((preparation) => (
              <PrepDialogRow
                key={preparation.preparationId}
                preparation={preparation}
                selected={selected[preparation.preparationId] === null ? 0 : selected[preparation.preparationId]}
                onChange={(newSelected): void => handleSelectChange(preparation.preparationId, newSelected)}
              />
            ))}
          </tbody>
        </table>
      </Form>
    </Dialog>
  );
}

function setPreparationItems(
  interaction: SpecifyResource<InteractionWithPreps>,
  items: RA<SpecifyResource<AnyInteractionPreparation>>
): void {
  const preparationRelationship = defined(
    interaction.specifyTable.relationships.find((relationship) =>
      interactionPrepTables.includes(
        (relationship.relatedTable as SpecifyTable<AnyInteractionPreparation>)
          .name
      )
    )
  );

  // Typecast as a single case because the relationships do not exist in the union type.
  (interaction as SpecifyResource<ExchangeOut>).set(
    preparationRelationship.name as 'exchangeOutPreps',
    items as RA<SpecifyResource<ExchangeOutPrep>>
  );
}
