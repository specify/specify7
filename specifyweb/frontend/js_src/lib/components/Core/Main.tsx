/**
 * The root React wrapper for the app
 */

import React from 'react';

import { commonText } from '../../localization/common';
import type { RR } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { enableBusinessRules } from '../DataModel/businessRules';
import { crash } from '../Errors/Crash';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { Header } from '../Header';
import type { MenuItemName } from '../Header/menuItemDefinitions';
import { menuItemsPromise } from '../Header/menuItemDefinitions';
import { getSystemInfo } from '../InitialContext/systemInfo';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { Router } from '../Router/Router';
import type { Preferences } from '../UserPreferences/Definitions';
import { mainText } from '../../localization/main';
import { headerText } from '../../localization/header';
import { userText } from '../../localization/user';
import { LocalizedString } from 'typesafe-i18n';

export type UserTool = {
  readonly title: LocalizedString;
  readonly url: string;
  readonly enabled?: () => Promise<boolean> | boolean;
};

export type MenuItem = UserTool & {
  readonly icon: JSX.Element;
  /*
   * A name of the user preference key responsible for determining whether
   * the menu item is visible
   */
  readonly visibilityKey: keyof Preferences['header']['subCategories']['menu']['items'];
};

/*
 * REFACTOR: move UI logic out of .ts files and into .tsx (e.i., fetching data
 *  should be done in .tsx files so that a Loading Dialog can be displayed)
 */

export function Main(): JSX.Element | null {
  const [menuItems, setMenuItems] = React.useState<
    RR<MenuItemName, MenuItem> | undefined
  >(undefined);
  const [showVersionMismatch, setShowVersionMismatch] = React.useState(
    getSystemInfo().specify6_version !== getSystemInfo().database_version
  );

  const [hasAgent] = React.useState(userInformation.agent !== null);

  const mainRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(
    () =>
      void menuItemsPromise
        .then(setMenuItems)
        .then(() => enableBusinessRules(true))
        .then(console.groupEnd)
        .catch(crash),
    []
  );

  return menuItems === undefined ? null : (
    <>
      <Button.Small
        className="sr-only !absolute top-0 left-0 z-10 !p-2 focus:not-sr-only"
        onClick={(): void => {
          if (!mainRef.current) return;
          mainRef.current.setAttribute('tabindex', '-1');
          mainRef.current.focus();
          mainRef.current.removeAttribute('tabindex');
        }}
      >
        {headerText.skipToContent()}
      </Button.Small>

      <Header menuItems={menuItems} />

      {showVersionMismatch && (
        <Dialog
          buttons={
            <Button.Orange onClick={(): void => setShowVersionMismatch(false)}>
              {commonText.close()}
            </Button.Orange>
          }
          forceToTop
          header={mainText.versionMismatch()}
          onClose={(): void => setShowVersionMismatch(false)}
        >
          <p>
            {mainText.versionMismatchDescription({
              specifySixVersion: getSystemInfo().specify6_version,
              databaseVersion: getSystemInfo().database_version,
            })}
          </p>
          <p>{mainText.versionMismatchSecondDescription()}</p>
          <p>
            <Link.NewTab href="https://discourse.specifysoftware.org/t/resolve-specify-7-schema-version-mismatch/884">
              {mainText.versionMismatchInstructions()}
            </Link.NewTab>
          </p>
        </Dialog>
      )}
      {hasAgent ? (
        <main className="flex-1 overflow-auto" ref={mainRef}>
          <ErrorBoundary dismissable>
            <Router />
          </ErrorBoundary>
        </main>
      ) : (
        <Dialog
          buttons={
            <Button.DialogClose component={Button.Red}>
              {userText.logOut()}
            </Button.DialogClose>
          }
          className={{
            container: `${dialogClassNames.narrowContainer}`,
          }}
          forceToTop
          header={userText.noAgent()}
          onClose={(): void => globalThis.location.assign('/accounts/logout/')}
        >
          {userText.noAgentDescription()}
        </Dialog>
      )}
    </>
  );
}
