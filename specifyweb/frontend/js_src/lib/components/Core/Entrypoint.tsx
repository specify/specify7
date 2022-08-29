import '../../../css/main.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { parseDjangoDump } from '../../utils/ajax/csrftoken';
import type { getEntrypointName } from '../InitialContext';
import { unlockInitialContext } from '../InitialContext';
import { interceptLogs } from '../Errors/interceptLogs';
import { commonText } from '../../localization/common';
import { Contexts } from './Contexts';
import { EntrypointRouter } from '../Router/EntrypointRouter';
import { SetCssVariables } from '../UserPreferences/ApplyPreferences';

export function SplashScreen({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <div
      className={`
        flex h-full items-center justify-center overflow-y-auto
        bg-gray-400 dark:bg-neutral-900
      `}
    >
      <div
        className={`
          flex w-full flex-col gap-4 rounded bg-gray-100 p-16
          shadow-2xl dark:bg-neutral-800 sm:max-w-md
        `}
      >
        <header className="pb-2">
          <h1 className="sr-only">{commonText('specifySeven')}</h1>
          <img
            alt=""
            className="max-w-xs hover:animate-hue-rotate"
            src="/static/img/seven_logo.png"
          />
        </header>
        <main className="contents">{children}</main>
      </div>
    </div>
  );
}

function entrypoint(): void {
  if (process.env.NODE_ENV === 'test') return;

  interceptLogs();

  console.group('Specify App Starting');
  const entrypointName =
    parseDjangoDump<ReturnType<typeof getEntrypointName>>('entrypoint-name');
  console.log(entrypointName);
  unlockInitialContext(entrypointName);

  globalThis.window.addEventListener('load', () => {
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
    const reactRoot = createRoot(root);
    reactRoot.render(
      <React.StrictMode>
        <BrowserRouter>
          <Contexts>
            <SetCssVariables />
            <EntrypointRouter />
          </Contexts>
        </BrowserRouter>
      </React.StrictMode>
    );
  });
}

entrypoint();
