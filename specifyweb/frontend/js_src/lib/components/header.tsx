import React from 'react';

import ajax from '../ajax';
import commonText from '../localization/common';
import * as navigation from '../navigation';
import * as querystring from '../querystring';
import type { RA } from '../types';
import userInfo from '../userinfo';
import type { MenuItem, UserTool } from './main';
import { ModalDialog } from './modaldialog';
import { crash } from '../errorview';

export function HeaderItems({
  menuItems,
}: {
  readonly menuItems: RA<MenuItem>;
}): JSX.Element {
  return (
    <nav id="site-nav" aria-label="primary">
      {menuItems.map(({ task, title, path, icon, view }) => (
        <a
          key={task}
          href={`/specify/task/${task}/`}
          data-path={path}
          onClick={(event): void => {
            event.preventDefault();
            const backboneView = view({
              onClose: (): void => void backboneView.remove(),
            }).render();
          }}
        >
          <img src={icon} alt="" />
          {title}
        </a>
      ))}
    </nav>
  );
}

type Collections = {
  readonly available: RA<Readonly<[number, string]>>;
  readonly current: number | null;
};

export function CollectionSelector(): JSX.Element {
  const [collections, setCollections] = React.useState<Collections | undefined>(
    undefined
  );

  React.useEffect(() => {
    void ajax<Collections>('/context/collection/', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/json' },
    }).then(({ data: collections }) => {
      if (!destructorCalled) setCollections(collections);
      return undefined;
    });

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, []);

  return (
    <select
      className="collection-selector"
      title={commonText('currentCollection')}
      aria-label={commonText('currentCollection')}
      value={collections?.current ?? undefined}
      onChange={({ target }): void =>
        navigation.switchCollection(Number.parseInt(target.value), '/', () => {
          /* Nothing */
        })
      }
    >
      {collections?.available.map(([id, name]) => (
        <option key={id} value={id}>
          {name}
        </option>
      ))}
    </select>
  );
}

export function ExpressSearch(): JSX.Element {
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  return (
    <form
      onSubmit={(event): void => {
        event.preventDefault();
        const query = searchQuery.trim();
        if (query.length === 0) return;
        const url = querystring.format('/specify/express_search/', {
          // eslint-disable-next-line id-length
          q: query,
        });
        navigation.go(url);
      }}
      id="express-search"
      action="/specify/express_search/"
      role="search"
    >
      <input
        type="search"
        className="express-search-query"
        name="q"
        placeholder={commonText('search')}
        aria-label={commonText('search')}
        value={searchQuery}
        onChange={({ target }): void => setSearchQuery(target.value)}
      />
    </form>
  );
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export function UserTools({
  userToolsPromise,
}: {
  readonly userToolsPromise: Promise<RA<UserTool>>;
}): JSX.Element {
  const [userTools, setUserTools] = React.useState<RA<UserTool> | undefined>(
    undefined
  );
  React.useEffect(() => {
    userToolsPromise.then(setUserTools).catch(crash);
  }, [userToolsPromise]);

  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  return (
    <>
      <button
        className="magic-button username"
        title={commonText('currentUser')}
        type="button"
        onClick={(): void => setIsOpen(true)}
      >
        {userInfo.name}
      </button>
      {isOpen && userTools ? (
        <ModalDialog
          properties={{
            title: commonText('userToolsDialogTitle'),
            close: (): void => setIsOpen(false),
          }}
        >
          <nav>
            <ul style={{ padding: 0 }}>
              {[
                {
                  task: '/accounts/logout',
                  title: commonText('logOut'),
                  basePath: '',
                  view: undefined,
                },
                {
                  task: '/accounts/password_change',
                  title: commonText('changePassword'),
                  basePath: '',
                  view: undefined,
                },
                ...userTools.map((userTool) => ({
                  ...userTool,
                  basePath: '/specify/task/',
                })),
              ].map(({ task, title, basePath, view }) => (
                <li key={task}>
                  <a
                    href={`${basePath}${task}/`}
                    className="user-tool fake-link"
                    style={{ fontSize: '0.8rem' }}
                    onClick={(event): void => {
                      if (typeof view === 'undefined') return;
                      event.preventDefault();
                      setIsOpen(false);
                      const backboneView = view({
                        onClose: (): void => void backboneView.remove(),
                      }).render();
                    }}
                  >
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </ModalDialog>
      ) : undefined}
    </>
  );
}
