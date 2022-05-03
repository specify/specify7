/**
 * Entrypoint for the main front-end endpoint
 */

import React from 'react';

import { listen } from '../events';
import { initialContext } from '../initialcontext';
import { commonText } from '../localization/common';
import { startApp } from '../startapp';
import { className } from './basic';
import { crash } from './errorboundary';
import { useBooleanState, useTitle } from './hooks';
import { Main } from './main';
import { goTo } from './navigation';
import { entrypoint, SplashScreen } from './splashscreen';

// TODO: document that you can alt click on new tab links
function handleClick(event: Readonly<MouseEvent>): void {
  const link = (event.target as HTMLElement)?.closest('a');
  if (
    link !== null &&
    link.href.length > 0 &&
    link.getAttribute('href')?.startsWith('#') === false &&
    link.getAttribute('download') === null &&
    (link.target !== '_blank' || event.altKey) &&
    !link.classList.contains(className.navigationHandled)
  ) {
    event.preventDefault();
    goTo(link.href);
  }
}

// Show loading splash screen if didn't finish load within 2 seconds
const LOADING_TIMEOUT = 2000;

function Root(): JSX.Element | null {
  useTitle('');

  const [isContextLoaded, handleContextLoaded] = useBooleanState();
  const [isHeaderLoaded, setHeaderLoaded] = useBooleanState();
  const [showLoadingScreen, setShowLoadingScreen] = useBooleanState();

  React.useEffect(
    () => void initialContext.then(handleContextLoaded).catch(crash),
    [handleContextLoaded]
  );

  /*
   * Show loading screen only if didn't finish loading within 2 seconds.
   * This is to prevent briefly flashing the dialog on fast systems.
   */
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  React.useEffect(() => {
    if (typeof timeoutRef.current !== 'undefined')
      clearTimeout(timeoutRef.current);
    if (!isContextLoaded)
      timeoutRef.current = setTimeout(setShowLoadingScreen, LOADING_TIMEOUT);
  }, [isContextLoaded, setShowLoadingScreen]);

  React.useEffect(() => {
    if (!isHeaderLoaded) return undefined;
    startApp();
    return listen(document.body, 'click', handleClick);
  }, [isHeaderLoaded]);

  return isContextLoaded ? (
    <Main onLoaded={setHeaderLoaded} />
  ) : showLoadingScreen ? (
    <SplashScreen>
      <h2 className="text-center">{commonText('loading')}</h2>
    </SplashScreen>
  ) : null;
}

entrypoint('main', () => <Root />);
