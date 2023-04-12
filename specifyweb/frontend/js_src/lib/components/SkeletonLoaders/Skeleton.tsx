import React, { ReactNode } from 'react';
import ContentLoader from 'react-content-loader';
import { userPreferences } from '../Preferences/userPreferences';

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
