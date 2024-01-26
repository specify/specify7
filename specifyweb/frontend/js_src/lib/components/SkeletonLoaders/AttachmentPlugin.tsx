import React from 'react';

import { Skeleton } from './Skeleton';

export function AttachmentPluginSkeleton() {
  return (
    <Skeleton.Root className="flex-col flex-wrap md:flex-row">
      <Skeleton.TallRectangle className="min-w-[30vh] md:flex-1" />
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 ">
          <Skeleton.Rectangle />
          <Skeleton.SmallSquare />
        </div>
        {Array.from({ length: 6 }, (_, index) => (
          <div className="flex max-w-[80%] gap-4 p-2" key={index}>
            <Skeleton.Line />
            <Skeleton.Rectangle />
          </div>
        ))}
        <div className="flex max-w-[50%] gap-4">
          <Skeleton.Rectangle />
          <Skeleton.Rectangle />
        </div>
      </div>
    </Skeleton.Root>
  );
}
