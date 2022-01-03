import React from 'react';

import ajax from '../ajax';
import commonText from '../localization/common';
import * as navigation from '../navigation';
import * as querystring from '../querystring';
import type { RA } from '../types';
import userInfo from '../userinfo';
import type { MenuItem, UserTool } from './main';
import { ModalDialog } from './modaldialog';
import { crash } from './errorboundary';
import { Button, Link } from './basic';

export function HeaderItems({
  menuItems,
}: {
  readonly menuItems: RA<MenuItem>;
}): JSX.Element {
  return (
    <nav
      id="site-nav"
      className={`xl:m-0 lg:justify-center flex flex-row flex-wrap flex-1
        order-2 -mt-2`}
      aria-label="primary"
    >
      {menuItems.map(({ task, title, path, icon, view }) => (
        <Link
          className={`
            menu-item
            p-2
            md:py-3
            font-bold
            text-md
            text-gray-700
            hover:text-black
            relative
            inline-flex
            items-center
            gap-x-2
            active:bg-white
            lg:after:absolute
            lg:after:-bottom-1
            lg:after:w-full
            lg:after:left-0
            lg:after:right-0
            lg:after:h-2
            lg:after:bg-transparent
            lg:hover:after:bg-gray-200
          `}
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
          <img src={icon} alt="" className="h-4" />
          {title}
        </Link>
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
      className="flex-1"
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
      className="contents"
      action="/specify/express_search/"
      role="search"
    >
      <input
        type="search"
        className="express-search-query flex-1"
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
      <Button
        className="max-w-[100px] overflow-hidden whitespace-nowrap text-overflow-ellipsis"
        title={commonText('currentUser')}
        onClick={(): void => setIsOpen(true)}
      >
        {userInfo.name}
      </Button>
      {isOpen && userTools ? (
        <ModalDialog
          properties={{
            title: commonText('userToolsDialogTitle'),
            close: (): void => setIsOpen(false),
          }}
        >
          <nav>
            {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
            <ul role="list">
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
                  <Link
                    href={`${basePath}${task}/`}
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
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </ModalDialog>
      ) : undefined}
    </>
  );
}
