import React from 'react';
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from 'react-zoom-pan-pinch';

import { useAsyncState } from '../../hooks/useAsyncState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { notificationsText } from '../../localization/notifications';
import { f } from '../../utils/functools';
import type { GetSet } from '../../utils/types';
import { localized } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext, SearchDialogContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { serializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTable } from '../DataModel/tables';
import type { Attachment } from '../DataModel/types';
import { augmentMode, ResourceView } from '../Forms/ResourceView';
import {
  originalAttachmentsView,
  propsToFormMode,
  useViewDefinition,
} from '../Forms/useViewDefinition';
import { loadingGif } from '../Molecules';
import { userPreferences } from '../Preferences/userPreferences';
import { fetchOriginalUrl, fetchThumbnail } from './attachments';
import { AttachmentRecordLink, getAttachmentTable } from './Cell';
import { Thumbnail } from './Preview';

export function AttachmentViewer({
  attachment,
  related: [related, setRelated],
  showMeta,
  onToggleSidebar,
  onViewRecord: handleViewRecord,
}: {
  readonly attachment: SpecifyResource<Attachment>;
  readonly related: GetSet<SpecifyResource<AnySchema> | undefined>;
  readonly showMeta?: boolean;
  readonly onToggleSidebar?: (() => void) | undefined;
  readonly onViewRecord:
    | ((table: SpecifyTable, recordId: number) => void)
    | undefined;
}): JSX.Element {
  const serialized = React.useMemo(
    () => serializeResource(attachment),
    [attachment]
  );
  const [originalUrl] = useAsyncState(
    React.useCallback(async () => fetchOriginalUrl(serialized), [serialized]),
    false
  );

  const title = localized(attachment.get('title') ?? undefined);

  const [displayOriginal] = userPreferences.use(
    'attachments',
    'behavior',
    'displayOriginal'
  );
  const attachmentTable = React.useMemo(() => {
    const tableId = attachment.get('tableID');
    if (typeof tableId !== 'number') return undefined;
    const table = getAttachmentTable(tableId);
    return typeof table === 'object'
      ? getTable(`${table.name}Attachment`)
      : undefined;
  }, [attachment]);

  const isReadOnly = augmentMode(
    React.useContext(ReadOnlyContext),
    related?.isNew() ?? attachment.isNew(),
    attachmentTable?.name
  );
  const isInSearchDialog = React.useContext(SearchDialogContext);
  const viewDefinition = useViewDefinition({
    table: attachmentTable,
    viewName: attachmentTable?.name,
    formType: 'form',
    mode: propsToFormMode(isReadOnly, isInSearchDialog),
  });

  // If view doesn't exists, viewDefinition.name would be empty string
  const customViewName =
    viewDefinition?.name === attachmentTable?.name
      ? attachmentTable?.name
      : undefined;

  /**
   * If view definition for a CollectionObjectAttachment table exists, use it
   * Otherwise, fallback to using ObjectAttachment view for the Attachment
   * resource.
   */
  const showCustomForm =
    typeof customViewName === 'string' && typeof related === 'object';

  const mimeType = attachment.get('mimeType') ?? undefined;
  const type = mimeType?.split('/')[0];

  const [thumbnail] = useAsyncState(
    React.useCallback(async () => fetchThumbnail(serialized), [serialized]),
    false
  );

  const Component = typeof originalUrl === 'string' ? Link.Info : Button.Info;
  const [autoPlay] = userPreferences.use('attachments', 'behavior', 'autoPlay');
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
  const table = f.maybe(serialized.tableID ?? undefined, getAttachmentTable);
  const areControlsVisible = controlsVisiblePreference;
  const defaultCollapsed = collapseFormByDefault && areControlsVisible;
  const shouldShowMeta = showMeta ?? !defaultCollapsed;
  const isSidebarExpanded = shouldShowMeta || attachment.isNew();
  const canToggleSidebar =
    typeof onToggleSidebar === 'function' && !attachment.isNew();
  /*
   * Tiff files cannot be shown by chrome or firefox,
   * so fallback to the thumbnail regardless of user preference
   */
  const isTiffImage = mimeType === 'image/tiff' || mimeType === 'image/tif';

  return (
    <>
      <div className="flex min-h-[theme(spacing.60)] w-full min-w-[theme(spacing.60)] flex-1 items-center justify-center">
        {displayOriginal === 'full' && !isTiffImage ? (
          originalUrl === undefined ? (
            loadingGif
          ) : type === 'image' ? (
            <div className="h-full w-full">
              <TransformWrapper
                centerOnInit
                centerZoomedOut
                maxScale={8}
                minScale={0.5}
                wheel={{ step: 0.15 }}
              >
                <ImageTransformContent
                  alt={typeof title === 'string' ? title : ''}
                  canToggleSidebar={canToggleSidebar}
                  isSidebarExpanded={isSidebarExpanded}
                  showControls={areControlsVisible}
                  src={originalUrl}
                  thumbnail={thumbnail?.src}
                  onToggleSidebar={onToggleSidebar}
                />
              </TransformWrapper>
            </div>
          ) : type === 'video' ? (
            /*
             * Subtitles for attachments not yet supported
             */
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              autoPlay={autoPlay}
              className="h-full w-full"
              controls
              src={originalUrl}
            />
          ) : type === 'audio' ? (
            /*
             * Subtitles for attachments not yet supported
             */
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio
              autoPlay={autoPlay}
              className="w-full"
              controls
              src={originalUrl}
            />
          ) : (
            <object
              aria-label={title}
              className="h-full w-full border-0"
              data={originalUrl}
              type={mimeType}
            >
              <img
                alt={title}
                className="h-full w-full object-scale-down"
                src={thumbnail?.src}
              />
            </object>
          )
        ) : (
          <Thumbnail attachment={serialized} thumbnail={thumbnail} />
        )}
      </div>

      {
        /*
         * Note, when new attachment is being created, the showMeta menu must
         * be displayed as otherwise, default values defined in form definition
         * won't be applied
         */
        isSidebarExpanded ? (
          <div className="flex flex-col gap-0">
            <ResourceView
              dialog={false}
              isDependent={false}
              isSubForm
              resource={showCustomForm ? related : attachment}
              /*
               * Have to override the title because formatted resource string
               * often includes a URL and other stuff (because it is used in
               * exports)
               */
              title={title}
              viewName={customViewName ?? originalAttachmentsView}
              onAdd={undefined}
              // eslint-disable-next-line react/jsx-handler-names
              onClose={f.never}
              onDeleted={undefined}
              onSaved={undefined}
            />
            <span className="flex-1" />
            {typeof originalUrl === 'string' && (
              <div className="flex flex-wrap gap-2">
                <Component
                  className="flex-1 whitespace-nowrap"
                  download={new URL(originalUrl).searchParams.get(
                    'downloadname'
                  )}
                  href={`/attachment_gw/proxy/${new URL(originalUrl).search}`}
                  target="_blank"
                  onClick={undefined}
                >
                  {notificationsText.download()}
                </Component>
                <Component
                  className="flex-1 whitespace-nowrap"
                  href={originalUrl}
                  target="_blank"
                  onClick={undefined}
                >
                  {commonText.openInNewTab()}
                </Component>
                {typeof table === 'object' &&
                typeof handleViewRecord === 'function' ? (
                  <AttachmentRecordLink
                    attachment={serialized}
                    className="flex-1"
                    related={[related, setRelated]}
                    table={table}
                    variant="button"
                    onViewRecord={handleViewRecord}
                  />
                ) : undefined}
              </div>
            )}
          </div>
        ) : undefined
      }
    </>
  );
}

