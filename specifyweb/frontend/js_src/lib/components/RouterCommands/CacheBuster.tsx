/**
 * Force reload cachable resources
 */

import React from 'react';

import { ping } from '../../utils/ajax/ping';
import { Http } from '../../utils/ajax/helpers';
import { cachableUrls } from '../InitialContext';
import { commonText } from '../../localization/common';
import { Dialog } from '../Molecules/Dialog';
import {useAsyncState} from '../../hooks/useAsyncState';

export const clearCache = async (): Promise<true> =>
  Promise.all(
    Array.from(cachableUrls, async (endpoint) =>
      ping(
        endpoint,
        { method: 'HEAD', cache: 'no-cache' },
        {
          expectedResponseCodes: [Http.OK, Http.NOT_FOUND],
        }
        // eslint-disable-next-line no-console
      ).then(() => console.log(`Cleaned cache from ${endpoint}`))
    )
  ).then(() => {
    localStorage.clear();
    return true;
  });

export function CacheBuster(): JSX.Element | null {
  const [isLoaded] = useAsyncState(clearCache, true);

  return isLoaded === true ? (
    <Dialog
      buttons={commonText('goToHomepage')}
      /*
       * Can not simply reload the page here, as that would open the
       * cache buster dialog again causing a perpetual loop.
       */
      header={commonText('clearCache')}
      onClose={(): void => globalThis.location.assign('/specify/')}
    >
      {commonText('clearedCacheDialogText')}
    </Dialog>
  ) : null;
}
