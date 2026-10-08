import React from 'react';
import { Button } from '../Atoms/Button';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';
import { useDeleteBlockersForResource } from './Context';
import { resourceToStringIdentifier } from './state';
import { RA } from '../../utils/types';
import { format } from '../Formatters/formatters';
import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { useBooleanState } from '../../hooks/useBooleanState';
import { TableIcon } from '../Molecules/TableIcon';
import { getTable, strictGetTable } from '../DataModel/tables';
import {
  DeleteBlockerResource,
  DeleteBlockerTable,
  DeleteBlockerRelationship,
} from './store';

export function NewDeleteBlockers({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}) {
  const records = useDeleteBlockersForResource(resource);

  const [paginatorKey, setPaginatorKey] = React.useState(records?.at(0)?.key);

  return records === undefined ? null : (
    <div className="relative flex flex-1 gap-4 overflow-hidden md:flex-row">
      <DeleteBlockersAside
        records={records}
        onRelationshipActive={setPaginatorKey}
      />
      <div className="ml-2">
        {paginatorKey !== undefined && (
          <DeleteBlockersPaginator parentResource={resource} />
        )}
      </div>
    </div>
  );
}

function DeleteBlockersAside({
  records,
  onRelationshipActive: handleRelationshipActive,
}: {
  readonly records: RA<DeleteBlockerResource>;
  readonly onRelationshipActive: (paginatorKey: string) => void;
}): JSX.Element {
  return (
    <aside
      className="left-0 hidden min-w-fit flex-1 flex-col divide-y-4
        divide-[color:var(--form-background)] overflow-y-auto md:flex"
    >
      {records.map((record) => (
        <BlockerResource
          record={record}
          onRelationshipActive={handleRelationshipActive}
        />
      ))}
    </aside>
  );
}

function BlockerResource({
  record,
  onRelationshipActive: handleRelationshipActive,
}: {
  readonly record: DeleteBlockerResource;
  readonly onRelationshipActive: (paginatorKey: string) => void;
}): JSX.Element {
  const [formatted] = useAsyncState(
    React.useCallback(() => format(record.resource), [record.resource]),
    false
  );

  const [isOpen, _, __, handleToggleOpen] = useBooleanState(false);

  return (
    <div className="w-full">
      <Button.BorderedGray
        onClick={handleToggleOpen}
        key={resourceToStringIdentifier(record.resource)}
        aria-pressed={isOpen}
      >
        <TableIcon name={record.resource.specifyTable.name} label={false} />
        <span>
          {formatted === undefined ? commonText.loading() : formatted}
        </span>
      </Button.BorderedGray>
      {isOpen && (
        <div className="flex flex-col ml-2 w-fit py-2 gap-1">
          {record.tables.map((blockerTable) => (
            <DeleteBlockersTable
              blockerTable={blockerTable}
              onRelationshipActive={handleRelationshipActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteBlockersTable({
  blockerTable,
  onRelationshipActive: handleRelationshipActive,
}: {
  readonly blockerTable: DeleteBlockerTable;
  readonly onRelationshipActive: (paginatorKey: string) => void;
}) {
  const [tableName, tableLabel] = React.useMemo(() => {
    const table = getTable(blockerTable.tableName);
    const tableName = table?.name ?? blockerTable.tableName;
    const tableLabel = table?.label ?? blockerTable.tableName;
    return [tableName, tableLabel];
  }, [blockerTable]);

  const [isOpen, _, __, handleToggleOpen] = useBooleanState(false);
  return (
    <>
      <Button.BorderedGray aria-pressed={isOpen} onClick={handleToggleOpen}>
        <TableIcon name={tableName} label={false} />
        {tableLabel}
      </Button.BorderedGray>
      {isOpen && (
        <div className="flex flex-col ml-2 w-fit py-2 gap-1">
          {blockerTable.relationships.map((blockerRel) => (
            <DeleteBlockersRelationship
              tableName={tableName}
              blockerRelationship={blockerRel}
              onRelationshipActive={handleRelationshipActive}
            />
          ))}
        </div>
      )}
    </>
  );
}

function DeleteBlockersRelationship({
  tableName,
  blockerRelationship,
  onRelationshipActive: handleRelationshipActive,
}: {
  readonly tableName: string;
  readonly blockerRelationship: DeleteBlockerRelationship;
  readonly onRelationshipActive: (paginatorKey: string) => void;
}) {
  const relationship = React.useMemo(() => {
    const table = strictGetTable(tableName);
    const field = table.strictGetField(blockerRelationship.relationshipName);
    return field;
  }, [tableName, blockerRelationship]);
  return (
    <Button.BorderedGray
      onClick={() => {
        handleRelationshipActive(blockerRelationship.key);
      }}
    >
      {relationship.label}
    </Button.BorderedGray>
  );
}

function DeleteBlockersPaginator({
  parentResource,
}: {
  readonly parentResource: SpecifyResource<AnySchema>;
}): JSX.Element {}
