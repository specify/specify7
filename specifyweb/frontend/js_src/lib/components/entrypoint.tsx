import '../../css/main.css';

import React from 'react';
import ReactDOM from 'react-dom';

import initialContext from '../initialcontext';
import * as navigation from '../navigation';
import startApp from '../startapp';
import { className } from './basic';
import ErrorBoundary from './errorboundary';
import Main from './main';
import { UnhandledErrorView } from '../errorview';

function handleClick(event: Readonly<MouseEvent>): void {
  const link = (event.target as HTMLElement)?.closest('a');
  if (
    link === null ||
    link.href.length === 0 ||
    (!link.classList.contains('intercept-navigation') &&
      (!event.altKey || link.target !== '_blank'))
  )
    return;

  event.preventDefault();
  navigation.go(link.href);
}

function Root(): JSX.Element | null {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    initialContext
      // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
      .catch((error: Error) => {
        console.error(error);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        new UnhandledErrorView({ response: error }).render();
      })
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    if (isLoading) return undefined;
    document.body.addEventListener('click', handleClick);
    startApp();
    return (): void => document.body.removeEventListener('click', handleClick);
  }, [isLoading]);

  return isLoading ? null : <Main />;
}

window.addEventListener('load', () => {
  const root = document.getElementById('root');
  if (root === null) throw new Error('Unable to find root element');
  root.setAttribute('class', className.root);
  ReactDOM.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Root />
      </ErrorBoundary>
    </React.StrictMode>,
    root
  );
});
