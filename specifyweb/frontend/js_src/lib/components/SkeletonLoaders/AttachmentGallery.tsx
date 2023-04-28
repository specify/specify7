import React from 'react';

import { DEFAULT_FETCH_LIMIT } from '../DataModel/collection';
import { Skeleton } from './Skeleton';

export function AttachmentGallerySkeleton() {
  return (
    <Skeleton.Root className="contents">
      {Array.from({ length: DEFAULT_FETCH_LIMIT }, () => (
        <Skeleton.Square />
      ))}
    </Skeleton.Root>
  );
}
