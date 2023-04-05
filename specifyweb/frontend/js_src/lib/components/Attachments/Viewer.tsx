import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { notificationsText } from '../../localization/notifications';
import { f } from '../../utils/functools';
import type { GetSet } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { serializeResource } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getModel } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Attachment } from '../DataModel/types';
import { augmentMode, ResourceView } from '../Forms/ResourceView';
import {
  originalAttachmentsView,
  useViewDefinition,
} from '../Forms/useViewDefinition';
import { loadingGif } from '../Molecules';
import { userPreferences } from '../Preferences/userPreferences';
import { fetchOriginalUrl, fetchThumbnail } from './attachments';
import { AttachmentRecordLink, getAttachmentTable } from './Cell';

export function AttachmentViewer({
  attachment,
  related: [related, setRelated],
  showMeta = true,
  onViewRecord: handleViewRecord,
}: {
  readonly attachment: SpecifyResource<Attachment>;
  readonly related: GetSet<SpecifyResource<AnySchema> | undefined>;
  readonly showMeta?: boolean;
  readonly onViewRecord:
    | ((model: SpecifyModel, recordId: number) => void)
    | undefined;
}): JSX.Element {
  const serialized = React.useMemo(
    () => serializeResource(attachment),
    [attachment]
  );
  const [originalUrl] = useAsyncState(
    React.useCallback(async () => fetchOriginalUrl(serialized), [serialized]),
    false
  );

  const title = attachment.get('title') as LocalizedString | undefined;
  const attachmentTable = React.useMemo(() => {
    const tableId = attachment.get('tableID');
    if (typeof tableId !== 'number') return undefined;
    const table = getAttachmentTable(tableId);
    return typeof table === 'object'
      ? getModel(`${table.name}Attachment`)
      : undefined;
  }, [attachment]);

  const viewDefinition = useViewDefinition({
    model: attachmentTable,
    viewName: attachmentTable?.name,
    formType: 'form',
    mode: augmentMode(
      'edit',
      related?.isNew() ?? attachment.isNew(),
      attachmentTable?.name
    ),
  });

  // If view doesn't exists, viewDefinition.name would be empty string
  const customViewName =
    viewDefinition?.name === attachmentTable?.name
      ? attachmentTable?.name
      : undefined;

  /**
   * If view definition for a CollectionObjectAttachment table exists, use it
   * Otherwise, fallback to using ObjectAttachment view for the Attachment
   * resource.
   */
  const showCustomForm =
    typeof customViewName === 'string' && typeof related === 'object';

  const mimeType = attachment.get('mimeType') ?? undefined;
  const type = mimeType?.split('/')[0];

  const [thumbnail] = useAsyncState(
    React.useCallback(async () => fetchThumbnail(serialized), [serialized]),
    false
  );

  const [autoPlay] = userPreferences.use('attachments', 'behavior', 'autoPlay');
  const Component = typeof originalUrl === 'string' ? Link.Blue : Button.Blue;
  const table = f.maybe(serialized.tableID ?? undefined, getAttachmentTable);
  return (
    <div className="flex h-full gap-8">
      <div className="flex min-h-[30vw] w-full min-w-[30vh] flex-1 items-center">
        {originalUrl === undefined ? (
          loadingGif
        ) : type === 'image' ? (
          <img alt={title} src={originalUrl} />
        ) : type === 'video' ? (
          /*
           * Subtitles for attachments not yet supported
           */
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            autoPlay={autoPlay}
            className="h-full w-full"
            controls
            src={originalUrl}
          />
        ) : type === 'audio' ? (
          /*
           * Subtitles for attachments not yet supported
           */
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio
            autoPlay={autoPlay}
            className="w-full"
            controls
            src={originalUrl}
          />
        ) : (
          <object
            aria-label={title}
            className="h-full w-full border-0"
            data={originalUrl}
            type={mimeType}
          >
            <img
              alt={title}
              className="h-full w-full object-scale-down"
              src={thumbnail?.src}
            />
          </object>
        )}
      </div>
      {
        /*
         * Note, when new attachment is being created, the showMeta menu must
         * be displayed as otherwise, default values defined in form definition
         * won't be applied
         */
        showMeta || attachment.isNew() ? (
          <div className="flex flex-col">
            <ResourceView
              dialog={false}
              isDependent={false}
              isSubForm
              mode="edit"
              resource={showCustomForm ? related : attachment}
              /*
               * Have to override the title because formatted resource string
               * often includes a URL and other stuff (because it is used in
               * exports)
               */
              title={title}
              viewName={customViewName ?? originalAttachmentsView}
              onAdd={undefined}
              // eslint-disable-next-line react/jsx-handler-names
              onClose={f.never}
              onDeleted={undefined}
              onSaved={undefined}
            />
            <span className="flex-1" />
            {typeof originalUrl === 'string' && (
              <div className="flex flex-wrap gap-2">
                <Component
                  className="flex-1 whitespace-nowrap"
                  download={new URL(originalUrl).searchParams.get(
                    'downloadname'
                  )}
                  href={`/attachment_gw/proxy/${new URL(originalUrl).search}`}
                  target="_blank"
                  onClick={undefined}
                >
                  {notificationsText.download()}
                </Component>
                <Component
                  className="flex-1 whitespace-nowrap"
                  href={originalUrl}
                  target="_blank"
                  onClick={undefined}
                >
                  {commonText.openInNewTab()}
                </Component>
                {typeof table === 'object' &&
                typeof handleViewRecord === 'function' ? (
                  <AttachmentRecordLink
                    attachment={serialized}
                    className="flex-1"
                    model={table}
                    related={[related, setRelated]}
                    variant="button"
                    onViewRecord={handleViewRecord}
                  />
                ) : undefined}
              </div>
            )}
          </div>
        ) : undefined
      }
    </div>
  );
}
