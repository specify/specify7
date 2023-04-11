import React from 'react';
import ContentLoader from 'react-content-loader';

import { userPreferences } from '../Preferences/userPreferences';

export function QueryBuilderSkeleton(): JSX.Element {
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
        <rect height="5" rx="2" ry="2" width="5" x="9" y="5" />
        <rect height="5" rx="2" ry="2" width="41" x="20" y="5" />
        <rect height="5" rx="2" ry="2" width="25" x="132" y="5" />
        <rect height="5" rx="2" ry="2" width="25" x="161" y="5" />

        <rect height="5" rx="2" ry="2" width="52" x="9" y="20" />
        <rect height="38" rx="2" ry="2" width="52" x="9" y="27" />
        <rect height="38" rx="2" ry="2" width="52" x="65" y="27" />
        <rect height="38" rx="2" ry="2" width="5" x="121" y="27" />

        <rect height="5" rx="2" ry="2" width="185" x="11" y="80" />
        <rect height="5" rx="2" ry="2" width="5" x="198" y="80" />
        <rect height="5" rx="2" ry="2" width="5" x="204" y="80" />
        <rect height="5" rx="2" ry="2" width="5" x="210" y="80" />
        <rect height="5" rx="2" ry="2" width="5" x="216" y="80" />

        <rect height="5" rx="2" ry="2" width="5" x="13" y="190" />
        <rect height="5" rx="2" ry="2" width="45" x="22" y="190" />

        <rect height="5" rx="2" ry="2" width="5" x="122" y="190" />
        <rect height="7" rx="2" ry="2" width="30" x="168" y="188.5" />
        <rect height="7" rx="2" ry="2" width="30" x="132" y="188.5" />
      </ContentLoader>
    </div>
  );
}
