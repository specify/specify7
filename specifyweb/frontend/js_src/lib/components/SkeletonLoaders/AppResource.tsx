import React from 'react';
import ContentLoader from 'react-content-loader';
import { userPreferences } from '../Preferences/userPreferences';

export function AppResourceSkeleton(): JSX.Element {
  const [motionPref] = userPreferences.use('general', 'ui', 'reduceMotion');
  return (
    <div className="h-full w-full">
      <ContentLoader
        viewBox="0 0 240 400"
        backgroundColor={'#333'}
        foregroundColor={'#999'}
        speed={3}
        animate={motionPref === 'reduce' ? false : true}
      >
        <rect x="28" y="1" rx="3" ry="3" width="141" height="8" />
        <rect x="10" y="0" rx="2" ry="2" width="10" height="10" />
        <rect x="190" y="0" rx="2" ry="2" width="10" height="10" />
        <rect x="203" y="0" rx="2" ry="2" width="15" height="10" />
        <rect x="220.5" y="0" rx="2" ry="2" width="15" height="10" />
        <rect x="28" y="28" rx="2" ry="2" width="195" height="8" />
        <rect x="28" y="48" rx="2" ry="2" width="195" height="8" />
        <rect x="28" y="68" rx="2" ry="2" width="195" height="8" />
        <rect x="28" y="88" rx="2" ry="2" width="195" height="8" />
        <rect x="28" y="108" rx="2" ry="2" width="195" height="8" />
        <rect x="28" y="128" rx="2" ry="2" width="195" height="8" />
        <rect x="28" y="148" rx="2" ry="2" width="195" height="8" />
        <rect x="28" y="168" rx="2" ry="2" width="195" height="8" />
        <rect x="28" y="188" rx="2" ry="2" width="195" height="8" />
        <rect x="28" y="208" rx="2" ry="2" width="195" height="8" />
        <rect x="28" y="228" rx="2" ry="2" width="195" height="8" />
        <rect x="28" y="248" rx="2" ry="2" width="195" height="8" />
      </ContentLoader>
    </div>
  );
}
