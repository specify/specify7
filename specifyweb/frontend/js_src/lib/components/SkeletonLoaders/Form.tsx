import React from 'react';

import { Skeleton } from './Skeleton';

export function FormSkeleton() {
  return (
    <Skeleton.Root className="flex-col">
      <div className="justify-beween m-4 flex flex-col flex-wrap gap-4">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div className="m-4 flex items-center gap-2">
            <Skeleton.Line />
            <Skeleton.SmallRectangle />
          </div>
          <div className="m-4 flex gap-2">
            <Skeleton.Line />
            <Skeleton.SmallRectangle />
            <Skeleton.SmallCircle />
            <Skeleton.SmallCircle />
            <Skeleton.SmallCircle />
          </div>
          <div className="m-4 flex items-center gap-2">
            <Skeleton.Line />
            <Skeleton.SmallRectangle />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton.SmallRectangle />
          <Skeleton.SmallSquare />
          <Skeleton.SmallSquare />
        </div>
        <div>
          <Skeleton.LongLine />
        </div>
      </div>

      <div className="justify-beween m-4 flex flex-col flex-wrap gap-4">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div className="flex gap-2">
            <Skeleton.SmallRectangle />
            <Skeleton.SmallSquare />
            <Skeleton.SmallSquare />
          </div>
          <div className="m-4 flex items-center gap-2">
            <Skeleton.Line />
            <Skeleton.SmallRectangle />
          </div>
          <div className="m-4 flex items-center gap-2">
            <Skeleton.Line />
            <Skeleton.SmallRectangle />
          </div>
        </div>
        <div>
          <div className="flex gap-2">
            <Skeleton.SmallSquare />
            <Skeleton.SmallSquare />
            <Skeleton.SmallRectangle />
          </div>
          <div className="m-4 flex justify-center gap-2">
            <Skeleton.Line />
            <Skeleton.SmallRectangle />
            <Skeleton.SmallCircle />
            <Skeleton.SmallCircle />
            <Skeleton.SmallCircle />
          </div>
        </div>
      </div>

      <div className="justify-beween m-4 flex flex-col flex-wrap gap-4">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div className="flex gap-2">
            <Skeleton.Rectangle />
          </div>
          <div className="m-4 flex items-center gap-2">
            <Skeleton.Line />
            <Skeleton.Line />
          </div>
          <div className="m-4 flex items-center gap-2">
            <Skeleton.Line />
            <Skeleton.SmallRectangle />
          </div>
        </div>
        <div>
          <Skeleton.LongLine />
        </div>
        <div>
          <div className="flex gap-2">
            <Skeleton.SmallRectangle />
            <Skeleton.SmallSquare />
            <Skeleton.SmallSquare />
          </div>
        </div>
      </div>
    </Skeleton.Root>
  );
}
