import React from 'react';
import ContentLoader from 'react-content-loader';

import { userPreferences } from '../Preferences/userPreferences';

export function AppResourceSkeleton(): JSX.Element {
  const [motionPref] = userPreferences.use('general', 'ui', 'reduceMotion');
  return (
    <div className="h-full w-full">
      <ContentLoader
        animate={motionPref !== 'reduce'}
        backgroundColor="#333"
        foregroundColor="#999"
        speed={3}
        viewBox="0 0 240 400"
      >
        <rect height="8" rx="3" ry="3" width="141" x="28" y="1" />
        <rect height="10" rx="2" ry="2" width="10" x="10" y="0" />
        <rect height="10" rx="2" ry="2" width="10" x="190" y="0" />
        <rect height="10" rx="2" ry="2" width="15" x="203" y="0" />
        <rect height="10" rx="2" ry="2" width="15" x="220.5" y="0" />
        <rect height="8" rx="2" ry="2" width="195" x="28" y="28" />
        <rect height="8" rx="2" ry="2" width="195" x="28" y="48" />
        <rect height="8" rx="2" ry="2" width="195" x="28" y="68" />
        <rect height="8" rx="2" ry="2" width="195" x="28" y="88" />
        <rect height="8" rx="2" ry="2" width="195" x="28" y="108" />
        <rect height="8" rx="2" ry="2" width="195" x="28" y="128" />
        <rect height="8" rx="2" ry="2" width="195" x="28" y="148" />
        <rect height="8" rx="2" ry="2" width="195" x="28" y="168" />
        <rect height="8" rx="2" ry="2" width="195" x="28" y="188" />
        <rect height="8" rx="2" ry="2" width="195" x="28" y="208" />
        <rect height="8" rx="2" ry="2" width="195" x="28" y="228" />
        <rect height="8" rx="2" ry="2" width="195" x="28" y="248" />
      </ContentLoader>
    </div>
  );
}
