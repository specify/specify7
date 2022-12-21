/**
 * Attachments form plugin
 */

import React from 'react';
import type { State } from 'typesafe-reducer';

import { error } from '../Errors/assert';
import {
  attachmentsAvailable,
  attachmentSettingsPromise,
  uploadFile,
} from './attachments';
import type { Attachment } from '../DataModel/types';
import { serializeResource, toTable } from '../DataModel/helpers';
import { f } from '../../utils/functools';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { FormMode } from '../FormParse';
import { hasTablePermission } from '../Permissions/helpers';
import { Progress } from '../Atoms';
import { FilePicker } from '../Molecules/FilePicker';
import { Dialog } from '../Molecules/Dialog';
import { useErrorContext } from '../../hooks/useErrorContext';
import { useAsyncState } from '../../hooks/useAsyncState';
import { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { fail } from '../Errors/Crash';
import { loadingBar } from '../Molecules';
import { AttachmentCell } from './Cell';

export function AttachmentsPlugin({
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
    | State<
        'DisplayAttachment',
        { readonly attachment: SerializedResource<Attachment> }
      >
    | State<'FileUpload', { readonly file: File }>
    | State<'Unavailable'>
  >(
    React.useCallback(
      async () =>
        attachmentSettingsPromise.then(() =>
          attachmentsAvailable()
            ? // REFACTOR: this is hard to read. Also other usages of f.maybe
              (
                f.maybe(
                  f.maybe(resource, (resource) =>
                    toTable(resource, 'Attachment')
                  ),
                  async (attachment) => attachment
                ) ??
                resource?.rgetPromise('attachment') ??
                Promise.resolve(null)
              ).then((attachment) => {
                if (attachment === null) return { type: 'AddAttachment' };
                const serialized = serializeResource(attachment);
                return {
                  type: 'DisplayAttachment',
                  attachment: serialized,
                };
              })
            : { type: 'Unavailable' }
        ),
      [resource]
    ),
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
  ) : state.type === 'Unavailable' ? (
    <div>{formsText.attachmentServerUnavailable()}</div>
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
      ) : state.type === 'FileUpload' ? (
        <Dialog
          buttons={undefined}
          header={formsText.attachmentUploadDialogTitle()}
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
      )}
    </div>
  );
}
