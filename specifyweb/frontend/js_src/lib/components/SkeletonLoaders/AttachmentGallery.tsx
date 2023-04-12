import React from 'react';

import { DEFAULT_FETCH_LIMIT } from '../DataModel/collection';
import { Skeleton } from './Skeleton';

export function AttachmentGallerySkeleton() {
  return <Skeleton viewBox="0 0 115 150">{createRectangles()}</Skeleton>;
}

function createRectangles() {
  const rectWidth = 22;
  const rectHeight = 22;
  const rectRadius = 2;
  return Array.from({ length: DEFAULT_FETCH_LIMIT }, (_, index) => (
    <rect
      height={rectHeight}
      rx={rectRadius}
      ry={rectRadius}
      width={rectWidth}
      x={rectWidth * (index % 4) + 5}
      y={rectHeight + (rectHeight + 10) * Math.floor(index / 4)}
    />
  ));
}
