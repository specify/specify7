/**
 * The root React wrapper for the app
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { headerText } from '../../localization/header';
import { userText } from '../../localization/user';
import { f } from '../../utils/functools';
import type { GetOrSet, RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { Header } from '../Header';
import type { MenuItemName } from '../Header/menuItemDefinitions';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { Router } from '../Router/Router';
import { OnlineStatus } from './OnlineStatus';
import { VersionMismatch } from './VersionMismatch';

export type MenuItem = {
  readonly title: LocalizedString;
  readonly url: string;
  readonly enabled?: () => Promise<boolean> | boolean;
  readonly icon: JSX.Element;
  readonly name: string;
};

/*
 * REFACTOR: move UI logic out of .ts files and into .tsx (e.i., fetching data
 *  should be done in .tsx files so that a Loading Dialog can be displayed)
 */

export function Main({
  menuItems,
}: {
  readonly menuItems: RA<MenuItem>;
}): JSX.Element {
  const [hasAgent] = React.useState(userInformation.agent !== null);

  const mainRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    console.groupEnd();
  }, []);

  const [menuContext, setMenuContext] = React.useState<
    MenuItemName | undefined
  >(undefined);

  return (
    <MenuContext.Provider value={menuContext}>
      <SetMenuContext.Provider value={setMenuContext}>
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

        {hasAgent ? (
          <main className="flex-1 overflow-auto" ref={mainRef}>
            <ErrorBoundary dismissible>
              <Router />
            </ErrorBoundary>
          </main>
        ) : (
          <MissingAgent />
        )}

        <VersionMismatch />
        <OnlineStatus />
      </SetMenuContext.Provider>
    </MenuContext.Provider>
  );
}

function MissingAgent(): JSX.Element {
  return (
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
  );
}

/** Identifies active menu item */
export const MenuContext = React.createContext<MenuItemName | undefined>(
  undefined
);
MenuContext.displayName = 'MenuContext';
export const SetMenuContext = React.createContext<
  GetOrSet<MenuItemName | undefined>[1]
>(f.never);
SetMenuContext.displayName = 'SetMenuContext';
