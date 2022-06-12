/**
 * Force reload cachable resources
 */

import React from 'react';

import { Http, ping } from '../../ajax';
import { f } from '../../functools';
import { cachableUrls } from '../../initialcontext';
import { commonText } from '../../localization/common';
import { useAsyncState } from '../hooks';
import type { UserTool } from '../main';
import { Dialog } from '../modaldialog';

export const clearCache = async (): Promise<true> =>
  Promise.all(
    Array.from(cachableUrls, async (endpoint) =>
      ping(
        endpoint,
        { method: 'HEAD', cache: 'no-cache' },
        {
          expectedResponseCodes: [Http.OK, Http.NOT_FOUND],
        }
      ).then(() => f.log(`Cleaned cache from ${endpoint}`))
    )
  ).then(f.true);

function CacheBuster(): JSX.Element | null {
  const [isLoaded] = useAsyncState(clearCache, true);

  return isLoaded === true ? (
    <Dialog
      header={commonText('clearCache')}
      onClose={(): void => window.location.reload()}
      buttons={commonText('reload')}
    >
      {commonText('clearedCacheDialogText')}
    </Dialog>
  ) : null;
}

export const userTool: UserTool = {
  task: 'cache-buster',
  title: commonText('clearCache'),
  isOverlay: false,
  view: () => <CacheBuster />,
  groupLabel: commonText('developers'),
};
