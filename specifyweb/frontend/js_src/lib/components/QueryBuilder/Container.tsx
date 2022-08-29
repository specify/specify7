import React from 'react';

import { usePref } from '../UserPreferences/usePref';

export function QueryContainer({
  children,
  isEmbedded,
  forwardRef,
  resultsShown,
  onScroll: handleScroll,
}: {
  readonly children: React.ReactNode;
  readonly isEmbedded: boolean;
  readonly forwardRef: React.RefCallback<HTMLDivElement | null>;
  readonly resultsShown: boolean;
  readonly onScroll: () => void;
}): JSX.Element {
  const [stickyScrolling] = usePref(
    'queryBuilder',
    'behavior',
    'stickyScrolling'
  );

  return (
    <div
      className={`
            grid flex-1 grid-cols-1 gap-4 overflow-y-auto
            ${stickyScrolling ? 'snap-y snap-proximity' : ''}
            ${
              isEmbedded
                ? ''
                : resultsShown
                ? 'grid-rows-[100%_100%]'
                : 'grid-rows-[100%]'
            }
            ${isEmbedded ? '' : '-mx-4 px-4'}
          `}
      ref={forwardRef}
      onScroll={handleScroll}
    >
      {children}
    </div>
  );
}
