import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { Attachment } from '../DataModel/types';
import type { AttachmentThumbnail } from './attachments';
import { fetchThumbnail } from './attachments';

export function AttachmentPreview({
  attachment,
  onOpen: handleOpen,
}: {
  readonly attachment: SerializedResource<Attachment>;
  readonly onOpen: () => void;
}): JSX.Element {
  const [thumbnail] = useAsyncState(
    React.useCallback(async () => fetchThumbnail(attachment), [attachment]),
    false
  );

  return (
    <div
      className={`
        flex items-center justify-center rounded bg-white shadow-md
        shadow-gray-300 transition hover:shadow-md hover:shadow-gray-400
        dark:bg-black
      `}
    >
      <button type="button" onClick={handleOpen}>
        <Thumbnail attachment={attachment} thumbnail={thumbnail} />
      </button>
    </div>
  );
}

export function Thumbnail({
  attachment,
  thumbnail,
}: {
  readonly attachment: SerializedResource<Attachment>;
  readonly thumbnail: AttachmentThumbnail | undefined;
}): JSX.Element | null {
  return thumbnail === undefined ? null : (
    <img
      alt={
        typeof attachment.title === 'string' && attachment.title.length > 0
          ? attachment.title
          : thumbnail.alt
      }
      className={`
        max-h-full max-w-full border-2 border-white object-contain
        dark:border-black
      `}
      src={thumbnail.src}
      style={{
        width: `${thumbnail.width}px`,
        height: `${thumbnail.height}px`,
      }}
    />
  );
}
