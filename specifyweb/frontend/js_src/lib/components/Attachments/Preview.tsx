import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { Attachment } from '../DataModel/types';
import { LoadingScreen } from '../Molecules/Dialog';
import type { AttachmentThumbnail } from './attachments';
import { fetchOriginalUrl } from './attachments';

export function AttachmentPreview({
  thumbnail,
  attachment,
}: {
  readonly thumbnail: AttachmentThumbnail;
  readonly attachment: SerializedResource<Attachment>;
}): JSX.Element {
  const [originalUrl] = useAsyncState(
    React.useCallback(async () => fetchOriginalUrl(attachment), [attachment]),
    false
  );

  const [isPreviewPending, handlePreviewPending, handleNoPreviewPending] =
    useBooleanState();
  React.useEffect(() => {
    if (isPreviewPending && typeof originalUrl === 'string') {
      handleNoPreviewPending();
      globalThis.open(originalUrl, '_blank');
    }
  }, [isPreviewPending, originalUrl, handleNoPreviewPending]);

  const children = (
    <>
      <img
        alt={attachment.title || thumbnail.alt}
        className={`
          max-h-full max-w-full border-8 border-white object-contain
          dark:border-black
        `}
        src={thumbnail.src}
        style={{
          width: `${thumbnail.width}px`,
          height: `${thumbnail.height}px`,
        }}
      />
      {isPreviewPending && <LoadingScreen />}
    </>
  );
  const className = `
    flex items-center justify-center rounded bg-white shadow-lg shadow-gray-300
    transition hover:shadow-md hover:shadow-gray-400 dark:bg-black
  `;
  return typeof originalUrl === 'string' ? (
    <Link.Default className={className} href={originalUrl} target="_blank">
      {children}
    </Link.Default>
  ) : (
    <Button.LikeLink
      className={className}
      /*
       * If clicked on a link before originalUrl is loaded,
       * remember that and open the link as soon as loaded.
       * In the meanwhile, display a loading screen
       */
      onClick={handlePreviewPending}
    >
      {children}
    </Button.LikeLink>
  );
}
