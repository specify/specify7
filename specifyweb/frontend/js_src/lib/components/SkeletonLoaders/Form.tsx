import React from 'react';
import { Skeleton } from './Skeleton';

export function FormSkeleton() {
  return (
    <div className="w-[120vh]">
      {Array.from({ length: 3 }, () => (
        <div className="justify-beween m-1 mb-8 flex flex-col flex-wrap gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Skeleton.Line />
              <Skeleton.SmallRectangle />
            </div>
            <div className="flex gap-2">
              <Skeleton.Line />
              <Skeleton.SmallRectangle />
              <Skeleton.SmallCircle />
              <Skeleton.SmallCircle />
              <Skeleton.SmallCircle />
            </div>
            <div className="flex items-center gap-2">
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
      ))}
    </div>
  );
}
