import React from 'react';

import { useIsModified } from '../../hooks/useIsModified';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { deserializeResource, serializeResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { Attachment } from '../DataModel/types';
import { SaveButton } from '../Forms/Save';
import { Dialog } from '../Molecules/Dialog';
import { AttachmentAndMetaData } from './AttachmentAndMetaData';
import type { AttachmentThumbnail } from './attachments';

export function AttachmentPreview({
  thumbnail,
  attachment,
  onChange: handleChange,
}: {
  readonly thumbnail: AttachmentThumbnail;
  readonly attachment: SerializedResource<Attachment>;
  readonly onChange: (attachment: SerializedResource<Attachment>) => void;
}): JSX.Element {
  // Open and close attachmentDialog
  const [seen, setSeen] = React.useState(false);
  const togglePop = (): void => {
    setSeen(!seen);
  };

  const children = (
    <button
      onClick={(event): void => {
        event.preventDefault();
        togglePop();
      }}
    >
      <img
        alt={attachment.title || thumbnail.alt}
        className={`
          max-h-full max-w-full border-8 border-white object-contain
          dark:border-black
        `}
        src={thumbnail.src}
        style={{
          width: `${thumbnail.width}px`,
          height: `${thumbnail.height}px`,
        }}
      />
    </button>
  );

  const className = `
    flex items-center justify-center rounded bg-white shadow-xl shadow-gray-300
    transition hover:shadow-md hover:shadow-gray-400 dark:bg-black
  `;

  return (
    <>
      <div className={className}>{children}</div>
      {seen ? (
        <AttachmentDialog
          attachment={attachment}
          togglePop={togglePop}
          onChange={handleChange}
        />
      ) : null}
    </>
  );
}

function AttachmentDialog({
  attachment,
  togglePop,
  onChange: handleChange,
}: {
  readonly attachment: SerializedResource<Attachment>;
  readonly togglePop: () => void;
  readonly onChange: (attachment: SerializedResource<Attachment>) => void;
}): JSX.Element {
  // Attachment is a JSON object. Need to deserilize it
  const resource = React.useMemo(
    () => deserializeResource(attachment),
    [attachment]
  );

  const [form, setForm] = React.useState<HTMLFormElement | null>(null);

  const isModified = useIsModified(resource);

  return (
    <Dialog
      buttons={
        <>
          {isModified ? (
            <Button.Red onClick={togglePop}>{commonText.cancel()}</Button.Red>
          ) : (
            <Button.Blue onClick={togglePop}>{commonText.close()}</Button.Blue>
          )}
          {form !== null && (
            <SaveButton
              form={form}
              resource={resource}
              onAdd={undefined}
              onSaved={() => {
                handleChange(serializeResource(resource));
                togglePop();
              }}
            />
          )}
        </>
      }
      header={attachmentsText.attachmentPreview()}
      onClose={togglePop}
    >
      <Form forwardRef={setForm}>
        <AttachmentAndMetaData attachment={resource} />
      </Form>
    </Dialog>
  );
}
