/**
 * Force reload cachable resources
 */

import React from 'react';

import { Http, ping } from '../../ajax';
import { cachableUrls } from '../../initialcontext';
import { commonText } from '../../localization/common';
import { useAsyncState } from '../hooks';
import type { UserTool } from '../main';
import { Dialog } from '../modaldialog';
import { createBackboneView } from '../reactbackboneextend';

function CacheBuster(): JSX.Element | null {
  const [isLoaded] = useAsyncState(
    React.useCallback(
      async () =>
        Promise.all(
          Array.from(cachableUrls, async (endpoint) =>
            ping(
              endpoint,
              { method: 'HEAD', cache: 'no-cache' },
              {
                expectedResponseCodes: [Http.OK, Http.NOT_FOUND],
              }
            ).then(() => console.log(`Cleaned cache from ${endpoint}`))
          )
        ),
      []
    ),
    true
  );

  return isLoaded ? (
    <Dialog
      header={commonText('clearCache')}
      onClose={(): void => window.location.assign('/')}
      buttons={commonText('reload')}
    >
      {commonText('cleanerCacheDialogMessage')}
    </Dialog>
  ) : null;
}

const View = createBackboneView(CacheBuster);

export const userTool: UserTool = {
  task: 'cache-buster',
  title: commonText('clearCache'),
  isOverlay: false,
  view: () => new View(),
  groupLabel: commonText('developers'),
};
