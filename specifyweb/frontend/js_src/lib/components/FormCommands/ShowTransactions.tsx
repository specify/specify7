import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import type { RA } from '../../utils/types';
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
  return (
    <Dialog
      buttons={commonText.close()}
      header={interactionsText.interactions()}
      icon={icons.chat}
      modal={false}
      onClose={handleClose}
    >
      {interactionsWithPrepTables
        .filter((interactionTable) =>
          hasTablePermission(interactionTable, 'read')
        )
        .map((interactionTable) => (
          <InterationWithPreps
            preparation={preparation}
            tableName={interactionTable}
          />
        ))}
    </Dialog>
  );
}
function InterationWithPreps({
  preparation,
  tableName,
}: {
  readonly preparation: SpecifyResource<Preparation>;
  readonly tableName: InteractionWithPreps['tableName'];
}): JSX.Element | null {
  const [isOpen, handleOpen, handleClose, _] = useBooleanState(false);

  const [relatedInteractionIds] = useAsyncState(
    React.useCallback(
      async () =>
        fetchRelatedInterations(preparation, tableName).then((records) =>
          records.map(({ id }) => id)
        ),
      [preparation, tableName]
    ),
    false
  );

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
    ({ records }) => records
  );
}
