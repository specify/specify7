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
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { toTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getTable, tables } from '../DataModel/tables';
import type { Attachment } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { loadingBar } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import { FilePicker } from '../Molecules/FilePicker';
import { ProtectedTable } from '../Permissions/PermissionDenied';
import { collectionPreferences } from '../Preferences/collectionPreferences';
import { userPreferences } from '../Preferences/userPreferences';
import { AttachmentPluginSkeleton } from '../SkeletonLoaders/AttachmentPlugin';
import {
  MAX_EXTERNAL_RESOURCE_URL_LENGTH,
  attachmentSettingsPromise,
  validateExternalResourceURL,
  uploadFile,
} from './attachments';
import { AttachmentViewer } from './Viewer';

export function AttachmentsPlugin(
  props: {
    readonly resource: SpecifyResource<AnySchema> | undefined;
  }
): JSX.Element | null {
  const [available] = usePromise(attachmentSettingsPromise, true);
  return available === undefined ? null : (
    <ProtectedTable action="read" tableName="Attachment">
      <ProtectedAttachmentsPlugin
        {...props}
        attachmentServerAvailable={available}
      />
    </ProtectedTable>
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
  attachmentServerAvailable,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly attachmentServerAvailable: boolean;
}): JSX.Element | null {
  const [attachment, setAttachment] = useAttachment(resource);
  const isReadOnly = React.useContext(ReadOnlyContext);

  useErrorContext('attachment', attachment);

  const filePickerContainer = React.useRef<HTMLDivElement | null>(null);
  const related = useTriggerState(
    resource?.specifyTable.name === 'Attachment' ? undefined : resource
  );
  const [collapseFormByDefault] = userPreferences.use(
    'attachments',
    'behavior',
    'collapseFormByDefault'
  );
  const [controlsVisiblePreference] = userPreferences.use(
    'attachments',
    'behavior',
    'showControls'
  );
  const areControlsVisible = controlsVisiblePreference;
  const preferCollapsed = collapseFormByDefault && areControlsVisible;

  const [showMeta, handleShowMeta, handleHideMeta, toggleShowMeta] =
    useBooleanState(!preferCollapsed);

  React.useEffect(() => {
    if (typeof attachment !== 'object') return;
    if (preferCollapsed) {
      handleHideMeta();
    } else {
      handleShowMeta();
    }
  }, [attachment, handleHideMeta, handleShowMeta, preferCollapsed]);
  return attachment === undefined ? (
    <AttachmentPluginSkeleton />
  ) : (
    <div
      className="flex h-full gap-4 overflow-x-auto"
      ref={filePickerContainer}
      tabIndex={-1}
    >
      {typeof attachment === 'object' ? (
        <AttachmentViewer
          attachment={attachment}
          related={related}
          showMeta={showMeta}
          onToggleSidebar={toggleShowMeta}
          onViewRecord={undefined}
        />
      ) : isReadOnly ? (
        <p>{formsText.noData()}</p>
      ) : (
        <UploadAttachment
          attachmentServerAvailable={attachmentServerAvailable}
          onUploaded={(attachment): void => {
            // Fix focus loss when <FilePicker would be removed from DOM
            filePickerContainer.current?.focus();
            if (typeof resource === 'object') {
              const tableName = resource.specifyTable.name;
              const parentTableName = tableName.endsWith('Attachment')
                ? tableName.slice(0, -'Attachment'.length)
                : tableName;
              const parentTable =
                parentTableName.length > 0
                  ? getTable(parentTableName)
                  : undefined;
              attachment?.set(
                'tableID',
                (parentTable ?? resource.specifyTable).tableId
              );
            }
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
  attachmentServerAvailable,
}: {
  readonly onUploaded: (attachment: SpecifyResource<Attachment>) => void;
  readonly attachmentServerAvailable?: boolean;
}): JSX.Element {
  const [externalUrl, setExternalUrl] = React.useState('');
  const [urlError, setUrlError] = React.useState<
    'invalid' | 'tooLong' | undefined
  >(undefined);
  const [uploadProgress, setUploadProgress] = React.useState<
    number | true | undefined
  >(undefined);
  const [isFailed, handleFailed] = useBooleanState();
  const loading = React.useContext(LoadingContext);

  const [attachmentIsPublicDefault] = collectionPreferences.use(
    'general',
    'attachments',
    'attachment.is_public_default'
  );
  const canUploadFile = attachmentServerAvailable ?? true;

  const addExternalAttachment = (): void => {
    const result = validateExternalResourceURL(externalUrl);
    if ('error' in result) {
      setUrlError(result.error);
      return;
    }
    setUrlError(undefined);
    const { normalizedUrl } = result;
    const attachment = new tables.Attachment.Resource({
      resourceurl: normalizedUrl,
      origfilename: normalizedUrl,
      title: new URL(normalizedUrl).hostname,
      isPublic: attachmentIsPublicDefault,
    });
    handleUploaded(attachment);
  };

  return typeof uploadProgress === 'object' ? (
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
    <div className="flex flex-col gap-4">
      {isFailed && <p>{attachmentsText.attachmentServerUnavailable()}</p>}
      {canUploadFile && (
        <FilePicker
          acceptedFormats={undefined}
          onFileSelected={(file): void =>
            loading(
              uploadFile({
                file,
                handleProgress: setUploadProgress,
                attachmentIsPublicDefault,
              })
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
      )}
      <div className="flex max-w-prose flex-col gap-4">
        <Label.Block>
          {attachmentsText.externalResourceUrl()}
          <Input.Generic
            aria-describedby={
              urlError ? 'external-resource-url-error' : undefined
            }
            aria-invalid={urlError !== undefined}
            autoComplete="url"
            maxLength={MAX_EXTERNAL_RESOURCE_URL_LENGTH}
            type="url"
            value={externalUrl}
            onKeyDown={(event): void => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addExternalAttachment();
              }
            }}
            onValueChange={(value): void => {
              setExternalUrl(value);
              setUrlError(undefined);
            }}
          />
        </Label.Block>
        {urlError && (
          <p id="external-resource-url-error" role="alert">
            {urlError === 'tooLong'
              ? attachmentsText.externalResourceUrlTooLong()
              : attachmentsText.invalidExternalResourceUrl()}
          </p>
        )}
        <Button.Info onClick={addExternalAttachment}>
          {attachmentsText.addExternalResource()}
        </Button.Info>
      </div>
    </div>
  );
}
