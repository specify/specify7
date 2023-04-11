import React from 'react';
import ContentLoader from 'react-content-loader';
import { userPreferences } from '../Preferences/userPreferences';

export function FormSkeleton(): JSX.Element {
  const [motionPref] = userPreferences.use('general', 'ui', 'reduceMotion');
  return (
    <div className="h-full w-[120vh]">
      <ContentLoader
        viewBox="0 0 200 400"
        backgroundColor={'#333'}
        foregroundColor={'#999'}
        speed={3}
        animate={motionPref === 'reduce' ? false : true}
      >
        <rect x="9" y="6" rx="2" ry="2" width="22" height="3" />
        <rect x="33" y="5" rx="2" ry="2" width="41" height="5" />
        <rect x="107" y="6" rx="2" ry="2" width="22" height="3" />
        <rect x="131" y="5" rx="2" ry="2" width="25" height="5" />
        <rect x="157" y="5" rx="2" ry="2" width="25" height="5" />

        <rect x="9" y="18" rx="2" ry="2" width="52" height="5" />
        <circle cx="66" cy="20.5" r="3" />
        <circle cx="74" cy="20.5" r="3" />
        <rect x="9" y="25" rx="2" ry="2" width="22" height="3" />

        <rect x="28" y="35" rx="2" ry="2" width="22" height="3" />
        <rect x="54" y="34" rx="2" ry="2" width="100" height="5" />
        <circle cx="158" cy="36.5" r="2" />
        <circle cx="163" cy="36.5" r="2" />
        <circle cx="168" cy="36.5" r="2" />

        <rect x="9" y="53" rx="2" ry="2" width="52" height="5" />
        <circle cx="66" cy="55.5" r="3" />
        <rect x="9" y="60" rx="2" ry="2" width="22" height="3" />

        <rect x="86" y="47.5" rx="2" ry="2" width="96" height="20" />

        <rect x="9" y="73" rx="2" ry="2" width="52" height="5" />
        <circle cx="66" cy="75.5" r="3" />

        <rect x="9" y="93" rx="2" ry="2" width="22" height="3" />
        <rect x="9" y="98" rx="2" ry="2" width="25" height="7" />
        <rect x="40" y="98" rx="2" ry="2" width="25" height="7" />
        <rect x="125" y="98" rx="2" ry="2" width="25" height="7" />

        <rect x="9" y="120" rx="2" ry="2" width="130" height="5" />
      </ContentLoader>
    </div>
  );
}
