import React from 'react';

import { welcomeText } from '../../localization/welcome';
import { f } from '../../utils/functools';
import { Async } from '../Router/RouterUtils';
import { defaultWelcomePageImage } from '../UserPreferences/Renderers';
import { usePref } from '../UserPreferences/usePref';

const taxonTiles = f.store(() => (
  <Async
    element={async (): Promise<React.FunctionComponent> =>
      import('./TaxonTiles').then(({ TaxonTiles }) => TaxonTiles)
    }
    title={undefined}
  />
));

export function WelcomeView(): JSX.Element {
  const [mode] = usePref('welcomePage', 'general', 'mode');

  return (
    <div
      className={`
        mx-auto flex h-full max-w-[1000px] flex-col justify-center gap-4  p-4
      `}
    >
      <div
        className={`
          flex min-h-0 items-center justify-center
          ${mode === 'embeddedWebpage' ? 'h-5/6' : ''}
        `}
      >
        {mode === 'taxonTiles' ? taxonTiles() : <WelcomeScreenContent />}
      </div>
    </div>
  );
}

function WelcomeScreenContent(): JSX.Element {
  const [mode] = usePref('welcomePage', 'general', 'mode');
  const [source] = usePref('welcomePage', 'general', 'source');

  return mode === 'embeddedWebpage' ? (
    <iframe
      className="h-full w-full border-0"
      src={source}
      title={welcomeText('pageTitle')}
    />
  ) : mode === 'default' ? (
    defaultSplashScreen
  ) : (
    <img alt="" className="h-full" src={source} />
  );
}

const defaultSplashScreen = (
  <div className="relative">
    <div className="absolute top-0 h-full w-[20%] bg-[linear-gradient(to_right,var(--background),transparent)]" />
    <img alt="" className="w-[800px]" src={defaultWelcomePageImage} />
    <div className="absolute top-0 right-0 h-full w-[20%] bg-[linear-gradient(to_left,var(--background),transparent)]" />
  </div>
);
