import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useIsModified } from '../../hooks/useIsModified';
import { attachmentsText } from '../../localization/attachments';
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
import { AttachmentViewer } from './Viewer';

export function AttachmentDialog({
  attachment,
  related,
  onClose: handleClose,
  onChange: handleChange,
  onPrevious: handlePrevious,
  onNext: handleNext,
}: {
  readonly attachment: SerializedResource<Attachment>;
  readonly related: SpecifyResource<AnySchema> | undefined;
  readonly onClose: () => void;
  readonly onChange: (attachment: SerializedResource<Attachment>) => void;
  readonly onPrevious: (() => void) | undefined;
  readonly onNext: (() => void) | undefined;
}): JSX.Element {
  const resource = React.useMemo(
    () => deserializeResource(attachment),
    [attachment]
  );

  const [form, setForm] = React.useState<HTMLFormElement | null>(null);

  const isModified = useIsModified(resource);

  const [showMeta, _, __, toggleShowMeta] = useBooleanState(true);
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
      headerButtons={
        <>
          <span className="-ml-4 flex-1" />
          <Button.Blue aria-pressed={showMeta} onClick={toggleShowMeta}>
            {attachmentsText.showMetaData()}
          </Button.Blue>
        </>
      }
      onClose={handleClose}
    >
      <div className="flex h-full gap-4">
        {/* FEATURE: keyboard navigation support */}
        <Button.Icon
          className="p-4"
          icon="chevronLeft"
          title={commonText.previous()}
          onClick={handlePrevious}
        />
        <Form className="flex-1" forwardRef={setForm}>
          <AttachmentViewer
            attachment={resource}
            relatedResource={related}
            showMeta={showMeta}
          />
        </Form>
        <Button.Icon
          className="p-4"
          icon="chevronRight"
          title={commonText.next()}
          onClick={handleNext}
        />
      </div>
    </Dialog>
  );
}
