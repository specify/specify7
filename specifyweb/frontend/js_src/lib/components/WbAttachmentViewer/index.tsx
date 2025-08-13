import React from 'react';
import { useLocation } from 'react-router-dom';

import { ajax } from '../../utils/ajax';
import { getCache } from '../../utils/cache';
import { exportsForTests } from '../../utils/cache/index';
import type { RA } from '../../utils/types';
import { fetchOriginalUrl } from '../Attachments/attachments';
import { ImageViewer } from '../Attachments/ImageViewer';
import { AttachmentViewer } from '../Attachments/Viewer';
import { toResource } from '../DataModel/helpers';
import type {
  AnySchema,
  SerializedRecord,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  deserializeResource,
} from '../DataModel/serializers';
import { serializeResource } from '../DataModel/serializers';
import type { Attachment } from '../DataModel/types';
import { NotFoundView } from '../Router/NotFoundView';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';

const { parseCacheKey } = exportsForTests;

export function WbAttachmentViewerView(): JSX.Element {
  const [attachmentUrl, setAttachmentUrl] = React.useState<string | undefined>(
    undefined
  );

  const location = useLocation();
  const parameters = new URLSearchParams(location.search);
  const imageViewerId = parameters.get("id") ?? '';

  const [attachment, setAttachment] = React.useState<SerializedResource<Attachment> | undefined>(undefined);
  const [selectedAttachment, setSelectedAttachment] = React.useState<number>(0);

  const [attachmentIds, setAttachmentIds] = React.useState<RA<number> | undefined>(
    getCache('workBenchImageViewer', imageViewerId)
  );

  React.useEffect(() => {
    function handleStorage(event: StorageEvent) {
      // Only trigger if the relevant key changes
      if (event.key) {
        const parsedKey = parseCacheKey(event.key);
        if (parsedKey && parsedKey[0] === 'workBenchImageViewer' && parsedKey[1] === imageViewerId) {
          setAttachmentIds(getCache('workBenchImageViewer', imageViewerId));
        }
        setSelectedAttachment(0);
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  React.useEffect(() => {
    if (attachmentIds !== undefined) {
      ajax<SerializedRecord<Attachment>>(
        `/api/specify/attachment/${attachmentIds[selectedAttachment]}/`,
        {
          headers: { Accept: 'application/json' },
          method: 'GET',
        }
      )
        .then(({ data }) => {
          const resource = toResource(
            serializeResource(data),
            'Attachment'
          );
          setAttachment(resource);
        });
    }
  }, [attachmentIds, selectedAttachment]);

  React.useEffect(() => {
    if (attachment === undefined) return;
    setIsImage((attachment.mimeType ?? '').startsWith('image/'));

    fetchOriginalUrl(attachment).then((url) => {
      if (typeof url === 'string') {
        setAttachmentUrl(`/attachment_gw/proxy/${new URL(url).search}`);
      }
    });
  }, [attachment]);

  const [isImage, setIsImage] = React.useState<boolean>(false);

  const [related, setRelated] = React.useState<
    SpecifyResource<AnySchema> | undefined
  >(undefined);

  const body =
    attachment !== undefined &&
    (isImage ? (
      <ImageViewer alt={attachment?.title ?? ''} src={attachmentUrl ?? ''} />
    ) : (
      <AttachmentViewer
        attachment={deserializeResource(attachment)}
        related={[related, setRelated]}
        showMeta={false}
        onViewRecord={undefined}
      />
    ));

  return (
    imageViewerId ?
    <Dialog
      buttons={<>
                <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              </>}
      className={{container: dialogClassNames.fullScreen}}
      dimensionsKey="LeafletMap"
      header={attachmentsText.attachments()}
      headerButtons={undefined}
      onClose={() => {
        window.close();
      }}
    >
      <div className="flex flex-col items-center justify-center h-full w-full p-4">
          {body}
      </div>
    </Dialog>
    :
    <NotFoundView/>
  )
}