import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { wbText } from '../../localization/workbench';
import { Tabs } from '../AppResources/Tabs';
import { Button } from '../Atoms/Button';
import { Textarea } from '../Atoms/Form';
import { AttachmentsView } from '../Attachments';
import { fetchOriginalUrl } from '../Attachments/attachments';
import { UploadAttachment, useAttachment } from '../Attachments/Plugin';
import { LoadingContext } from '../Core/Contexts';
import { Dialog } from '../Molecules/Dialog';

const types = ['url', 'image', 'attachments', 'attachments'] as const;

export function AttachmentPicker({
  url,
  onChange: handleChange,
  isReadOnly,
}: {
  readonly url: string | undefined;
  readonly onChange: (url: string) => void;
  readonly isReadOnly: boolean;
}): JSX.Element {
  const [attachment, setAttachment] = useAttachment(undefined);
  useErrorContext('attachment', attachment);

  const [isOpen, , , handleToggle] = useBooleanState();

  const loading = React.useContext(LoadingContext);

  const [urlNotFound, setUrlNotFound] = React.useState(false);

  const [type, setType] = React.useState<
    'attachments' | 'attachments' | 'image' | 'url'
  >('url');

  return (
    <>
      {!isReadOnly && (
        <Button.Gray onClick={() => handleToggle()}>
          {url === undefined ? commonText.pick() : commonText.change()}
        </Button.Gray>
      )}

      {url !== undefined && !isReadOnly ? (
        <Button.Gray
          onClick={() => {
            setAttachment(undefined);
            handleChange('default');
          }}
        >
          {commonText.delete()}
        </Button.Gray>
      ) : undefined}

      {url !== undefined && (
        <img
          className="max-h-full max-w-full object-contain"
          src={url}
          style={{
            width: `10rem`,
            height: `10rem`,
          }}
        />
      )}

      {isOpen && (
        <Dialog
          buttons={commonText.close()}
          header={preferencesText.pickAttachment()}
          onClose={(): void => {
            handleToggle();
          }}
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
                    setAttachment(attachment);
                  }}
                />
              ),
              [attachmentsText.attachments()]: (
                <AttachmentsView
                  onClick={(attachment): void => {
                    loading(
                      fetchOriginalUrl(attachment).then((url) => {
                        url === undefined
                          ? setUrlNotFound(true)
                          : handleChange(url);
                      })
                    );
                  }}
                />
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
