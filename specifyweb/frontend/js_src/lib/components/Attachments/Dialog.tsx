import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useIsModified } from '../../hooks/useIsModified';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import type { GetSet } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { deserializeResource, serializeResource } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Attachment } from '../DataModel/types';
import { SaveButton } from '../Forms/Save';
import { Dialog } from '../Molecules/Dialog';
import { IiifViewer, useIiifSpec } from './IiifViewer';
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
  readonly onViewRecord: (model: SpecifyModel, recordId: number) => void;
}): JSX.Element {
  const resource = React.useMemo(
    () => deserializeResource(attachment),
    [attachment]
  );

  const [form, setForm] = React.useState<HTMLFormElement | null>(null);

  const isModified = useIsModified(resource);

  const [showMeta, _, __, toggleShowMeta] = useBooleanState(true);

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const validIIIFs = useIiifSpec(resource.get('attachmentLocation'));

  const [iiifActive, setIiifActive] = React.useState<boolean>(false);

  const latestIiifSupported = React.useMemo(
    () =>
      validIIIFs !== undefined && validIIIFs.length > 0
        ? validIIIFs.at(-1)
        : undefined,
    [validIIIFs]
  );
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
          {!iiifActive && (
            <Button.Info onClick={toggleShowMeta}>
              {showMeta
                ? attachmentsText.hideForm()
                : attachmentsText.showForm()}
            </Button.Info>
          )}
          {latestIiifSupported === undefined ? null : (
            <Button.Info
              className={iiifActive ? 'brightness-200' : ''}
              onClick={(): void => setIiifActive(true)}
            >
              {attachmentsText.viewIiif({
                version: latestIiifSupported.version.toString(),
              })}
            </Button.Info>
          )}
          {iiifActive && (
            <Button.Info onClick={(): void => setIiifActive(false)}>
              {attachmentsText.exitIiif()}
            </Button.Info>
          )}
        </>
      }
      icon={icons.photos}
      onClose={handleClose}
    >
      {latestIiifSupported === undefined || !iiifActive ? (
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
      ) : (
        <IiifViewer
          baseUrl={latestIiifSupported.url}
          title={attachmentsText.formatIiiF({
            version: latestIiifSupported.version.toString(),
            name: resource.get('origFilename'),
          })}
        />
      )}
    </Dialog>
  );
}
