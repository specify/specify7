import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useIsModified } from '../../hooks/useIsModified';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import type { GetSet } from '../../utils/types';
import { localized } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  deserializeResource,
  serializeResource,
} from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
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
  onViewRecord: handleViewRecord,
}: {
  readonly attachment: SerializedResource<Attachment>;
  readonly related: GetSet<SpecifyResource<AnySchema> | undefined>;
  readonly onClose: () => void;
  readonly onChange: (attachment: SerializedResource<Attachment>) => void;
  readonly onPrevious: (() => void) | undefined;
  readonly onNext: (() => void) | undefined;
  readonly onViewRecord: (table: SpecifyTable, recordId: number) => void;
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
            <Button.Danger onClick={handleClose}>
              {commonText.cancel()}
            </Button.Danger>
          ) : (
            <Button.Info onClick={handleClose}>
              {commonText.close()}
            </Button.Info>
          )}
          {form !== null && (
            <SaveButton
              form={form}
              resource={related[0] ?? resource}
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
      header={localized(
        attachment.title ?? attachment.origFilename ?? tables.Attachment.label
      )}
      headerButtons={
        <>
          <span className="-ml-4 flex-1" />
          <Button.Info onClick={toggleShowMeta}>
            {showMeta ? attachmentsText.hideForm() : attachmentsText.showForm()}
          </Button.Info>
        </>
      }
      icon={icons.photos}
      onClose={handleClose}
    >
      <div className="flex flex-1 gap-4 overflow-auto">
        {/* FEATURE: keyboard navigation support */}
        <Button.Icon
          className="p-4"
          icon="chevronLeft"
          title={commonText.previous()}
          onClick={handlePrevious}
        />
        <Form className="flex flex-1 !flex-row gap-8" forwardRef={setForm}>
          <AttachmentViewer
            attachment={resource}
            related={related}
            showMeta={showMeta}
            onViewRecord={handleViewRecord}
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
