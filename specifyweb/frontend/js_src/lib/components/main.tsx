import type Backbone from 'backbone';
import React from 'react';

import commonText from '../localization/common';
import * as navigation from '../navigation';
import { router } from '../router';
import { setCurrentView } from '../specifyapp';
import { systemInformation } from '../systeminfo';
import type { RA } from '../types';
import { fetchContext as fetchUserInfo, userInformation } from '../userinfo';
import { Button, Link } from './basic';
import { crash } from './errorboundary';
import {
  CollectionSelector,
  ExpressSearch,
  HeaderItems,
  UserTools,
} from './header';
import { Dialog } from './modaldialog';
import { Notifications } from './notifications';

export type UserTool = {
  readonly task: string;
  readonly title: string;
  readonly view:
    | string
    | ((props: {
        readonly onClose: () => void;
        readonly urlParameter?: string;
      }) => Backbone.View);
  readonly enabled?: boolean | (() => boolean);
  // Whether the view opens in a dialog window
  readonly isOverlay: boolean;
};

export type MenuItem = UserTool & {
  readonly icon: JSX.Element;
};

const menuItemsPromise: Promise<RA<MenuItem>> = Promise.all([
  import('../toolbardataentry'),
  import('../toolbarinteractions'),
  import('./toolbar/trees'),
  import('../toolbarrecordsets'),
  import('./toolbar/query'),
  import('../toolbarreport').then(async ({ default: menuItem }) => ({
    default: await menuItem,
  })),
  import('../attachments')
    .then(async ({ fetchContext }) => fetchContext)
    .then(async () => import('../toolbarattachments')),
  import('./toolbar/wbsdialog'),
]).then(processMenuItems);

function processMenuItems<T extends UserTool | MenuItem>(
  items: RA<{ readonly default: T }>
): RA<T> {
  const filtered = items
    .map(({ default: item }) => item)
    .filter(({ enabled }) =>
      typeof enabled === 'function' ? enabled() : enabled !== false
    );

  filtered.forEach(({ task, view }) =>
    router.route(
      `task/${task}/(:options)`,
      'startTask',
      (urlParameter: string) =>
        typeof view === 'string'
          ? navigation.go(view)
          : setCurrentView(
              view({
                onClose: (): void => navigation.go('/specify'),
                urlParameter,
              })
            )
    )
  );

  return filtered;
}

const userToolsPromise: Promise<RA<UserTool>> = fetchUserInfo
  .then(() =>
    Promise.all([
      import('./toolbar/schemaconfig'),
      import('./toolbar/masterkey'),
      import('./toolbar/users'),
      import('./toolbar/treerepair'),
      import('./toolbar/resources'),
      import('./toolbar/dwca'),
      import('./toolbar/forceupdate'),
      import('./toolbar/preferences'),
      import('./toolbar/schema').then(({ toolBarItem }) => ({
        default: toolBarItem,
      })),
    ])
  )
  .then(processMenuItems);

export function Main({
  onLoaded: handleLoaded,
}: {
  readonly onLoaded: () => void;
}): JSX.Element | null {
  const [menuItems, setMenuItems] = React.useState<RA<MenuItem> | undefined>(
    undefined
  );
  const [userTools, setUserTools] = React.useState<RA<UserTool> | undefined>(
    undefined
  );
  const [showVersionMismatch, setShowVersionMismatch] = React.useState(
    systemInformation.specify6_version !== systemInformation.database_version
  );

  const mainRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    Promise.all([
      menuItemsPromise.then(setMenuItems),
      userToolsPromise.then(setUserTools),
    ])
      .then(handleLoaded)
      .catch(crash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return typeof menuItems === 'undefined' ||
    typeof userTools === 'undefined' ? null : (
    <>
      <Button.Simple
        className="focus:not-sr-only !absolute top-0 left-0 !p-2 sr-only"
        onClick={(): void => {
          if (!mainRef.current) return;
          mainRef.current.setAttribute('tabindex', '-1');
          mainRef.current.focus();
          mainRef.current.removeAttribute('tabindex');
        }}
      >
        {commonText('skipToContent')}
      </Button.Simple>

      {showVersionMismatch && (
        <Dialog
          isOpen={showVersionMismatch}
          title={commonText('versionMismatchDialogTitle')}
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
            {commonText('versionMismatchDialogMessage')(
              systemInformation.specify6_version,
              systemInformation.database_version
            )}
          </p>
          <p>{commonText('versionMismatchSecondDialogMessage')}</p>
        </Dialog>
      )}

      <header
        className={`bg-gray-200 dark:bg-neutral-800 border-b-4 border-b-[5px]
        border-b-brand-200 dark:border-b-brand-400 flex flex-col 2xl:flex-row 
        shadow-md shadow-gray-400 print:hidden [z-index:1]`}
      >
        <div className="2xl:contents flex justify-between w-full">
          <h1 className="contents">
            <a href="/specify/" className="order-1 h-16 m-4">
              <img src="/static/img/seven_logo.png" alt="" className="h-full" />
              <span className="sr-only">{commonText('goToHomepage')}</span>
            </a>
          </h1>
          <div
            className={`flex flex-col gap-2 m-4 order-3 min-w-[275px]
              2xl:w-max-[350px]`}
          >
            <div className="gap-x-2 flex items-center justify-end">
              {userInformation.isauthenticated ? (
                <UserTools userTools={userTools} />
              ) : (
                <Link.Default href="/accounts/login/">
                  {commonText('logIn')}
                </Link.Default>
              )}
              <CollectionSelector />
            </div>
            <div className="gap-x-2 flex items-center justify-end">
              <Notifications />
              <ExpressSearch />
            </div>
          </div>
        </div>
        <HeaderItems menuItems={menuItems} />
      </header>
      <main className="flex-1 p-4 overflow-auto" ref={mainRef} />
    </>
  );
}
