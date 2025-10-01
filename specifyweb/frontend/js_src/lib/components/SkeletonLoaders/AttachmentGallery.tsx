import React from 'react';

import { DEFAULT_FETCH_LIMIT } from '../DataModel/collection';
import { Skeleton } from './Skeleton';

export function AttachmentGallerySkeleton({
  fetchNumber = DEFAULT_FETCH_LIMIT,
}: {
  readonly fetchNumber?: number;
}): JSX.Element {
  return (
    <Skeleton.Root className="contents">
      {Array.from({ length: fetchNumber }, (_, index) => (
        <Skeleton.Square key={index} />
      ))}
    </Skeleton.Root>
  );
}
