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
import type { RA } from '../../utils/types';
import { Progress } from '../Atoms';
import { Input, Label } from '../Atoms/Form';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import { toTable } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import { deserializeResource } from '../DataModel/serializers';
import { getTable } from '../DataModel/tables';
import type { Attachment } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { loadingBar } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import { FilePicker } from '../Molecules/FilePicker';
import { ProtectedTable } from '../Permissions/PermissionDenied';
import { collectionPreferences } from '../Preferences/collectionPreferences';
import { userPreferences } from '../Preferences/userPreferences';
import { AttachmentPluginSkeleton } from '../SkeletonLoaders/AttachmentPlugin';
import { attachmentSettingsPromise, uploadFile } from './attachments';
import { AttachmentGallery } from './Gallery';
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
  React.useEffect(
    () =>
      typeof resource !== 'object'
        ? undefined
        : resourceOn(
            resource,
            'change:attachment',
            () => {
              const getAttachment = resource.rgetPromise as unknown as (
                fieldName: string,
                prePopulate: boolean,
                strict: boolean
              ) => Promise<SpecifyResource<Attachment> | null>;
              void getAttachment('attachment', true, false).then((next) =>
                setAttachment(next ?? false)
              );
            },
            false
          ),
    [resource, setAttachment]
  );
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
          onExistingSelected={(attachment): void => {
            resource?.set('attachment', attachment.resource_uri as never);
            setAttachment(deserializeResource(attachment));
          }}
          resource={resource}
        />
      )}
    </div>
  );
}

export function UploadAttachment({
  onUploaded: handleUploaded,
  onExistingSelected: handleExistingSelected,
  resource,
}: {
  readonly onUploaded: (attachment: SpecifyResource<Attachment>) => void;
  readonly onExistingSelected?: (
    attachment: SerializedResource<Attachment>
  ) => void;
  readonly resource?: SpecifyResource<AnySchema>;
}): JSX.Element {
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
  const attachmentRelationship =
    resource?.specifyTable.getRelationship('attachment');

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
    <div className="flex flex-col gap-2">
      {typeof resource === 'object' &&
      attachmentRelationship !== undefined &&
      typeof handleExistingSelected === 'function' ? (
        <ExistingAttachmentPicker onSelect={handleExistingSelected} />
      ) : undefined}
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
    </div>
  );
}

function ExistingAttachmentPicker({
  onSelect: handleSelect,
}: {
  readonly onSelect: (attachment: SerializedResource<Attachment>) => void;
}): JSX.Element {
  const [search, setSearch] = React.useState('');
  const [attachments, setAttachments] = React.useState<
    RA<SerializedResource<Attachment>>
  >([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const value = search.trim();
    let wasCancelled = false;
    if (value.length === 0) {
      setAttachments([]);
      setIsLoading(false);
      return (): void => {
        wasCancelled = true;
      };
    }

    setIsLoading(true);
    const timeout = setTimeout(() => {
      void Promise.all([
        fetchCollection(
          'Attachment',
          { domainFilter: true, limit: 100, orderBy: '-timestampCreated' },
          { title__icontains: value }
        ),
        fetchCollection(
          'Attachment',
          { domainFilter: true, limit: 100, orderBy: '-timestampCreated' },
          { attachmentLocation__icontains: value }
        ),
      ])
        .then((results) => {
          if (wasCancelled) return;
          const unique = new Map<number, SerializedResource<Attachment>>();
          results
            .flatMap(({ records }) => records)
            .forEach((attachment) => {
              unique.set(attachment.id, attachment);
            });
          setAttachments([...unique.values()]);
        })
        .catch(raise)
        .finally(() => {
          if (!wasCancelled) setIsLoading(false);
        });
    }, 300);

    return (): void => {
      wasCancelled = true;
      clearTimeout(timeout);
    };
  }, [search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Label.Block>
        {attachmentsText.searchAttachments()}
        <Input.Text autoFocus value={search} onValueChange={setSearch} />
      </Label.Block>
      {isLoading ? (
        loadingBar
      ) : attachments.length > 0 ? (
        <div className="min-h-0 flex-1">
          <AttachmentGallery
            attachments={attachments}
            isComplete
            onFetchMore={undefined}
            scale={10}
            onChange={() => undefined}
            onClick={handleSelect}
          />
        </div>
      ) : search.trim().length > 0 ? (
        <p>{attachmentsText.noMatchingAttachments()}</p>
      ) : (
        <p>{attachmentsText.searchAttachmentsHint()}</p>
      )}
    </div>
  );
}
