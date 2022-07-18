/**
 * The root React wrapper for the app
 */

import React from 'react';

import { commonText } from '../localization/common';
import { fetchContext as userPermission } from '../permissions';
import { router } from '../router';
import { setCurrentComponent } from '../specifyapp';
import { getSystemInfo } from '../systeminfo';
import type { RA } from '../types';
import { fetchContext as fetchUserInfo, userInformation } from '../userinfo';
import { Button, className, Link } from './basic';
import { crash } from './errorboundary';
import {
  CollectionSelector,
  ExpressSearch,
  HeaderItems,
  UserTools,
} from './header';
import { Dialog, dialogClassNames } from './modaldialog';
import { goTo } from './navigation';
import { Notifications } from './notifications';
import { startApp } from '../startapp';
import { listen } from '../events';
import { getUserPref } from '../preferencesutils';

export type UserTool = {
  readonly task: string;
  readonly title: string;
  readonly view:
    | string
    | ((props: {
        readonly onClose: () => void;
        readonly urlParameter: string | undefined;
      }) => JSX.Element);
  readonly enabled?: boolean | (() => boolean);
  // Whether the view opens in a dialog window
  readonly isOverlay: boolean;
  readonly groupLabel: string;
  readonly basePath?: string;
};

export type MenuItem = Omit<UserTool, 'groupLabel' | 'basePath'> & {
  readonly icon: JSX.Element;
};

/*
 * REFACTOR: move UI logic out of .ts files and into .tsx (e.i., fetching data
 *  should be done in .tsx files so that a Loading Dialog can be displayed)
 */

const menuItemsPromise: Promise<RA<MenuItem>> = userPermission
  .then(async () =>
    Promise.all([
      import('./toolbar/dataentry'),
      import('./toolbar/trees'),
      import('./toolbar/interactions'),
      import('./toolbar/query'),
      import('./toolbar/recordsets'),
      import('./toolbar/report').then(async ({ menuItem }) => ({
        menuItem: await menuItem,
      })),
      import('./toolbar/wbsdialog'),
      import('../toolbarattachments').then(async ({ menuItem }) => ({
        menuItem: await menuItem,
      })),
    ])
  )
  .then((items) => processMenuItems(items.map(({ menuItem }) => menuItem)));

function processMenuItems<T extends UserTool | MenuItem>(items: RA<T>): RA<T> {
  const filtered = items.filter(({ enabled }) =>
    typeof enabled === 'function' ? enabled() : enabled !== false
  );

  filtered.forEach(({ task, view }) =>
    router.route(
      `task/${task}/(:options)`,
      'startTask',
      (urlParameter: string) =>
        typeof view === 'string'
          ? goTo(view)
          : setCurrentComponent(
              view({
                onClose: (): void => goTo('/'),
                urlParameter,
              })
            )
    )
  );

  return filtered;
}

function handleClick(event: Readonly<MouseEvent>): void {
  const link = (event.target as HTMLElement)?.closest('a');
  if (
    link !== null &&
    link.href.length > 0 &&
    link.getAttribute('href')?.startsWith('#') === false &&
    link.getAttribute('download') === null &&
    (link.target !== '_blank' ||
      (getUserPref('general', 'behavior', 'altClickToSupressNewTab') &&
        event.altKey)) &&
    !link.classList.contains(className.navigationHandled)
  ) {
    event.preventDefault();
    goTo(link.href);
  }
}

const userToolsPromise: Promise<RA<UserTool>> = Promise.all([
  userPermission,
  fetchUserInfo,
])
  .then(async () =>
    Promise.all([
      // User Account
      {
        userTool: {
          task: 'logout',
          title: commonText('logOut'),
          basePath: '/',
          view: '/accounts/logout/',
          isOverlay: false,
          groupLabel: commonText('userAccount'),
        },
      },
      {
        userTool: {
          task: 'password_change',
          title: commonText('changePassword'),
          basePath: '/',
          view: '/accounts/password_change/',
          isOverlay: false,
          groupLabel: commonText('userAccount'),
        },
      },
      // Customization
      import('./toolbar/preferences'),
      import('./toolbar/schemaconfig'),
      // Administration
      import('./toolbar/appresources'),
      import('./toolbar/security'),
      import('./toolbar/treerepair'),
      import('./toolbar/masterkey'),
      // Export
      import('./toolbar/dwca'),
      import('./toolbar/forceupdate'),
      // Documentation
      import('./welcomeview'),
      {
        userTool: {
          task: 'discourse',
          title: commonText('forum'),
          basePath: '',
          view: 'https://discourse.specifysoftware.org/',
          isOverlay: false,
          groupLabel: commonText('documentation'),
        },
      },
      {
        userTool: {
          task: 'technical_documentation',
          title: commonText('technicalDocumentation'),
          basePath: '',
          view: 'https://github.com/specify/specify7/wiki',
          isOverlay: false,
          groupLabel: commonText('documentation'),
        },
      },
      // Developers
      import('./toolbar/schema'),
      import('./toolbar/cachebuster'),
      import('./toolbar/swagger').then(({ userTools }) =>
        userTools.map((userTool) => ({ userTool }))
      ),
    ])
  )
  .then((items) => items.flat())
  .then((items) => processMenuItems(items.map(({ userTool }) => userTool)));

