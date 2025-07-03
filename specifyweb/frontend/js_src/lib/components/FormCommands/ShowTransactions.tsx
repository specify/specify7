import React from 'react';

import { useMultipleAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import type { RA, RR } from '../../utils/types';
import { H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { formatNumber } from '../Atoms/Internationalization';
import type { CollectionFetchFilters } from '../DataModel/collection';
import { fetchCollection } from '../DataModel/collection';
import { backendFilter, formatRelationshipPath } from '../DataModel/helpers';
import type {
  AnyInteractionPreparation,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type { Preparation, Tables } from '../DataModel/types';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import type { InteractionWithPreps } from '../Interactions/helpers';
import {
  interactionPrepTables,
  interactionsWithPrepTables,
} from '../Interactions/helpers';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission } from '../Permissions/helpers';

export function ShowLoansCommand({
  preparation,
  onClose: handleClose,
}: {
  readonly preparation: SpecifyResource<Preparation>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const accessibleInteractionTables = React.useMemo(
    () =>
      interactionsWithPrepTables.filter((interactionTable) =>
        hasTablePermission(interactionTable, 'read')
      ),
    []
  );

  const [relatedInteractions] = useMultipleAsyncState<
    RR<InteractionWithPreps['tableName'], RA<number>>
  >(
    React.useMemo(
      () =>
        Object.fromEntries(
          accessibleInteractionTables.map((interactionTable) => [
            interactionTable,
            () =>
              fetchRelatedInterations(preparation, interactionTable).then(
                (records) => records.map(({ id }) => id)
              ),
          ])
        ),
      [preparation, accessibleInteractionTables]
    ),
    false
  );

  return (
    <Dialog
      buttons={commonText.close()}
      header={interactionsText.interactions()}
      icon={icons.chat}
      modal={false}
      onClose={handleClose}
    >
      {relatedInteractions === undefined
        ? commonText.loading()
        : accessibleInteractionTables.length ===
              Object.keys(relatedInteractions).length &&
            Object.values(relatedInteractions).every(
              (relatedIds) =>
                Array.isArray(relatedIds) && relatedIds.length === 0
            )
          ? interactionsText.noInteractions({
              preparationTable: tables.Preparation.label,
            })
          : accessibleInteractionTables
              .map(
                (interactionTable) =>
                  [
                    interactionTable,
                    relatedInteractions[interactionTable],
                  ] as const
              )
              .map(([interactionTable, relatedIds], index) => (
                <InterationWithPreps
                  key={index}
                  tableName={interactionTable}
                  relatedInteractionIds={relatedIds}
                />
              ))}
    </Dialog>
  );
}
function InterationWithPreps({
  tableName,
  relatedInteractionIds,
}: {
  readonly tableName: InteractionWithPreps['tableName'];
  readonly relatedInteractionIds: RA<number> | undefined;
}): JSX.Element | null {
  const [isOpen, handleOpen, handleClose, _] = useBooleanState(false);

  return (
    <>
      {relatedInteractionIds === undefined ? (
        <>
          <H3>
            <div className="flex">
              <TableIcon label name={tables[tableName].name} />
              <span className="p-1" />
              {interactionsText.tableLabelRecords({
                tableLabel: tables[tableName].label,
              })}
            </div>
          </H3>
          {commonText.loading()}
        </>
      ) : relatedInteractionIds.length === 0 ? null : (
        <Button.LikeLink onClick={handleOpen}>
          <div className="flex">
            <TableIcon label name={tables[tableName].name} />
            <span className="p-1" />
            {`${interactionsText.tableLabelRecords({
              tableLabel: tables[tableName].label,
            })} (${formatNumber(relatedInteractionIds.length)})`}
          </div>
        </Button.LikeLink>
      )}
      {isOpen && Array.isArray(relatedInteractionIds) ? (
        <RecordSelectorFromIds
          dialog="nonModal"
          ids={relatedInteractionIds}
          isDependent={false}
          newResource={undefined}
          table={tables[tableName] as SpecifyTable}
          title={undefined}
          onAdd={undefined}
          onClone={undefined}
          onClose={handleClose}
          onDelete={undefined}
          onSaved={(): void => undefined}
          onSlide={undefined}
        />
      ) : null}
    </>
  );
}

async function fetchRelatedInterations<
  INTERACTION_TABLE extends InteractionWithPreps['tableName'],
>(
  preparation: SpecifyResource<Preparation>,
  interactionTable: INTERACTION_TABLE
): Promise<RA<SerializedResource<Tables[INTERACTION_TABLE]>>> {
  const preparationField = tables[interactionTable].relationships.find(
    (relationship) =>
      interactionPrepTables.includes(
        relationship.relatedTable.name as AnyInteractionPreparation['tableName']
      )
  );

  return fetchCollection(interactionTable, {
    ...backendFilter(
      formatRelationshipPath(preparationField!.name, 'preparation')
    ).equals(preparation.get('id')),
    domainFilter: false,
    limit: 0,
  } as CollectionFetchFilters<Tables[INTERACTION_TABLE]>).then(
    ({ records }) => {
      /**
       * If there are multiple InteractionPreparations in an Interaction that
       * reference the same Preparation, remove the duplicated Interaction
       * records from response
       */
      const recordIds: Record<number, true> = {};
      return records.filter(({ id }) => {
        if (recordIds[id]) return false;
        recordIds[id] = true;
        return true;
      });
    }
  );
}
