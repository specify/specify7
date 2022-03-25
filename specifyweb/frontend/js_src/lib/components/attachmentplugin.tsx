import React from 'react';
import type { State } from 'typesafe-reducer';

import { error } from '../assert';
import { attachmentsAvailable, uploadFile } from '../attachments';
import type { Attachment } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { FormMode } from '../parseform';
import { AttachmentCell } from './attachmentstask';
import { Progress } from './basic';
import { crash } from './errorboundary';
import { FilePicker } from './filepicker';
import { useAsyncState } from './hooks';
import { Dialog, loadingBar } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { hasTablePermission } from '../permissions';

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
    | State<'DisplayAttachment', { attachment: SpecifyResource<Attachment> }>
    | State<'FileUpload', { file: File }>
  >(
    React.useCallback(
      () =>
        attachmentsAvailable()
          ? (
              resource?.rgetPromise('attachment', true) ?? Promise.resolve(null)
            ).then((attachment) =>
              attachment === null
                ? { type: 'AddAttachment' }
                : { type: 'DisplayAttachment', attachment }
            )
          : { type: 'Unavailable' },
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
              if (typeof attachment === 'undefined')
                setState({ type: 'Unavailable' });
              else {
                setState({
                  type: 'DisplayAttachment',
                  attachment,
                });
                handleUploadComplete?.(attachment);
                resource?.set('attachment', attachment as never);
              }
            })
            .catch(crash)
            .finally(() => setUploadProgress(undefined))
        : undefined,
    [setState, state, resource, handleUploadComplete]
  );

  return typeof state === 'undefined' ? (
    <>{commonText('loading')}</>
  ) : state.type === 'Unavailable' ? (
    <div>{formsText('attachmentServerUnavailable')}</div>
  ) : (
    <div className="w-72 h-72">
      {state.type === 'AddAttachment' ? (
        mode === 'view' || !hasTablePermission('Attachment', 'create') ? (
          <p>{formsText('noData')}</p>
        ) : (
          <FilePicker
            onSelected={(file): void =>
              setState({
                type: 'FileUpload',
                file,
              })
            }
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

export const AttachmentView = createBackboneView(AttachmentPlugin);
