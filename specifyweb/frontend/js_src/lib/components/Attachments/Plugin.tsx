/**
 * Attachments form plugin
 */

import React from 'react';
import type { State } from 'typesafe-reducer';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { f } from '../../utils/functools';
import { Progress } from '../Atoms';
import { serializeResource, toTable } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Attachment } from '../DataModel/types';
import { error } from '../Errors/assert';
import { fail } from '../Errors/Crash';
import type { FormMode } from '../FormParse';
import { loadingBar } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import { FilePicker } from '../Molecules/FilePicker';
import { hasTablePermission } from '../Permissions/helpers';
import {
  attachmentsAvailable,
  attachmentSettingsPromise,
  uploadFile,
} from './attachments';
import { AttachmentCell } from './Cell';

export function AttachmentsPlugin({
  id,
  name,
  resource,
  onUploadComplete: handleUploadComplete,
  mode = 'edit',
}: {
  readonly id?: string;
  readonly name?: string;
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly onUploadComplete?: (attachment: SpecifyResource<Attachment>) => void;
  readonly mode: FormMode;
}): JSX.Element {
  const [state, setState] = useAsyncState<
    State<
        'DisplayAttachment',
        { readonly attachment: SerializedResource<Attachment> }
      > | State<'AddAttachment'> | State<'FileUpload', { readonly file: File }> | State<'Unavailable'>
  >(
    React.useCallback(async () => {
      await attachmentSettingsPromise;
      if (!attachmentsAvailable()) return { type: 'Unavailable' };
      const attachment =
        f.maybe(resource, (resource) => toTable(resource, 'Attachment')) ??
        (await resource?.rgetPromise('attachment'));
      if (attachment === undefined || attachment === null)
        return { type: 'AddAttachment' };
      const serialized = serializeResource(attachment);
      return {
        type: 'DisplayAttachment',
        attachment: serialized,
      };
    }, [resource]),
    true
  );
  useErrorContext('attachmentPluginState', state);

  const [uploadProgress, setUploadProgress] = React.useState<
    number | undefined
  >(undefined);
  React.useEffect(
    () =>
      state?.type === 'FileUpload'
        ? void uploadFile(state.file, setUploadProgress)
            .then((attachment) => {
              if (typeof resource === 'object')
                attachment?.set('tableID', resource.specifyModel.tableId);
              if (attachment === undefined) setState({ type: 'Unavailable' });
              else {
                handleUploadComplete?.(attachment);
                resource?.set('attachment', attachment as never);
                setState({
                  type: 'DisplayAttachment',
                  attachment: serializeResource(attachment),
                });
              }
            })
            .catch((error) => {
              setState({ type: 'Unavailable' });
              fail(error);
            })
            .finally(() => setUploadProgress(undefined))
        : undefined,
    [setState, state, resource, handleUploadComplete]
  );

  const filePickerContainer = React.useRef<HTMLDivElement | null>(null);

  return state === undefined ? (
    <>{commonText.loading()}</>
  ) : (state.type === 'Unavailable' ? (
    <div>{attachmentsText.attachmentServerUnavailable()}</div>
  ) : (
    <div ref={filePickerContainer} tabIndex={-1}>
      {state.type === 'AddAttachment' ? (
        mode === 'view' || !hasTablePermission('Attachment', 'create') ? (
          <p>{formsText.noData()}</p>
        ) : (
          <FilePicker
            acceptedFormats={undefined}
            id={id}
            name={name}
            onSelected={(file): void => {
              // Fix focus loss when <FilePicker would be removed from DOB
              filePickerContainer.current?.focus();
              setState({
                type: 'FileUpload',
                file,
              });
            }}
          />
        )
      ) : (state.type === 'FileUpload' ? (
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
      ) : state.type === 'DisplayAttachment' ? (
        // Padding bottom prevents the shadow from being cut off
        <div className="flex h-full items-center justify-center pb-5">
          <AttachmentCell
            attachment={state.attachment}
            onViewRecord={undefined}
          />
        </div>
      ) : (
        error('Unhandled case', { state })
      ))}
    </div>
  ));
}
