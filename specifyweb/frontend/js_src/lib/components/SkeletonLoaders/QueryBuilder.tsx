import React from 'react';
import ContentLoader from 'react-content-loader';
import { userPreferences } from '../Preferences/userPreferences';

export function QueryBuilderSkeleton(): JSX.Element {
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
        <rect x="9" y="5" rx="2" ry="2" width="5" height="5" />
        <rect x="20" y="5" rx="2" ry="2" width="41" height="5" />
        <rect x="132" y="5" rx="2" ry="2" width="25" height="5" />
        <rect x="161" y="5" rx="2" ry="2" width="25" height="5" />

        <rect x="9" y="20" rx="2" ry="2" width="52" height="5" />
        <rect x="9" y="27" rx="2" ry="2" width="52" height="38" />
        <rect x="65" y="27" rx="2" ry="2" width="52" height="38" />
        <rect x="121" y="27" rx="2" ry="2" width="5" height="38" />

        <rect x="11" y="80" rx="2" ry="2" width="185" height="5" />
        <rect x="198" y="80" rx="2" ry="2" width="5" height="5" />
        <rect x="204" y="80" rx="2" ry="2" width="5" height="5" />
        <rect x="210" y="80" rx="2" ry="2" width="5" height="5" />
        <rect x="216" y="80" rx="2" ry="2" width="5" height="5" />

        <rect x="13" y="190" rx="2" ry="2" width="5" height="5" />
        <rect x="22" y="190" rx="2" ry="2" width="45" height="5" />

        <rect x="122" y="190" rx="2" ry="2" width="5" height="5" />
        <rect x="168" y="188.5" rx="2" ry="2" width="30" height="7" />
        <rect x="132" y="188.5" rx="2" ry="2" width="30" height="7" />
      </ContentLoader>
    </div>
  );
}
