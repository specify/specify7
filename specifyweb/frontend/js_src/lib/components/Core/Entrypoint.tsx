import '../../../css/main.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { parseDjangoDump } from '../../utils/ajax/csrfToken';
import { interceptLogs } from '../Errors/interceptLogs';
import type { getEntrypointName } from '../InitialContext';
import { unlockInitialContext } from '../InitialContext';
import { EntrypointRouter } from '../Router/EntrypointRouter';
import { SetCssVariables } from '../UserPreferences/ApplyPreferences';
import { Contexts } from './Contexts';

function entrypoint(): void {
  if (process.env.NODE_ENV === 'test') return;

  interceptLogs();

  console.group('Specify App Starting');
  const entrypointName =
    parseDjangoDump<ReturnType<typeof getEntrypointName>>('entrypoint-name') ??
    'main';
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
