import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { f } from '../../utils/functools';
import { serializeResource } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getModel } from '../DataModel/schema';
import type { Attachment } from '../DataModel/types';
import { ResourceView } from '../Forms/ResourceView';
import { originalAttachmentsView } from '../Forms/useViewDefinition';
import { loadingGif } from '../Molecules';
import { usePref } from '../UserPreferences/usePref';
import { fetchOriginalUrl, fetchThumbnail } from './attachments';
import { getAttachmentTable } from './Cell';

export function AttachmentViewer({
  attachment,
  relatedResource,
}: {
  readonly attachment: SpecifyResource<Attachment>;
  readonly relatedResource: SpecifyResource<AnySchema> | undefined;
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
  const viewName = React.useMemo(() => {
    const tableId = attachment.get('tableID');
    if (typeof tableId !== 'number') return undefined;
    const table = getAttachmentTable(tableId);
    return typeof table === 'object'
      ? getModel(`${table.name}Attachment`)?.name
      : undefined;
  }, [attachment]);
  const showCustomForm =
    typeof viewName === 'string' && typeof relatedResource === 'object';

  const mimeType = attachment.get('mimeType') ?? undefined;
  const type = mimeType?.split('/')[0];

  const [thumbnail] = useAsyncState(
    React.useCallback(async () => fetchThumbnail(attachment), [attachment]),
    false
  );

  const [autoPlay] = usePref('attachments', 'behavior', 'autoPlay');
  return (
    <div className="flex h-full gap-8">
      {/* FIXME: open in new tab and download links */}
      {/* FIXME: test sizing in formTable */}
      {/* FIXME: add a button to toggle meta visibility */}
      {/* FIXME: consider replacing all h-full with flex-1 flex */}
      {/* FIXME: consider rewerting adding special case in <SpecifyForm /> */}
      {/* FIXME: make sure unknown file formats are not being auto downloaded */}
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
      <div>
        {
          <ResourceView
            dialog={false}
            isDependent={false}
            isSubForm
            mode="edit"
            resource={showCustomForm ? relatedResource : attachment}
            /*
             * Have to override the title because formatted resource string
             * often includes a URL and other stuff (because it is used in
             * exports)
             */
            title={title}
            viewName={showCustomForm ? viewName : originalAttachmentsView}
            onAdd={undefined}
            // eslint-disable-next-line react/jsx-handler-names
            onClose={f.never}
            onDeleted={undefined}
            onSaved={undefined}
          />
        }
      </div>
    </div>
  );
}
