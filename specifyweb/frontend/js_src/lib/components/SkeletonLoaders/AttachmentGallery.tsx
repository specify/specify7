import React from 'react';

import { DEFAULT_FETCH_LIMIT } from '../DataModel/collection';
import { Skeleton } from './Skeleton';

export function AttachmentGallerySkeleton() {
  return (
    <>
      {Array.from({ length: DEFAULT_FETCH_LIMIT }, () => (
        <Skeleton.Square />
      ))}
    </>
  );
}
