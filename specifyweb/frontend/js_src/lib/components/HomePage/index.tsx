import React from 'react';

import { useHueDifference } from '../../hooks/useHueDifference';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { welcomeText } from '../../localization/welcome';
import { Submit } from '../Atoms/Submit';
import { SearchForm } from '../Header/ExpressSearchTask';
import { defaultWelcomePageImage } from '../Preferences/Renderers';
import { userPreferences } from '../Preferences/userPreferences';
import { ReactLazy } from '../Router/ReactLazy';

const TaxonTiles = ReactLazy(async () =>
  import('./TaxonTiles').then(({ TaxonTiles }) => TaxonTiles)
);

export function WelcomeView(): JSX.Element {
  const [mode] = userPreferences.use('welcomePage', 'general', 'mode');
  const formId = useId('express-search')('form');

  const [displaySearchBar] = userPreferences.use(
    'welcomePage',
    'general',
    'addSearchBar'
  );

  return (
    <div className="flex h-full flex-col">
      {displaySearchBar && (
        <div className="flex justify-end gap-2 pr-4 pt-4">
          <SearchForm formId={formId} />
          <Submit.Secondary form={formId}>
            {commonText.search()}
          </Submit.Secondary>
        </div>
      )}
      <div
        className={`
        mx-auto flex w-full max-w-[1000px] flex-1 flex-col justify-center gap-4 p-4
      `}
      >
        <span className="-ml-2 flex-1" />
        <div
          className={`
          flex min-h-0 items-center justify-center
          ${mode === 'embeddedWebpage' ? 'h-5/6' : ''}
        `}
        >
          {mode === 'taxonTiles' ? <TaxonTiles /> : <WelcomeScreenContent />}
        </div>
        <span className="-ml-2 flex-1" />
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
    <DefaultSplashScreen />
  ) : (
    <img alt="" className="h-full" src={source} />
  );
}

function DefaultSplashScreen(): JSX.Element {
  const hueDifference = useHueDifference();
  return (
    <div className="relative">
      <img
        alt=""
        className="w-[800px]"
        src={defaultWelcomePageImage}
        style={{ filter: `hue-rotate(${hueDifference}deg)` }}
      />
      {/* The two following gradients in the divs are here to apply a fade out effect on the image */}
      <div className="absolute top-0 h-full w-[20%] bg-[linear-gradient(to_right,var(--background),transparent)]" />
      <div className="absolute right-0 top-0 h-full w-[20%] bg-[linear-gradient(to_left,var(--background),transparent)]" />
    </div>
  );
}
