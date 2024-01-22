/**
 * Attachments form plugin
 */

import React from 'react';

import { useAsyncState, usePromise } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { useTriggerState } from '../../hooks/useTriggerState';
import { attachmentsText } from '../../localization/attachments';
import { formsText } from '../../localization/forms';
import { f } from '../../utils/functools';
import type { GetOrSet } from '../../utils/types';
import { Progress } from '../Atoms';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { toTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Attachment } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { loadingBar } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import { FilePicker } from '../Molecules/FilePicker';
import { ProtectedTable } from '../Permissions/PermissionDenied';
import { AttachmentPluginSkeleton } from '../SkeletonLoaders/AttachmentPlugin';
import { attachmentSettingsPromise, uploadFile } from './attachments';
import { AttachmentViewer } from './Viewer';

export function AttachmentsPlugin(
  props: Parameters<typeof ProtectedAttachmentsPlugin>[0]
): JSX.Element | null {
  const [available] = usePromise(attachmentSettingsPromise, true);
  return available === undefined ? null : available ? (
    <ProtectedTable action="read" tableName="Attachment">
      <ProtectedAttachmentsPlugin {...props} />
    </ProtectedTable>
  ) : (
    <p>{attachmentsText.attachmentServerUnavailable()}</p>
  );
}

/** Retrieve attachment related to a given resource */
export function useAttachment(
  resource: SpecifyResource<AnySchema> | undefined
): GetOrSet<SpecifyResource<Attachment> | false | undefined> {
  return useAsyncState(
    React.useCallback(
      async () =>
        f.maybe(resource, (resource) => toTable(resource, 'Attachment')) ??
        (await resource?.rgetPromise('attachment')) ??
        false,
      [resource]
    ),
    false
  );
}

function ProtectedAttachmentsPlugin({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
}): JSX.Element | null {
  const [attachment, setAttachment] = useAttachment(resource);
  const isReadOnly = React.useContext(ReadOnlyContext);

  useErrorContext('attachment', attachment);

  const filePickerContainer = React.useRef<HTMLDivElement | null>(null);
  const related = useTriggerState(
    resource?.specifyTable.name === 'Attachment' ? undefined : resource
  );
  return attachment === undefined ? (
    <AttachmentPluginSkeleton />
  ) : (
    <div
      className="flex h-full gap-8 overflow-x-auto"
      ref={filePickerContainer}
      tabIndex={-1}
    >
      {typeof attachment === 'object' ? (
        <AttachmentViewer
          attachment={attachment}
          related={related}
          onViewRecord={undefined}
        />
      ) : isReadOnly ? (
        <p>{formsText.noData()}</p>
      ) : (
        <UploadAttachment
          onUploaded={(attachment): void => {
            // Fix focus loss when <FilePicker would be removed from DOM
            filePickerContainer.current?.focus();
            if (typeof resource === 'object')
              attachment?.set('tableID', resource.specifyTable.tableId);
            resource?.set('attachment', attachment as never);
            setAttachment(attachment);
          }}
        />
      )}
    </div>
  );
}

export function UploadAttachment({
  onUploaded: handleUploaded,
}: {
  readonly onUploaded: (attachment: SpecifyResource<Attachment>) => void;
}): JSX.Element {
  const [uploadProgress, setUploadProgress] = React.useState<
    number | true | undefined
  >(undefined);
  const [isFailed, handleFailed] = useBooleanState();
  const loading = React.useContext(LoadingContext);

  return isFailed ? (
    <p>{attachmentsText.attachmentServerUnavailable()}</p>
  ) : typeof uploadProgress === 'object' ? (
    <Dialog
      buttons={undefined}
      header={attachmentsText.uploadingInline()}
      onClose={undefined}
    >
      <div aria-live="polite">
        {typeof uploadProgress === 'number' ? (
          <Progress value={uploadProgress} />
        ) : (
          loadingBar
        )}
      </div>
    </Dialog>
  ) : (
    <FilePicker
      acceptedFormats={undefined}
      onFileSelected={(file): void =>
        loading(
          uploadFile(file, setUploadProgress)
            .then((attachment) =>
              attachment === undefined
                ? handleFailed()
                : handleUploaded(attachment)
            )
            .catch((error) => {
              handleFailed();
              raise(error);
            })
            .finally(() => setUploadProgress(undefined))
        )
      }
    />
  );
}
