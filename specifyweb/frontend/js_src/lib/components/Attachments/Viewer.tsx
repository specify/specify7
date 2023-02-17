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
import { fetchOriginalUrl } from './attachments';
import { getAttachmentTable } from './Cell';

export function AttachmentViewer({
  attachment,
  relatedResource,
}: {
  readonly attachment: SpecifyResource<Attachment>;
  readonly relatedResource: SpecifyResource<AnySchema> | undefined;
}): JSX.Element {
  const [originalUrl] = useAsyncState(
    React.useCallback(
      async () => fetchOriginalUrl(serializeResource(attachment)),
      [attachment]
    ),
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

  const type = attachment.get('mimeType')?.split('/')[0];

  return (
    <div className="flex h-full gap-8">
      {/* FIXME: test sizing in formTable */}
      {/* FIXME: make the sizing more dynamic */}
      {/* FIXME: fix labels being not v-centered */}
      {/* FIXME: add left right arrows */}
      {/* FIXME: consider replacing all h-full with flex-1 flex */}
      {/* FIXME: consider rewerting adding special case in <SpecifyForm /> */}
      <div className="flex min-h-[30vw] w-full min-w-[40vw] flex-1 items-center">
        {originalUrl === undefined ? (
          loadingGif
        ) : type === 'image' ? (
          // FIXME: add a case for video/audio and others?
          <img src={originalUrl} alt={title} />
        ) : (
          <object
            aria-label={title}
            className="h-full w-full border-0"
            data={originalUrl}
          />
        )}
      </div>
      <div>
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
      </div>
    </div>
  );
}
