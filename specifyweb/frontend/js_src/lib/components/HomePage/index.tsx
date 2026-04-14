import React from 'react';

import { useHueDifference } from '../../hooks/useHueDifference';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { welcomeText } from '../../localization/welcome';
import { Submit } from '../Atoms/Submit';
import { SearchForm } from '../Header/ExpressSearchTask';
import { useDarkMode } from '../Preferences/Hooks';
import { getDefaultWelcomePageImage } from '../Preferences/Renderers';
import { userPreferences } from '../Preferences/userPreferences';
import { icons } from '../Atoms/Icons';
import { Button } from '../Atoms/Button';
import { ReactLazy } from '../Router/ReactLazy';
import { ExpressSearchConfigDialog } from '../ExpressSearchConfig/ExpressSearchConfigDialog';

const TaxonTiles = ReactLazy(async () =>
  import('./TaxonTiles').then(({ TaxonTiles }) => TaxonTiles)
);

export function WelcomeView({
  hideSearchBar = false,
}: {
  readonly hideSearchBar?: boolean;
}): JSX.Element {
  const [mode] = userPreferences.use('welcomePage', 'general', 'mode');
  const formId = useId('express-search')('form');

  const [displaySearchBar] = userPreferences.use(
    'welcomePage',
    'general',
    'addSearchBar'
  );
  const [isConfigOpen, setIsConfigOpen] = React.useState(false);

  return (
    <div className="flex h-full flex-col">
      {!hideSearchBar && displaySearchBar && (
        <div className="flex justify-end gap-2 pr-4 pt-4 items-center">
          <Button.BorderedGray
            title="Configure Express Search"
            onClick={() => setIsConfigOpen(true)}
            className="!px-2"
          >
            {icons.cog}
          </Button.BorderedGray>
          <SearchForm formId={formId} />
          <Submit.Secondary form={formId}>
            {commonText.search()}
          </Submit.Secondary>
        </div>
      )}
      <ExpressSearchConfigDialog
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
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
  const isDarkMode = useDarkMode();
  return (
    <div className="relative">
      <img
        alt=""
        className="w-[800px]"
        src={getDefaultWelcomePageImage(isDarkMode)}
        style={{ filter: `hue-rotate(${hueDifference}deg)` }}
      />
      {/* The following gradients in the divs are here to apply a fade out effect on the image */}
      {/* Left fade */}
      <div className="absolute top-0 h-full w-[20%] bg-[linear-gradient(to_right,var(--background),transparent)]" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 h-full w-[20%] bg-[linear-gradient(to_left,var(--background),transparent)]" />
      {/* Top fade */}
      <div className="absolute top-0 left-0 h-[20%] w-full bg-[linear-gradient(to_bottom,var(--background),transparent)]" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 h-[20%] w-full bg-[linear-gradient(to_top,var(--background),transparent)]" />
    </div>
  );
}
