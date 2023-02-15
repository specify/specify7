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

  return (
    <div className="flex h-full gap-8">
      {/* FIXME: make the sizing more dynamic */}
      {/* FIXME: fix labels being not v-centered */}
      {/* FIXME: add left right arrows */}
      <div className="relative h-full min-h-[30vw] w-full min-w-[40vw]">
        {originalUrl === undefined ? (
          loadingGif
        ) : (
          <object
            aria-label={title}
            className="absolute h-full w-full border-0"
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
