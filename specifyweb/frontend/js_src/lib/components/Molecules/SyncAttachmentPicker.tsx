import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { wbText } from '../../localization/workbench';
import { Button } from '../Atoms/Button';
import { Textarea } from '../Atoms/Form';
import { AttachmentsView } from '../Attachments';
import { fetchOriginalUrl } from '../Attachments/attachments';
import { UploadAttachment, useAttachment } from '../Attachments/Plugin';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import type { SerializedResource } from '../DataModel/helperTypes';
import { serializeResource } from '../DataModel/serializers';
import type { Attachment } from '../DataModel/types';
import { Dialog } from './Dialog';
import { Tabs } from './Tabs';

// Const types = ['url', 'image', 'attachments', 'attachments'] as const;
const types = ['url', 'image', 'attachments'] as const;
function deriveAltFromUrl(source?: string, fallback = 'Image preview'): string {
  if (!source) return fallback;
  try {
    const u = new URL(source, window.location.origin);
    const candidate =
      u.searchParams.get('downloadname') ||
      u.searchParams.get('filename') ||
      u.pathname.split('/').pop() ||
      '';
    const decoded = decodeURIComponent(candidate.replaceAll('+', ' '))
      .replaceAll(/\u202F|\u00A0/g, ' ')
      .trim();
    return decoded || fallback;
  } catch {
    const last = (source.split('/').pop() ?? '').replaceAll('+', ' ');
    const decoded = decodeURIComponent(last)
      .replaceAll(/\u202f|\xa0/g, ' ')
      .trim();
    return decoded || fallback;
  }
}

export function SyncAttachmentPicker({
  url,
  onChange: handleChange,
}: {
  readonly url: string | undefined;
  readonly onChange: (url: string | undefined) => void;
}): JSX.Element {
  const [attachment, setAttachment] = useAttachment(undefined);
  useErrorContext('attachment', attachment);

  const [isOpen, , , handleToggle] = useBooleanState();

  const loading = React.useContext(LoadingContext);

  const [urlNotFound, setUrlNotFound] = React.useState(false);

  /*
   * Const [type, setType] = React.useState<
   *   'attachments' | 'attachments' | 'image' | 'url'
   * >('url');
   */
  const [type, setType] = React.useState<typeof types[number]>('url');

  function handleAttachment(attachment: SerializedResource<Attachment>): void {
    loading(
      fetchOriginalUrl(attachment).then((url) => {
        url === undefined ? setUrlNotFound(true) : handleChange(url);
      })
    );
    handleToggle();
  }

  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <>
      {!isReadOnly && (
        <Button.Secondary onClick={() => handleToggle()}>
          {url === undefined
            ? preferencesText.pickImage()
            : commonText.change()}
        </Button.Secondary>
      )}

      {url !== undefined && !isReadOnly ? (
        <Button.Secondary
          onClick={() => {
            setAttachment(undefined);
            handleChange(undefined);
          }}
        >
          {commonText.delete()}
        </Button.Secondary>
      ) : undefined}

      {url !== undefined && (
        <img
          // Alt={url.slice(url.lastIndexOf('/') + 1) ?? url}
          alt={deriveAltFromUrl(url)}
          className="h-40 max-h-full w-40 max-w-full object-contain"
          src={url}
        />
      )}

      {isOpen && (
        <Dialog
          buttons={commonText.close()}
          header={preferencesText.pickAttachment()}
          onClose={(): void => handleToggle()}
        >
          <Tabs
            index={[types.indexOf(type), (index) => setType(types[index])]}
            tabs={{
              [preferencesText.url()]: (
                <Textarea value={url} onValueChange={handleChange} />
              ),
              [wbText.upload()]: (
                <UploadAttachment
                  onUploaded={(attachment): void => {
                    handleAttachment(serializeResource(attachment));
                  }}
                />
              ),
              [attachmentsText.attachments()]: (
                <AttachmentsView onClick={handleAttachment} />
              ),
            }}
          />

          {urlNotFound && (
            <Dialog
              buttons={commonText.cancel()}
              header={attachmentsText.attachments()}
              onClose={() => setUrlNotFound(false)}
            >
              {preferencesText.attachmentFailed()}
            </Dialog>
          )}
        </Dialog>
      )}
    </>
  );
}
