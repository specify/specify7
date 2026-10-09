import React from 'react';
import { Button } from '../Atoms/Button';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';
import { resourceToStringIdentifier } from './state';
import { RA } from '../../utils/types';
import { format } from '../Formatters/formatters';
import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { useBooleanState } from '../../hooks/useBooleanState';
import { TableIcon } from '../Molecules/TableIcon';
import { getTable, strictGetTable } from '../DataModel/tables';
import { localized } from '../../utils/types';
import {
  DeleteBlockerResource,
  DeleteBlockerTable,
  DeleteBlockerRelationship,
} from './store';
import { Relationship } from '../DataModel/specifyField';

export function DeleteBlockersAside({
  records,
  activeRelationshipKey,
  onRelationshipActive: handleRelationshipActive,
}: {
  readonly records: RA<DeleteBlockerResource>;
  readonly activeRelationshipKey: string | undefined;
  readonly onRelationshipActive: (
    resource: SpecifyResource<AnySchema>,
    relationship: Relationship,
    relationshipKey: string
  ) => void;
}): JSX.Element {
  return (
    <aside className="flex flex-1 flex-col min-h-0 w-full min-w-0 gap-1 overflow-y-auto md:w-1/3 md:flex-none md:pr-3">
      {records.map((record, index) => (
        <BlockerResource
          activeRelationshipKey={activeRelationshipKey}
          record={record}
          key={index}
          onRelationshipActive={handleRelationshipActive}
        />
      ))}
    </aside>
  );
}

function BlockerResource({
  record,
  activeRelationshipKey,
  onRelationshipActive: handleRelationshipActive,
}: {
  readonly record: DeleteBlockerResource;
  readonly activeRelationshipKey: string | undefined;
  readonly onRelationshipActive: (
    resource: SpecifyResource<AnySchema>,
    relationship: Relationship,
    relationshipKey: string
  ) => void;
}): JSX.Element {
  const [formatted] = useAsyncState(
    React.useCallback(() => format(record.resource), [record.resource]),
    false
  );

  const [isOpen, _, __, handleToggleOpen] = useBooleanState(false);

  const resourceLabel =
    formatted === undefined ? commonText.loading() : formatted;

  return (
    <div className="w-full">
      <Button.BorderedGray
        onClick={handleToggleOpen}
        aria-expanded={isOpen}
        className="flex min-h-10 w-full min-w-0 items-center justify-start gap-2 rounded-md border-0 px-2 py-2 text-left"
      >
        <TableIcon name={record.resource.specifyTable.name} label={false} />
        <span className="min-w-0 flex-1 truncate">
          {record.count !== undefined
            ? commonText.countLine({
                resource: resourceLabel,
                count: record.count,
              })
            : // FIXME: Localize this?
              `${resourceLabel} (${commonText.loading()})`}
        </span>
      </Button.BorderedGray>
      {isOpen && (
        <div className="ml-3 flex w-full min-w-0 flex-col gap-1 py-1 pl-2">
          {record.tables.map((blockerTable, index) => (
            <DeleteBlockersTable
              key={`${resourceToStringIdentifier(record.resource)}_${blockerTable.tableName}_${index}`}
              activeRelationshipKey={activeRelationshipKey}
              blockerTable={blockerTable}
              onRelationshipActive={(relationship, relationshipKey) =>
                handleRelationshipActive(
                  record.resource,
                  relationship,
                  relationshipKey
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteBlockersTable({
  blockerTable,
  activeRelationshipKey,
  onRelationshipActive: handleRelationshipActive,
}: {
  readonly blockerTable: DeleteBlockerTable;
  readonly activeRelationshipKey: string | undefined;
  readonly onRelationshipActive: (
    relationship: Relationship,
    relationshipKey: string
  ) => void;
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
      <Button.BorderedGray aria-expanded={isOpen} onClick={handleToggleOpen}>
        <TableIcon name={tableName} label={false} />
        <span>
          {blockerTable.count !== undefined
            ? commonText.countLine({
                resource: localized(tableLabel),
                count: blockerTable.count,
              })
            : // FIXME: Localize this?
              `${localized(tableLabel)} (${commonText.loading()})`}
        </span>
      </Button.BorderedGray>
      {isOpen && (
        <div className="ml-3 flex w-full min-w-0 flex-col gap-1 py-1 pl-2">
          {blockerTable.relationships.map((blockerRel, index) => (
            <DeleteBlockersRelationship
              tableName={tableName}
              key={`${blockerRel.key}_${index}`}
              isActive={blockerRel.key === activeRelationshipKey}
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
  isActive,
  onRelationshipActive: handleRelationshipActive,
}: {
  readonly tableName: string;
  readonly blockerRelationship: DeleteBlockerRelationship;
  readonly isActive: boolean;
  readonly onRelationshipActive: (
    relationship: Relationship,
    relationshipKey: string
  ) => void;
}) {
  const relationship = React.useMemo(() => {
    const table = strictGetTable(tableName);
    const field = table.strictGetRelationship(
      blockerRelationship.relationshipName
    );
    return field;
  }, [tableName, blockerRelationship]);
  return (
    <Button.BorderedGray
      className="flex min-h-9 w-full min-w-0 items-center justify-start text-left"
      aria-pressed={isActive}
      onClick={() => {
        handleRelationshipActive(relationship, blockerRelationship.key);
      }}
    >
      <span className="flex-1 min-w-0 truncate">
        {blockerRelationship.count !== undefined
          ? commonText.countLine({
              resource: relationship.label,
              count: blockerRelationship.count,
            })
          : // FIXME: Localize this?
            `${relationship.label} (${commonText.loading()})`}
      </span>
    </Button.BorderedGray>
  );
}
