import React from 'react';

import { welcomeText } from '../../localization/welcome';
import { f } from '../../utils/functools';
import { Async } from '../Router/RouterUtils';
import { defaultWelcomePageImage } from '../Preferences/Renderers';
import { userPreferences } from '../Preferences/userPreferences';

const taxonTiles = f.store(() => (
  <Async
    Element={React.lazy(async () =>
      import('./TaxonTiles').then(({ TaxonTiles }) => ({
        default: TaxonTiles,
      }))
    )}
    title={undefined}
  />
));

export function WelcomeView(): JSX.Element {
  const [mode] = userPreferences.use('welcomePage', 'general', 'mode');

  return (
    <div
      className={`
        mx-auto flex h-full w-full max-w-[1000px] flex-col justify-center gap-4 p-4
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
  const [mode] = userPreferences.use('welcomePage', 'general', 'mode');
  const [source] = userPreferences.use('welcomePage', 'general', 'source');

  return mode === 'embeddedWebpage' ? (
    <iframe
      className="h-full w-full border-0"
      src={source}
      title={welcomeText.pageTitle()}
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
