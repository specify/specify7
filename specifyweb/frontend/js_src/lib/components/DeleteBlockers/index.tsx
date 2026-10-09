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
import { RecordSelectorFromPage } from '../FormSliders/RecordSelectorFromPage';
import { f } from '../../utils/functools';
import { Relationship } from '../DataModel/specifyField';
import { useDeleteBlockersForResource } from './useDeleteBlockersForResource';
import { useDeleteBlockerPages } from './useDeleteBlockerPages';

export function NewDeleteBlockers({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}) {
  const records = useDeleteBlockersForResource(resource);

  const [paginatorKey, setPaginatorKey] = React.useState<
    | undefined
    | {
        readonly resource: SpecifyResource<AnySchema>;
        readonly relationship: Relationship;
      }
  >(undefined);

  return records === undefined ? null : (
    <div className="relative flex flex-1 gap-4 overflow-hidden md:flex-row">
      <DeleteBlockersAside
        records={records}
        onRelationshipActive={(resource, relationship) =>
          setPaginatorKey(() => ({
            resource,
            relationship,
          }))
        }
      />
      <div className="ml-2">
        {paginatorKey !== undefined && (
          <DeleteBlockersPaginator
            parentResource={paginatorKey.resource}
            relationship={paginatorKey.relationship}
          />
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
  readonly onRelationshipActive: (
    resource: SpecifyResource<AnySchema>,
    relationship: Relationship
  ) => void;
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
  readonly onRelationshipActive: (
    resource: SpecifyResource<AnySchema>,
    relationship: Relationship
  ) => void;
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
              onRelationshipActive={(relationship) =>
                handleRelationshipActive(record.resource, relationship)
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
  onRelationshipActive: handleRelationshipActive,
}: {
  readonly blockerTable: DeleteBlockerTable;
  readonly onRelationshipActive: (relationship: Relationship) => void;
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
        {localized(tableLabel)}
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
  readonly onRelationshipActive: (relationship: Relationship) => void;
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
      onClick={() => {
        handleRelationshipActive(relationship);
      }}
    >
      {relationship.label}
    </Button.BorderedGray>
  );
}

function DeleteBlockersPaginator({
  parentResource,
  relationship,
}: {
  readonly parentResource: SpecifyResource<AnySchema>;
  readonly relationship: Relationship;
}): JSX.Element {
  const {
    page,
    pageMetaData,
    pageSize,
    onNextPageFetch: handleNextPageFetch,
  } = useDeleteBlockerPages(parentResource, relationship);

  return (
    <RecordSelectorFromPage
      page={page}
      pageSize={pageSize}
      pageMetaData={pageMetaData}
      dialog={false}
      table={relationship.table}
      title={undefined}
      onNextPageFetch={handleNextPageFetch}
      onClose={f.void}
      onDelete={f.void}
      onSaved={f.void}
    />
  );
}
