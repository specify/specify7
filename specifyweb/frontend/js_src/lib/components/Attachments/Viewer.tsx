import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { f } from '../../utils/functools';
import { serializeResource } from '../DataModel/helpers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Attachment } from '../DataModel/types';
import { ResourceView } from '../Forms/ResourceView';
import { originalAttachmentsView } from '../Forms/useViewDefinition';
import { loadingGif } from '../Molecules';
import { fetchOriginalUrl } from './attachments';

export function AttachmentViewer({
  attachment,
}: {
  readonly attachment: SpecifyResource<Attachment>;
}): JSX.Element {
  const [originalUrl] = useAsyncState(
    React.useCallback(
      async () => fetchOriginalUrl(serializeResource(attachment)),
      [attachment]
    ),
    false
  );

  const title = attachment.get('title') as LocalizedString | undefined;

  return (
    <div className="flex h-full gap-8">
      {/* FIXME: make the sizing more dynamic */}
      {/* FIXME: fix labels being not v-centered */}
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
          resource={attachment}
          title={title}
          viewName={originalAttachmentsView}
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
