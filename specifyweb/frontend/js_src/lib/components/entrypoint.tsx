import '../../css/main.css';

import React from 'react';
import ReactDOM from 'react-dom';

import { initialContext, unlockInitialContext } from '../initialcontext';
import commonText from '../localization/common';
import * as navigation from '../navigation';
import startApp from '../startapp';
import { className } from './basic';
import { Contexts } from './contexts';
import { crash } from './errorboundary';
import { useBooleanState, useTitle } from './hooks';
import { Main } from './main';
import { SplashScreen } from './splashscreen';

unlockInitialContext();

function handleClick(event: Readonly<MouseEvent>): void {
  const link = (event.target as HTMLElement)?.closest('a');
  if (
    link !== null &&
    link.href.length > 0 &&
    (link.target !== '_blank' || event.altKey) &&
    !link.classList.contains(className.navigationHandled)
  ) {
    event.preventDefault();
    navigation.go(link.href);
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
    () => void initialContext.catch(crash).finally(handleContextLoaded),
    [handleContextLoaded]
  );

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
    document.body.addEventListener('click', handleClick);
    startApp();
    return (): void => document.body.removeEventListener('click', handleClick);
  }, [isHeaderLoaded]);

  return isContextLoaded ? (
    <Main onLoaded={setHeaderLoaded} />
  ) : showLoadingScreen ? (
    <SplashScreen>
      <h2 className="text-center">{commonText('loading')}</h2>
    </SplashScreen>
  ) : null;
}

window.addEventListener('load', () => {
  const root = document.getElementById('root');
  if (root === null) throw new Error('Unable to find root element');
  root.setAttribute('class', className.root);
  ReactDOM.render(
    <React.StrictMode>
      <Contexts>
        <Root />
      </Contexts>
    </React.StrictMode>,
    root
  );
});