function ImageTransformContent({
  alt,
  canToggleSidebar,
  isSidebarExpanded,
  onToggleSidebar,
  showControls,
  src,
  thumbnail,
}: {
  readonly alt: string;
  readonly canToggleSidebar: boolean;
  readonly isSidebarExpanded: boolean;
  readonly onToggleSidebar: (() => void) | undefined;
  readonly showControls: boolean;
  readonly src: string;
  readonly thumbnail: string | undefined;
}): JSX.Element {
  const { resetTransform } = useControls();
  const handleError = React.useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (typeof thumbnail === 'string') {
        const image = event.currentTarget;
        image.onerror = null;
        image.src = thumbnail;
      }
    },
    [thumbnail]
  );

  const handleLoad = React.useCallback(() => {
    resetTransform(0);
  }, [resetTransform]);
  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      style={{ '--transition-duration': 0 } as React.CSSProperties}
    >
      <TransformComponent
        contentClass="h-full w-full max-h-full max-w-full"
        wrapperClass="flex h-full w-full items-center justify-center"
        wrapperStyle={{ height: '100%', width: '100%' }}
      >
        <img
          alt={alt}
          className="h-full w-full max-h-full max-w-full object-contain"
          src={src}
          onError={handleError}
          onLoad={handleLoad}
        />
      </TransformComponent>
      {showControls ? (
        <div
          className="absolute right-2 top-2 flex items-center gap-2 rounded bg-white/60 p-1 text-white shadow-md dark:bg-black/60"
          style={{ pointerEvents: 'auto' }}
        >
          <ZoomControls
            canToggleSidebar={canToggleSidebar}
            isSidebarExpanded={isSidebarExpanded}
            onToggleSidebar={onToggleSidebar}
          />
        </div>
      ) : undefined}
    </div>
  );
}

function ZoomControls({
  canToggleSidebar,
  isSidebarExpanded,
  onToggleSidebar,
}: {
  readonly canToggleSidebar: boolean;
  readonly isSidebarExpanded: boolean;
  readonly onToggleSidebar: (() => void) | undefined;
}): JSX.Element {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <>
      <Button.Icon
        icon="zoomIn"
        title={commonText.zoom()}
        onClick={(): void => {
          zoomIn();
        }}
      />
      <Button.Icon
        icon="zoomOut"
        title={commonText.unzoom()}
        onClick={(): void => {
          zoomOut();
        }}
      />
      <Button.Icon
        icon="arrowPath"
        title={commonText.reset()}
        onClick={(): void => {
          resetTransform(0);
        }}
      />
      {canToggleSidebar && typeof onToggleSidebar === 'function' ? (
        <Button.Icon
          icon={isSidebarExpanded ? 'chevronDoubleRight' : 'chevronDoubleLeft'}
          title={
            isSidebarExpanded
              ? attachmentsText.hideForm()
              : attachmentsText.showForm()
          }
          onClick={(): void => {
            onToggleSidebar();
          }}
        />
      ) : undefined}
    </>
  );
}
