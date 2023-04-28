import React from 'react';

import { Skeleton } from './Skeleton';

export function QueryBuilderSkeleton() {
  return (
    <Skeleton.Root className="h-full flex-col justify-between p-4">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Skeleton.SmallCircle />
            <Skeleton.Line className="!w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton.SmallRectangle />
            <Skeleton.SmallRectangle />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col gap-2">
            <Skeleton.TallRectangle className="h-44 !w-56" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton.TallRectangle className="h-44 !w-56" />
          </div>
          <Skeleton.ThinRectangle className="!h-44" />
        </div>
      </div>
      <div className="flex justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton.SmallSquare />
          <Skeleton.Line />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton.SmallSquare />
          <Skeleton.Line />
          <Skeleton.SmallRectangle />
          <Skeleton.SmallRectangle />
        </div>
      </div>
    </Skeleton.Root>
  );
}
