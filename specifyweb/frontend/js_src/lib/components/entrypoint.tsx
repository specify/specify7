import '../../css/main.css';

import React from 'react';
import ReactDOM from 'react-dom';

import initialContext from '../initialcontext';
import * as navigation from '../navigation';
import startApp from '../startapp';
import { className } from './basic';
import ErrorBoundary, { crash } from './errorboundary';
import Main from './main';

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
  const [isContextLoading, setIsContextLoading] = React.useState(true);
  const [isHeaderLoading, setIsHeaderLoading] = React.useState(true);

  React.useEffect(() => {
    initialContext.catch(crash).finally(() => setIsContextLoading(false));
  }, []);

  React.useEffect(() => {
    if (isHeaderLoading) return undefined;
    document.body.addEventListener('click', handleClick);
    startApp();
    return (): void => document.body.removeEventListener('click', handleClick);
  }, [isHeaderLoading]);

  return isContextLoading ? null : (
    <Main onLoaded={(): void => setIsHeaderLoading(false)} />
  );
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
