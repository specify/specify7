import React from 'react';
import { LocalizedString } from 'typesafe-i18n';
import { useAsyncState } from '../../hooks/useAsyncState';
import { serializeResource } from '../DataModel/helpers';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { Attachment } from '../DataModel/types';
import { ResourceView } from '../Forms/ResourceView';
import { originalAttachmentsView } from '../Forms/useViewDefinition';
import { loadingGif } from '../Molecules';
import { fetchOriginalUrl } from './attachments';

export function AttachmentAndMetaData({
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
    <div className="flex items-center gap-8">
      <div className="h-full h-[30vw] w-full w-[40vw] ">
        {originalUrl === undefined ? (
          loadingGif
        ) : (
          <iframe
            className="h-full w-full border-0"
            src={originalUrl}
            title={title}
          ></iframe>
        )}
      </div>
      <div>
        <ResourceView
          dialog={false}
          isDependent={false}
          isSubForm={true}
          mode="edit"
          resource={attachment}
          title={title}
          viewName={originalAttachmentsView}
          onAdd={undefined}
          onClose={() => {}}
          onDeleted={undefined}
          onSaved={undefined}
        />
      </div>
    </div>
  );
}
