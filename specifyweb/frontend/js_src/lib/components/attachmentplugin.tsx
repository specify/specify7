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
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { FormMode } from '../parseform';
import { hasTablePermission } from '../permissionutils';
import { toTable } from '../specifymodel';
import { AttachmentCell } from './attachmentstask';
import { Progress } from './basic';
import { fail } from './errorboundary';
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
    State<'AddAttachment'> | State<'DisplayAttachment', { readonly attachment: SerializedResource<Attachment> }> | State<'FileUpload', { readonly file: File }> | State<'Unavailable'>
  >(
    React.useCallback(
      async () =>
        attachmentSettingsPromise.then(() =>
          attachmentsAvailable()
            ? (
                f.maybe(
                  f.maybe(resource, (resource) =>
                    toTable(resource, 'Attachment')
                  ),
                  async (attachment) => attachment
                ) ??
                resource?.rgetPromise('attachment') ??
                Promise.resolve(null)
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
    <>{commonText('loading')}</>
  ) : (state.type === 'Unavailable' ? (
    <div>{formsText('attachmentServerUnavailable')}</div>
  ) : (
    <div ref={filePickerContainer} tabIndex={-1}>
      {state.type === 'AddAttachment' ? (
        mode === 'view' || !hasTablePermission('Attachment', 'create') ? (
          <p>{formsText('noData')}</p>
        ) : (
          <FilePicker
            acceptedFormats={undefined}
            id={id}
            name={name}
            onSelected={(file): void => {
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
          header={formsText('attachmentUploadDialogTitle')}
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
