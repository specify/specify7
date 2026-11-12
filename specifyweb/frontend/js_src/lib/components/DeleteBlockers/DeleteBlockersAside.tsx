import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Relationship } from '../DataModel/specifyField';
import {
  getTable,
  sortTablesByCaption,
  strictGetTable,
} from '../DataModel/tables';
import { format } from '../Formatters/formatters';
import { TableIcon } from '../Molecules/TableIcon';
import { resourceToStringIdentifier } from './state';
import type {
  DeleteBlockerRelationship,
  DeleteBlockerResource,
  DeleteBlockerTable,
} from './store';

export function DeleteBlockersAside({
  resource,
  records,
  activeRelationshipKey,
  useSmallLayout = false,
  onRelationshipActive: handleRelationshipActive,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly records: RA<DeleteBlockerResource>;
  readonly activeRelationshipKey: string | undefined;
  readonly useSmallLayout?: boolean;
  readonly onRelationshipActive: (
    resource: SpecifyResource<AnySchema>,
    relationship: Relationship,
    relationshipKey: string
  ) => void;
}): JSX.Element {
  return (
    <aside
      className={`flex flex-1 flex-col min-h-0 w-full min-w-0 gap-1 overflow-y-auto ${useSmallLayout ? '' : 'lg:w-1/3 lg:flex-none lg:pr-3'}`}
    >
      {
        /*
         * There's only one "blocking resource" and the blocking resource is
         * the one we're getting blockers for, so skip showing the resource and
         * go straight to blocking resources referencing the resource
         */
        records.length === 1 &&
        resourceToStringIdentifier(resource) ===
          resourceToStringIdentifier(records.at(0)!.resource)
          ? sortTablesByCaption(
              records.at(0)!.tables,
              ({ tableName }) => tableName
            ).map((blockerTable, index) => (
              <DeleteBlockersTable
                activeRelationshipKey={activeRelationshipKey}
                blockerTable={blockerTable}
                key={`${resourceToStringIdentifier(records.at(0)!.resource)}_${blockerTable.tableName}_${index}`}
                onRelationshipActive={(relationship, relationshipKey) =>
                  handleRelationshipActive(
                    records.at(0)!.resource,
                    relationship,
                    relationshipKey
                  )
                }
              />
            ))
          : // In this case, there are at least two blocking references that
            /*
             * Point to different records.
             * This should only be in the case where at least one of the
             * blocking references point to a CASCADE/dependent record that
             * would be deleted when the parent is deleted
             */
            records.map((record, index) => (
              <BlockerResource
                activeRelationshipKey={activeRelationshipKey}
                key={index}
                record={record}
                onRelationshipActive={handleRelationshipActive}
              />
            ))
      }
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
}): JSX.Element | null {
  const [formatted] = useAsyncState(
    React.useCallback(async () => format(record.resource), [record.resource]),
    false
  );

  const [isOpen, _, __, handleToggleOpen] = useBooleanState(false);

  const resourceLabel =
    formatted === undefined ? commonText.loading() : formatted;

  return record.tables.length === 0 ? null : (
    <div className="w-full">
      <Button.BorderedGray
        aria-expanded={isOpen}
        className="flex min-h-10 w-full min-w-0 items-center !justify-start gap-2 rounded-md border-0 px-2 py-2 text-left"
        onClick={handleToggleOpen}
      >
        <TableIcon label={false} name={record.resource.specifyTable.name} />
        <span className="min-w-0 flex-1">
          {record.count === undefined
            ? `${resourceLabel} (${commonText.loading()})`
            : // FIXME: Localize this?
              commonText.countLine({
                resource: resourceLabel,
                count: record.count,
              })}
        </span>
      </Button.BorderedGray>
      {isOpen && (
        <div className="ml-3 flex w-full min-w-0 flex-col gap-1 py-1 pl-2">
          {sortTablesByCaption(record.tables, ({ tableName }) => tableName).map(
            (blockerTable, index) => (
              <DeleteBlockersTable
                activeRelationshipKey={activeRelationshipKey}
                blockerTable={blockerTable}
                key={`${resourceToStringIdentifier(record.resource)}_${blockerTable.tableName}_${index}`}
                onRelationshipActive={(relationship, relationshipKey) =>
                  handleRelationshipActive(
                    record.resource,
                    relationship,
                    relationshipKey
                  )
                }
              />
            )
          )}
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
  return blockerTable.count === 0 ? null : (
    <>
      <Button.BorderedGray
        aria-expanded={isOpen}
        className="flex min-h-10 w-full min-w-0 items-center !justify-start gap-2 text-left"
        // BUG:? It might not make sense to mark this as both expanded and
        // pressed. Semantically, it's probably better to keep this as
        // expanded and add a tailwind class to show the button is
        // selected/expanded
        aria-pressed={isOpen}
        onClick={handleToggleOpen}
      >
        <TableIcon label={false} name={tableName} />
        <span>
          {blockerTable.count === undefined
            ? `${localized(tableLabel)} (${commonText.loading()})`
            : // FIXME: Localize this?
              commonText.countLine({
                resource: localized(tableLabel),
                count: blockerTable.count,
              })}
        </span>
      </Button.BorderedGray>
      {isOpen && (
        <div className="ml-3 flex w-full min-w-0 flex-col gap-1 py-1 pl-2">
          {blockerTable.relationships.map((blockerRel, index) => (
            <DeleteBlockersRelationship
              blockerRelationship={blockerRel}
              isActive={blockerRel.key === activeRelationshipKey}
              key={`${blockerRel.key}_${index}`}
              tableName={tableName}
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
      aria-pressed={isActive}
      className="flex min-h-9 w-full min-w-0 items-center !justify-start text-left"
      onClick={() => {
        handleRelationshipActive(relationship, blockerRelationship.key);
      }}
    >
      <span className="flex-1 min-w-0">
        {blockerRelationship.count === undefined
          ? `${relationship.label} (${commonText.loading()})`
          : // FIXME: Localize this?
            commonText.countLine({
              resource: relationship.label,
              count: blockerRelationship.count,
            })}
      </span>
    </Button.BorderedGray>
  );
}
