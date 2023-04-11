import React from 'react';
import ContentLoader from 'react-content-loader';
import { userPreferences } from '../Preferences/userPreferences';

export function AttachmentPluginSkeleton(): JSX.Element {
  const [motionPref] = userPreferences.use('general', 'ui', 'reduceMotion');
  return (
    <div className="h-full w-full">
      <ContentLoader
        viewBox="0 0 220 400"
        backgroundColor={'#333'}
        foregroundColor={'#999'}
        speed={3}
        animate={motionPref === 'reduce' ? false : true}
      >
        <rect x="7" y="0" rx="2" ry="2" width="120" height="140" />
        <rect x="135" y="0" rx="2" ry="2" width="36" height="7" />
        <rect x="191" y="0" rx="2" ry="2" width="12" height="12" />
        <rect x="135" y="18" rx="2" ry="2" width="68" height="5" />
        <rect x="135" y="28" rx="2" ry="2" width="68" height="5" />
        <rect x="135" y="38" rx="2" ry="2" width="68" height="5" />
        <rect x="135" y="48" rx="2" ry="2" width="68" height="5" />
        <rect x="135" y="58" rx="2" ry="2" width="68" height="5" />
        <rect x="135" y="68" rx="2" ry="2" width="33" height="5" />
        <rect x="135" y="78" rx="2" ry="2" width="68" height="5" />
        <rect x="135" y="88" rx="2" ry="2" width="68" height="5" />
        <rect x="135" y="98" rx="2" ry="2" width="68" height="5" />
        <rect x="135" y="125" rx="2" ry="2" width="30" height="15" />
        <rect x="173" y="125" rx="2" ry="2" width="30" height="15" />
      </ContentLoader>
    </div>
  );
}
