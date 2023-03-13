import '../../../css/main.css';

import React from 'react';
import { createRoot } from 'react-dom/client';

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
  if (process.env.NODE_ENV === 'production') {
    console.log(
      '%cDocumentation for Developers:\n',
      'font-weight: bold',
      'https://github.com/specify/specify7/wiki/Docker-Workflow-for-Development'
    );
  }
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
      `flex h-screen print:h-auto overflow-hidden print:overflow-auto
      bg-[color:var(--background)] text-neutral-900 dark:text-neutral-200`
    );
    portalRoot.setAttribute('class', 'text-neutral-900 dark:text-neutral-200');
    const reactRoot = createRoot(root);
    reactRoot.render(
      <React.StrictMode>
        <Contexts>
          <SetCssVariables />
          <EntrypointRouter />
        </Contexts>
      </React.StrictMode>
    );
  });
}

entrypoint();
