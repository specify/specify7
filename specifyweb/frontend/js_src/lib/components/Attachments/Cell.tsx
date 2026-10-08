import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { notificationsText } from '../../localization/notifications';
import { f } from '../../utils/functools';
import type { GetSet, RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import { fetchRelated } from '../DataModel/collection';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { fetchResource, idFromUrl } from '../DataModel/resource';
import { deserializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTableById, tables } from '../DataModel/tables';
import type { Attachment } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { format } from '../Formatters/formatters';
import { loadingBar } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission } from '../Permissions/helpers';
import { fetchOriginalUrl, useAttachmentServerStatus } from './attachments';
import { AttachmentPreview } from './Preview';
import { getAttachmentRelationship, tablesWithAttachments } from './utils';

export function AttachmentCell({
  attachment,
  onOpen: handleOpen,
  related: [related, setRelated],
  onViewRecord: handleViewRecord,
}: {
  readonly attachment: SerializedResource<Attachment>;
  readonly onOpen: () => void;
  readonly related: GetSet<SpecifyResource<AnySchema> | undefined>;
  readonly onViewRecord:
    | ((table: SpecifyTable, recordId: number) => void)
    | undefined;
}): JSX.Element {
  const attachmentServerStatus = useAttachmentServerStatus();
  const table = f.maybe(attachment.tableID ?? undefined, getAttachmentTable);

  const [originalUrl] = useAsyncState(
    React.useCallback(
      async () =>
        attachmentServerStatus === 'unavailable'
          ? undefined
          : fetchOriginalUrl(attachment),
      [attachment, attachmentServerStatus]
    ),
    false
  );

  return (
    <div className="relative">
      {typeof handleViewRecord === 'function' &&
      table !== undefined &&
      hasTablePermission(table.name, 'read') ? (
        <AttachmentRecordLink
          attachment={attachment}
          className="absolute left-0 top-0"
          related={[related, setRelated]}
          table={table}
          variant="icon"
          onViewRecord={handleViewRecord}
        />
      ) : undefined}
      <AttachmentPreview
        attachment={attachment}
        onOpen={(): void => {
          if (related === undefined && typeof table === 'object')
            fetchAttachmentParent(table, attachment)
              .then(setRelated)
              .catch(softFail);
          handleOpen();
        }}
      />
      {typeof originalUrl === 'string' && (
        <Link.Icon
          className="absolute right-0 top-0"
          download={new URL(originalUrl).searchParams.get('downloadname')}
          href={`/attachment_gw/proxy/${new URL(originalUrl).search}`}
          icon="download"
          target="_blank"
          title={notificationsText.download()}
          onClick={undefined}
        />
      )}
    </div>
  );
}

export function getAttachmentTable(tableId: number): SpecifyTable | undefined {
  const table = getTableById(tableId);
  return tablesWithAttachments().includes(table) ? table : undefined;
}

type AttachmentParent = {
  readonly table: SpecifyTable;
  readonly id: number;
  readonly formatted: NonNullable<Awaited<ReturnType<typeof format>>>;
};

export async function fetchAttachmentParents(
  attachment: SerializedResource<Attachment>
): Promise<RA<AttachmentParent>> {
  const groups = await Promise.all(
    tablesWithAttachments().map(async (table) => {
      const relationship = getAttachmentRelationship(table);
      if (relationship === undefined) return [];
      if (!hasTablePermission(relationship.relatedTable.name, 'read'))
        return [];
      const attachmentRelationship = tables.Attachment.relationships.find(
        ({ relatedTable }) =>
          relatedTable.name === relationship.relatedTable.name
      );
      if (attachmentRelationship === undefined) return [];

      const pageSize = 100;
      const fetchAllRelatedRecords = async (
        offset = 0,
        previousTotalCount = Number.POSITIVE_INFINITY,
        previousRecords: RA<SerializedResource<AnySchema>> = []
      ): Promise<RA<SerializedResource<AnySchema>>> => {
        if (offset >= previousTotalCount) return previousRecords;
        const page = await fetchRelated(
          attachment,
          attachmentRelationship.name as never,
          { limit: pageSize, offset }
        );
        const records = [...previousRecords, ...page.records];
        return records.length >= page.totalCount
          ? records
          : fetchAllRelatedRecords(records.length, page.totalCount, records);
      };
      const relatedRecords = await fetchAllRelatedRecords();

      return Promise.all(
        relatedRecords.map(async (record) => {
          const related = deserializeResource(record);
          const parentUrl = related.get(table.name as never);
          const id =
            typeof parentUrl === 'string' ? idFromUrl(parentUrl) : undefined;
          if (id === undefined) return undefined;
          const serialized = await fetchResource(
            table.name as never,
            id,
            false
          );
          if (serialized === undefined) return undefined;
          const resource = deserializeResource(serialized);
          return {
            table,
            id,
            formatted: await format(resource, undefined, true),
          };
        })
      ).then((parents) =>
        parents.filter(
          (parent): parent is AttachmentParent => parent !== undefined
        )
      );
    })
  );
  const uniqueParents = new Map<string, AttachmentParent>();
  groups
    .flat()
    .forEach((parent) =>
      uniqueParents.set(`${parent.table.name}:${parent.id}`, parent)
    );
  return Array.from(uniqueParents.values());
}

