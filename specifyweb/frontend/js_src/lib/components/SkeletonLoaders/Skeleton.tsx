import type { ReactNode } from 'react';
import React from 'react';
import ContentLoader from 'react-content-loader';

import { userPreferences } from '../Preferences/userPreferences';

type SkeletonProps = {
  readonly speed?: number;
  readonly viewBox?: string;
  readonly className?: string;
  readonly children: ReactNode;
};

export function Skeleton({
  speed = 3,
  viewBox = '0 0 200 400',
  className = 'h-full w-full',
  children,
}: SkeletonProps): JSX.Element {
  const [motionPref] = userPreferences.use('general', 'ui', 'reduceMotion');
  return (
    <div className={className}>
      <ContentLoader
        animate={motionPref !== 'reduce'}
        backgroundColor="#333"
        foregroundColor="#999"
        speed={speed}
        viewBox={viewBox}
      >
        {children}
      </ContentLoader>
    </div>
  );
}
