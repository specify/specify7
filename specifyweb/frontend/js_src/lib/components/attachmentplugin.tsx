/**
 * Attachments form plugin
 */

import React from 'react';
import type { State } from 'typesafe-reducer';

import { error } from '../assert';
import {
  attachmentsAvailable,
  attachmentSettingsPromise,
  uploadFile,
} from '../attachments';
import type { Attachment } from '../datamodel';
import type { AnySchema, SerializedResource } from '../datamodelutils';
import { serializeResource } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { FormMode } from '../parseform';
import { hasTablePermission } from '../permissions';
import { AttachmentCell } from './attachmentstask';
import { Progress } from './basic';
import { crash } from './errorboundary';
import { FilePicker } from './filepicker';
import { useAsyncState } from './hooks';
import { Dialog, loadingBar } from './modaldialog';

export function AttachmentPlugin({
  resource,
  onUploadComplete: handleUploadComplete,
  mode = 'edit',
  id,
  name,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly onUploadComplete?: (attachment: SpecifyResource<Attachment>) => void;
  readonly mode: FormMode;
  readonly id?: string;
  readonly name?: string;
}): JSX.Element {
  const [state, setState] = useAsyncState<
    | State<'AddAttachment'>
    | State<'Unavailable'>
    | State<'DisplayAttachment', { attachment: SerializedResource<Attachment> }>
    | State<'FileUpload', { file: File }>
  >(
    React.useCallback(
      async () =>
        attachmentSettingsPromise.then(() =>
          attachmentsAvailable()
            ? (
                resource?.rgetPromise('attachment') ?? Promise.resolve(null)
              ).then((attachment) =>
                attachment === null
                  ? { type: 'AddAttachment' }
                  : {
                      type: 'DisplayAttachment',
                      attachment: serializeResource(attachment),
                    }
              )
            : { type: 'Unavailable' }
        ),
      [resource]
    ),
    true
  );

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
              if (typeof attachment === 'undefined')
                setState({ type: 'Unavailable' });
              else {
                handleUploadComplete?.(attachment);
                resource?.set('attachment', attachment as never);
                setState({
                  type: 'DisplayAttachment',
                  attachment: serializeResource(attachment),
                });
              }
            })
            .catch(crash)
            .finally(() => setUploadProgress(undefined))
        : undefined,
    [setState, state, resource, handleUploadComplete]
  );

  const filePickerContainer = React.useRef<HTMLDivElement | null>(null);

  return typeof state === 'undefined' ? (
    <>{commonText('loading')}</>
  ) : state.type === 'Unavailable' ? (
    <div>{formsText('attachmentServerUnavailable')}</div>
  ) : (
    <div className="w-72 h-72" ref={filePickerContainer} tabIndex={-1}>
      {state.type === 'AddAttachment' ? (
        mode === 'view' || !hasTablePermission('Attachment', 'create') ? (
          <p>{formsText('noData')}</p>
        ) : (
          <FilePicker
            onSelected={(file): void => {
              filePickerContainer.current?.focus();
              setState({
                type: 'FileUpload',
                file,
              });
            }}
            acceptedFormats={undefined}
            id={id}
            name={name}
          />
        )
      ) : state.type === 'FileUpload' ? (
        <Dialog
          header={formsText('attachmentUploadDialogTitle')}
          buttons={undefined}
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
        <div className="flex items-center justify-center h-full bg-black">
          <AttachmentCell
            attachment={state.attachment}
            onViewRecord={undefined}
          />
        </div>
      ) : (
        error('Unhandled case', { state })
      )}
    </div>
  );
}
