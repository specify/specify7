import React from 'react';
import ReactDOM from 'react-dom';

import type { getEntrypointName } from '../initialcontext';
import { unlockInitialContext } from '../initialcontext';
import { interceptLogs } from '../interceptlogs';
import { commonText } from '../localization/common';
import { Contexts } from './contexts';
import { SetCssVariables } from './preferenceshooks';

if (process.env.NODE_ENV !== 'test') require('../../css/main.css');

export function SplashScreen({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <div
      className={`flex items-center justify-center h-full overflow-y-auto
        bg-gray-400 dark:bg-neutral-900`}
    >
      <div
        className={`sm:max-w-md flex flex-col w-full gap-4 p-16 bg-gray-100
          dark:bg-neutral-800 rounded shadow-2xl`}
      >
        <header className="pb-2">
          <h1 className="sr-only">{commonText('specifySeven')}</h1>
          <img
            src="/static/img/seven_logo.png"
            alt=""
            className="hover:animate-hue-rotate max-w-xs"
          />
        </header>
        <main className="contents">{children}</main>
      </div>
    </div>
  );
}

export function entrypoint(
  name: ReturnType<typeof getEntrypointName>,
  getContent: () => JSX.Element
): void {
  interceptLogs();

  if (process.env.NODE_ENV === 'test') return;
  console.group('Specify App Starting');
  unlockInitialContext(name);
  globalThis.addEventListener('load', () => {
    const root = document.getElementById('root');
    const portalRoot = document.getElementById('portal-root');
    if (root === null || portalRoot === null)
      throw new Error('Unable to find root element');
    root.setAttribute(
      'class',
      `flex flex-col h-screen overflow-hidden bg-[color:var(--background)]
      text-neutral-900 dark:text-neutral-200`
    );
    portalRoot.setAttribute('class', 'text-neutral-900 dark:text-neutral-200');
    ReactDOM.render(
      <React.StrictMode>
        <Contexts>
          <SetCssVariables />
          {getContent()}
        </Contexts>
      </React.StrictMode>,
      root
    );
  });
}
