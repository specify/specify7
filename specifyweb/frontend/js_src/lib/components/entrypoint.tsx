/**
 * Entrypoint for the main front-end endpoint
 */

import React from 'react';

import { initialContext } from '../initialcontext';
import { commonText } from '../localization/common';
import { crash } from './errorboundary';
import { useBooleanState, useTitle } from './hooks';
import { Main } from './main';
import { entrypoint, SplashScreen } from './splashscreen';

// Show loading splash screen if didn't finish load within 2 seconds
const LOADING_TIMEOUT = 2000;

function Root(): JSX.Element | null {
  useTitle('');

  const [isContextLoaded, handleContextLoaded] = useBooleanState();
  const [showLoadingScreen, setShowLoadingScreen] = useBooleanState();

  React.useEffect(
    () => void initialContext.then(handleContextLoaded).catch(crash),
    [handleContextLoaded]
  );

  /*
   * Show loading screen only if didn't finish loading within 2 seconds.
   * Used to prevent briefly flashing the dialog on fast systems.
   */
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

entrypoint('main', () => <Root />);
