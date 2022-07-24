/**
 * Entrypoint for the main front-end endpoint
 */

import React from 'react';

import { f } from '../functools';
import { initialContext } from '../initialcontext';
import { commonText } from '../localization/common';
import { SplashScreen } from './entrypoint';
import { useAsyncState, useBooleanState, useTitle } from './hooks';
import { Main } from './main';

// Show loading splash screen if didn't finish load within 2 seconds
const LOADING_TIMEOUT = 2000;

const fetchContext = async (): Promise<true> => initialContext.then(f.true);

export function Root(): JSX.Element | null {
  useTitle('');

  const [isContextLoaded = false] = useAsyncState(fetchContext, false);
  /*
   * Show loading screen only if didn't finish loading within 2 seconds.
   * This prevents briefly flashing the loading dialog on fast systems.
   */
  const [showLoadingScreen, setShowLoadingScreen] = useBooleanState();
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  React.useEffect(() => {
    if (timeoutRef.current !== undefined)
      globalThis.clearTimeout(timeoutRef.current);
    if (!isContextLoaded)
      timeoutRef.current = globalThis.setTimeout(
        setShowLoadingScreen,
        LOADING_TIMEOUT
      );
  }, [isContextLoaded, setShowLoadingScreen]);

  return isContextLoaded ? (
    <Main />
  ) : showLoadingScreen ? (
    <SplashScreen>
      <h2 className="text-center">{commonText('loading')}</h2>
    </SplashScreen>
  ) : null;
}
