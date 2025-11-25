import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useDelay } from '../../hooks/useDelay';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import { SECOND } from '../Atoms/timeUnits';
import { crash, softFail } from '../Errors/Crash';
import { useMenuItems } from '../Header/menuItemProcessing';
import { initialContext, secondaryContext } from '../InitialContext';
import { Main } from './Main';
import { SplashScreen } from './SplashScreen';

// Show loading splash screen if didn't finish load within 2 seconds
const LOADING_TIMEOUT = 2 * SECOND;

const fetchContext =
  (
    context: Promise<unknown>,
    errorMode: 'crash' | 'console'
  ): (() => Promise<true | void>) =>
  async () =>
    context.then(f.true).catch(errorMode === 'crash' ? crash : softFail);

/**
 * - Load initial and secondary context
 * - Display loading screen while loading
 * - Display the main component afterward
 */
export function ContextLoader(): JSX.Element | null {
  const [isContextLoaded = false] = useAsyncState(
    React.useCallback(fetchContext(initialContext, 'crash'), []),
    false
  );
  const [_secondaryContextLoaded = false] = useAsyncState(
    React.useCallback(
      isContextLoaded ? fetchContext(secondaryContext, 'console') : f.undefined,
      [isContextLoaded]
    ),
    false
  );
  const menuItems = useMenuItems();
  const isLoaded = isContextLoaded && typeof menuItems === 'object';

  /*
   * Show loading screen only if didn't finish loading within 2 seconds.
   * This prevents briefly flashing the loading dialog on fast systems.
   */
  const showLoadingScreen = useDelay(!isLoaded, LOADING_TIMEOUT);

  return isLoaded ? (
    <Main menuItems={menuItems} />
  ) : showLoadingScreen ? (
    <SplashScreen>
      <h2 className="text-center">{commonText.loading()}</h2>
    </SplashScreen>
  ) : null;
}
