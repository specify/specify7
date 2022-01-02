import type Backbone from 'backbone';
import React from 'react';

import commonText from '../localization/common';
import * as navigation from '../navigation';
import router from '../router';
import { setCurrentView } from '../specifyapp';
import type { RA } from '../types';
import userInfo from '../userinfo';
import {
  CollectionSelector,
  ExpressSearch,
  HeaderItems,
  UserTools,
} from './header';
import Notifications from './notifications';

export type UserTool = {
  readonly task: string;
  readonly title: string;
  readonly view: (props: {
    readonly onClose: () => void;
    readonly urlParameter?: string;
  }) => Backbone.View;
  readonly enabled?: boolean | (() => boolean);
};

export type MenuItem = UserTool & {
  readonly view: (props: {
    readonly onClose: () => void;
    readonly urlParameter?: string;
  }) => Backbone.View;
  readonly icon: string;
  // This menuItem is considered active if URL begins with this path
  readonly path?: string;
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
  import('../toolbarattachments'),
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
      (urlParameter: string) => {
        setCurrentView(
          view({
            onClose: (): void => navigation.go('/specify'),
            urlParameter,
          })
        );
      }
    )
  );

  return filtered;
}

const userToolsPromise: Promise<RA<UserTool>> = Promise.all([
  import('./toolbar/language'),
  import('./toolbar/schemaconfig'),
  import('./toolbar/masterkey'),
  import('./toolbar/users'),
  import('./toolbar/treerepair'),
  import('./toolbar/resources'),
  import('./toolbar/dwca'),
  import('./toolbar/forceupdate'),
]).then(processMenuItems);

export default function Main(): JSX.Element | null {
  const [menuItems, setMenuItems] = React.useState<RA<MenuItem> | undefined>(
    undefined
  );

  const mainRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    menuItemsPromise.then(setMenuItems).catch(console.error);
  }, []);

  return typeof menuItems === 'undefined' ? null : (
    <>
      <button
        className="sr-only"
        type="button"
        onClick={(): void => {
          if (!mainRef.current) return;
          mainRef.current.setAttribute('tabindex', '-1');
          mainRef.current.focus();
          mainRef.current.removeAttribute('tabindex');
        }}
      >
        {commonText('skipToContent')}
      </button>

      <header id="site-header">
        <div id="site-header-main">
          <h1 id="site-logo">
            <a href="/specify/" className="intercept-navigation">
              <span className="sr-only">{commonText('goToHomepage')}</span>
            </a>
          </h1>
          <div id="user-tools">
            <div>
              {userInfo.isauthenticated ? (
                <UserTools userToolsPromise={userToolsPromise} />
              ) : (
                <a href="/accounts/login/">{commonText('logIn')}</a>
              )}
              <CollectionSelector />
            </div>
            <div>
              <Notifications />
              <ExpressSearch />
            </div>
          </div>
        </div>
        <HeaderItems menuItems={menuItems} />
      </header>
      <main ref={mainRef} />
    </>
  );
}
