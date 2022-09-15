import React from 'react';

import { welcomeText } from '../../localization/welcome';
import { defaultWelcomePageImage } from '../UserPreferences/Renderers';
import { usePref } from '../UserPreferences/usePref';
import { f } from '../../utils/functools';
import { Async } from '../Router/RouterUtils';

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
  ) : (
    <img
      alt=""
      className="h-full"
      src={mode === 'default' ? defaultWelcomePageImage : source}
    />
  );
}
