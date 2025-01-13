import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import type { GetSet } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { fetchRelated } from '../DataModel/collection';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { idFromUrl } from '../DataModel/resource';
import { deserializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTableById } from '../DataModel/tables';
import type { Attachment } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission } from '../Permissions/helpers';
import { AttachmentPreview } from './Preview';
import { getAttachmentRelationship, tablesWithAttachments } from './utils';
import { fetchOriginalUrl } from './attachments';
import { useAsyncState } from '../../hooks/useAsyncState';
import { serializeResource } from '../DataModel/serializers';
import { Link } from '../Atoms/Link';
import { notificationsText } from '../../localization/notifications';

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
  const table = f.maybe(attachment.tableID ?? undefined, getAttachmentTable);

  const serialized = React.useMemo(
    () => serializeResource(attachment),
    [attachment]
  );
  const [originalUrl] = useAsyncState(
    React.useCallback(async () => fetchOriginalUrl(serialized), [serialized]),
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
          download={new URL(originalUrl).searchParams.get(
            'downloadname'
          )}
          href={`/attachment_gw/proxy/${new URL(originalUrl).search}`}
          target="_blank"
          onClick={undefined}
          icon="download"
          title={notificationsText.download()}
        />
      )}
    </div>
  );
}

export function getAttachmentTable(tableId: number): SpecifyTable | undefined {
  const table = getTableById(tableId);
  return tablesWithAttachments().includes(table) ? table : undefined;
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
async function fetchAttachmentParent(
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
function getBaseResourceId(
  table: SpecifyTable,
  related: SpecifyResource<AnySchema>
): number | undefined {
  // This would be a URL to CollectionObject
  const resourceUrl = related.get(table.name as 'CollectionObject');
  return idFromUrl(resourceUrl ?? '');
}