export function AttachmentRecordLinks({
  attachment,
  onViewRecord: handleViewRecord,
}: {
  readonly attachment: SerializedResource<Attachment>;
  readonly onViewRecord: (table: SpecifyTable, recordId: number) => void;
}): JSX.Element | null {
  const [parents] = useAsyncState(
    React.useCallback(
      async () => fetchAttachmentParents(attachment),
      [attachment]
    ),
    false
  );

  if (parents !== undefined && parents.length === 0) return null;

  return (
    <div className="max-h-40 overflow-y-auto rounded border border-gray-500">
      {parents === undefined ? (
        <div className="p-2">{loadingBar}</div>
      ) : (
        parents.map(({ table, id, formatted }) => (
          <Button.Info
            className="flex w-full items-center justify-start gap-2 !text-left"
            key={`${table.name}:${id}`}
            title={formatted}
            onClick={(): void => handleViewRecord(table, id)}
          >
            <TableIcon label={false} name={table.name} />
            <span className="truncate">{formatted}</span>
          </Button.Info>
        ))
      )}
    </div>
  );
}

/**
 * A button to open a record associated with the attachment
 */
export function AttachmentRecordLink({
  variant,
  className,
  table,
  attachment,
  onViewRecord: handleViewRecord,
  related: [related, setRelated],
}: {
  readonly variant: 'button' | 'icon';
  readonly className: string;
  readonly table: SpecifyTable;
  readonly attachment: SerializedResource<Attachment>;
  readonly onViewRecord: (table: SpecifyTable, recordId: number) => void;
  readonly related: GetSet<SpecifyResource<AnySchema> | undefined>;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const [isFailed, handleFailed, handleNotFailed] = useBooleanState();
  const Component = variant === 'icon' ? Button.LikeLink : Button.Info;
  return (
    <>
      <Component
        className={className}
        title={table?.label}
        onClick={(): void =>
          loading(
            (typeof related === 'object'
              ? Promise.resolve(related)
              : fetchAttachmentParent(table, attachment).then((related) => {
                  setRelated(related);
                  return related;
                })
            )
              .then((related) =>
                typeof related === 'object'
                  ? getBaseResourceId(table, related)
                  : undefined
              )
              .then((id) =>
                typeof id === 'number'
                  ? handleViewRecord(table, id)
                  : handleFailed()
              )
          )
        }
      >
        <TableIcon label name={table?.name ?? 'Attachment'} />
        {variant === 'button' && table?.label}
      </Component>
      {isFailed ? (
        <Dialog
          buttons={commonText.close()}
          header={attachmentsText.unableToFindRelatedRecord()}
          onClose={handleNotFailed}
        >
          {attachmentsText.unableToFindRelatedRecordDescription()}
        </Dialog>
      ) : undefined}
    </>
  );
}

/** Fetch CollectionObjectAttachment for a given Attachment */
export async function fetchAttachmentParent(
  table: SpecifyTable,
  attachment: SerializedResource<Attachment>
): Promise<SpecifyResource<AnySchema> | undefined> {
  const { records } = await fetchRelated(
    attachment,
    getAttachmentRelationship(table)!.name as 'collectionObjectAttachments'
  );
  return deserializeResource(records[0]);
}

/**
 * Get CollectionObject id from CollectionObjectAttachment
 */
export function getBaseResourceId(
  table: SpecifyTable,
  related: SpecifyResource<AnySchema>
): number | undefined {
  // This would be a URL to CollectionObject
  const resourceUrl = related.get(table.name as 'CollectionObject');
  return idFromUrl(resourceUrl ?? '');
}
