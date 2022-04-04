import React from 'react';

import { Http, ping } from '../../ajax';
import { cachableUrls } from '../../initialcontext';
import commonText from '../../localization/common';
import { useAsyncState } from '../hooks';
import type { UserTool } from '../main';
import { Dialog } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';

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
      header={commonText('cleanCache')}
      onClose={(): void => window.location.reload()}
      buttons={commonText('reload')}
    >
      {commonText('cleanedCacheDialogMessage')}
    </Dialog>
  ) : null;
}

const View = createBackboneView(CacheBuster);

const userTool: UserTool = {
  task: 'cache-buster',
  title: commonText('cleanCache'),
  isOverlay: false,
  view: () => new View(),
  groupLabel: commonText('developers'),
};

export default userTool;
