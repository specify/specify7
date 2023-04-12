import React, { ReactNode } from 'react';
import ContentLoader from 'react-content-loader';
import { userPreferences } from '../Preferences/userPreferences';
import { useDarkMode } from '../Preferences/Hooks';

type SkeletonProps = {
  speed?: number;
  viewBox?: string;
  className?: string;
  children: ReactNode;
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
        backgroundColor={themePref === true ? '#333' : '#e2e2e5'}
        foregroundColor={themePref === true ? '#999' : '#f5f3f5'}
        speed={speed}
        viewBox={viewBox}
      >
        {children}
      </ContentLoader>
    </div>
  );
}
