import type { ReactNode } from 'react';
import React from 'react';
import ContentLoader from 'react-content-loader';

import { useDarkMode } from '../Preferences/Hooks';
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
  const themePref = useDarkMode();
  return (
    <div className={className}>
      <ContentLoader
        animate={motionPref !== 'reduce'}
        backgroundColor={themePref ? '#333' : '#e2e2e5'}
        foregroundColor={themePref ? '#999' : '#f5f3f5'}
        speed={speed}
        viewBox={viewBox}
      >
        {children}
      </ContentLoader>
    </div>
  );
}
