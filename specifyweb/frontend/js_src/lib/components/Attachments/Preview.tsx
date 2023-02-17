import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useIsModified } from '../../hooks/useIsModified';
import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { deserializeResource, serializeResource } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { Attachment } from '../DataModel/types';
import { SaveButton } from '../Forms/Save';
import { Dialog } from '../Molecules/Dialog';
import type { AttachmentThumbnail } from './attachments';
import { AttachmentViewer } from './Viewer';

export function AttachmentPreview({
  thumbnail,
  attachment,
  related,
  onChange: handleChange,
  onOpen: handleOpened,
}: {
  readonly thumbnail: AttachmentThumbnail;
  readonly attachment: SerializedResource<Attachment>;
  readonly related: SpecifyResource<AnySchema> | undefined;
  readonly onChange: (attachment: SerializedResource<Attachment>) => void;
  readonly onOpen: () => void;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState(false);

  return (
    <>
      <div
        className={`
          flex items-center justify-center rounded bg-white shadow-xl shadow-gray-300
          transition hover:shadow-md hover:shadow-gray-400 dark:bg-black
        `}
      >
        <button
          type="button"
          onClick={(): void => {
            handleOpen();
            handleOpened();
          }}
        >
          <AttachmentThumbnail attachment={attachment} thumbnail={thumbnail} />
        </button>
      </div>
      {isOpen ? (
        <AttachmentDialog
          attachment={attachment}
          related={related}
          thumbnail={thumbnail}
          onChange={handleChange}
          onClose={handleClose}
        />
      ) : null}
    </>
  );
}

function AttachmentThumbnail({
  attachment,
  thumbnail,
}: {
  readonly attachment: SerializedResource<Attachment>;
  readonly thumbnail: AttachmentThumbnail;
}): JSX.Element {
  return (
    <img
      alt={
        typeof attachment.title === 'string' && attachment.title.length > 0
          ? attachment.title
          : thumbnail.alt
      }
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
  );
}

function AttachmentDialog({
  attachment,
  thumbnail,
  related,
  onClose: handleClose,
  onChange: handleChange,
}: {
  readonly attachment: SerializedResource<Attachment>;
  readonly thumbnail: AttachmentThumbnail;
  readonly related: SpecifyResource<AnySchema> | undefined;
  readonly onClose: () => void;
  readonly onChange: (attachment: SerializedResource<Attachment>) => void;
}): JSX.Element {
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
            <Button.Red onClick={handleClose}>{commonText.cancel()}</Button.Red>
          ) : (
            <Button.Blue onClick={handleClose}>
              {commonText.close()}
            </Button.Blue>
          )}
          {form !== null && (
            <SaveButton
              form={form}
              resource={resource}
              onAdd={undefined}
              onSaved={(): void => {
                handleChange(serializeResource(resource));
                handleClose();
              }}
            />
          )}
        </>
      }
      dimensionsKey="AttachmentViewer"
      header={
        attachment.title ??
        attachment.origFilename ??
        schema.models.Attachment.label
      }
      onClose={handleClose}
    >
      <Form forwardRef={setForm}>
        <AttachmentViewer
          attachment={resource}
          relatedResource={related}
          thumbnail={thumbnail}
        />
      </Form>
    </Dialog>
  );
}
