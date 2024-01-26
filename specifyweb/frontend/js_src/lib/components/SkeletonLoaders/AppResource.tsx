import React from 'react';

import { Skeleton } from './Skeleton';

export function AppResourceSkeleton() {
  return (
    <Skeleton.Root className="w-full flex-col">
      <div className="flex justify-between gap-4">
        <div className="flex gap-2">
          <Skeleton.SmallSquare />
          <Skeleton.Rectangle />
          <Skeleton.SmallCircle />
        </div>
        <div className="flex gap-2">
          <Skeleton.SmallSquare />
          <Skeleton.SmallRectangle />
          <Skeleton.SmallRectangle />
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: 15 }, (_, index) => (
          <Skeleton.LongLine key={index} />
        ))}
      </div>
    </Skeleton.Root>
  );
}