// FIXME: remove this
let isFirstCall = true;

export function Main(): JSX.Element | null {
  const [menuItems, setMenuItems] = React.useState<RA<MenuItem> | undefined>(
    undefined
  );
  const [userTools, setUserTools] = React.useState<RA<UserTool> | undefined>(
    undefined
  );
  const [showVersionMismatch, setShowVersionMismatch] = React.useState(
    getSystemInfo().specify6_version !== getSystemInfo().database_version
  );

  const [hasAgent] = React.useState(userInformation.agent !== null);

  const mainRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    Promise.all([
      menuItemsPromise.then(setMenuItems),
      userToolsPromise.then(setUserTools),
    ])
      .then(() => {
        if (isFirstCall) {
          isFirstCall = false;
          return;
        }
        startApp();
        listen(document.body, 'click', handleClick);
      })
      .catch(crash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return menuItems === undefined || userTools === undefined ? null : (
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
        {commonText('skipToContent')}
      </Button.Small>

      <header
        className={`
          flex flex-col border-b-[5px]
          border-b-brand-200 bg-gray-200 shadow-md shadow-gray-400 [z-index:1] 
          dark:border-b-brand-400 dark:bg-neutral-800 print:hidden 2xl:flex-row
          ${className.hasAltBackground}
        `}
      >
        <div className="flex w-full items-center justify-between 2xl:contents">
          <h1 className="contents">
            <a href="/specify/" className="order-1 m-4 flex items-center">
              <img
                src="/static/img/seven_logo.png"
                alt=""
                className="h-16 hover:animate-hue-rotate"
              />
              <span className="sr-only">{commonText('goToHomepage')}</span>
            </a>
          </h1>
          <div
            className={`
              2xl:w-max-[350px] order-3 m-4 flex min-w-[275px] flex-col gap-2
            `}
          >
            <div className="flex items-center justify-end gap-2">
              {userInformation.isauthenticated ? (
                <UserTools userTools={userTools} />
              ) : (
                <Link.Default href="/accounts/login/">
                  {commonText('logIn')}
                </Link.Default>
              )}
              <CollectionSelector />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Notifications />
              <ExpressSearch />
            </div>
          </div>
        </div>
        <HeaderItems menuItems={menuItems} />
      </header>

      {showVersionMismatch && (
        <Dialog
          header={commonText('versionMismatchDialogHeader')}
          onClose={(): void => setShowVersionMismatch(false)}
          buttons={
            <Button.Orange onClick={(): void => setShowVersionMismatch(false)}>
              {commonText('close')}
            </Button.Orange>
          }
          forceToTop={true}
        >
          <p>
            {commonText(
              'versionMismatchDialogText',
              getSystemInfo().specify6_version,
              getSystemInfo().database_version
            )}
          </p>
          <p>{commonText('versionMismatchSecondDialogText')}</p>
        </Dialog>
      )}
      {hasAgent ? (
        <main className="flex-1 overflow-auto" ref={mainRef} />
      ) : (
        <Dialog
          header={commonText('noAgentDialogHeader')}
          className={{
            container: `${dialogClassNames.narrowContainer}`,
          }}
          onClose={(): void => globalThis.location.assign('/accounts/logout/')}
          buttons={
            <Button.DialogClose component={Button.Red}>
              {commonText('logOut')}
            </Button.DialogClose>
          }
          forceToTop={true}
        >
          {commonText('noAgentDialogText')}
        </Dialog>
      )}
    </>
  );
}
