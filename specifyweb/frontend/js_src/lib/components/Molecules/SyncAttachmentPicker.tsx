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

const types = ['url', 'image', 'attachments'] as const;

function deriveAltFromUrl(source?: string, fallback = 'Image preview'): string {
  if (!source) return fallback;

  const { searchParams, pathname } = new URL(
    source,
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin
  );

  const rawName =
    searchParams.get('downloadname') ??
    searchParams.get('filename') ??
    pathname.split('/').pop();

  return rawName
    ? decodeURIComponent(rawName).replaceAll('+', ' ').trim()
    : fallback;
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

  const [isUrlNotFound, setIsUrlNotFound] = React.useState(false);
  const [type, setType] = React.useState<(typeof types)[number]>('url');

  function handleAttachment(
    nextAttachment: SerializedResource<Attachment>
  ): void {
    loading(
      fetchOriginalUrl(nextAttachment).then((nextUrl) => {
        nextUrl === undefined ? setIsUrlNotFound(true) : handleChange(nextUrl);
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
          alt={(attachment as any)?.origName ?? deriveAltFromUrl(url)}
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
                  onUploaded={(uploaded): void => {
                    handleAttachment(serializeResource(uploaded));
                  }}
                />
              ),
              [attachmentsText.attachments()]: (
                <AttachmentsView onClick={handleAttachment} />
              ),
            }}
          />

          {isUrlNotFound && (
            <Dialog
              buttons={commonText.cancel()}
              header={attachmentsText.attachments()}
              onClose={() => setIsUrlNotFound(false)}
            >
              {preferencesText.attachmentFailed()}
            </Dialog>
          )}
        </Dialog>
      )}
    </>
  );
}
