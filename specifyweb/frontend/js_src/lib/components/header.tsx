import React from 'react';

import { ajax } from '../ajax';
import commonText from '../localization/common';
import * as navigation from '../navigation';
import * as querystring from '../querystring';
import { router } from '../router';
import { setCurrentOverlay, setCurrentView } from '../specifyapp';
import type { IR, RA } from '../types';
import { userInformation } from '../userinfo';
import { sortFunction } from '../wbplanviewhelper';
import { Button, className, Form, Input, Link, Select, Ul } from './basic';
import { useAsyncState, useBooleanState } from './hooks';
import type { MenuItem, UserTool } from './main';
import { Dialog, dialogClassNames } from './modaldialog';

const routeMappings: IR<string> = {
  recordSetView: 'data',
  resourceView: 'data',
  newResourceView: 'data',
  byCatNo: 'data',
  storedQuery: 'query',
  ephemeralQuery: 'query',
  queryFromTable: 'query',
  'workbench-import': 'workbenches',
  'workbench-plan': 'workbenches',
};

export function HeaderItems({
  menuItems,
}: {
  readonly menuItems: RA<MenuItem>;
}): JSX.Element {
  const [activeTask, setActiveTask] = React.useState<string | undefined>(
    undefined
  );
  React.useEffect(() => {
    const callback = (route: string) => {
      if (menuItems.some(({ task }) => task === route)) setActiveTask(route);
      else setActiveTask(routeMappings[route] ?? undefined);
    };
    router.on('route', callback);
    return (): void => void router.off('route', callback);
  }, [menuItems]);

  return (
    <nav
      className={`xl:m-0 lg:justify-center flex flex-row flex-wrap flex-1
        order-2 -mt-2 px-2`}
      aria-label="primary"
    >
      {menuItems.map(({ task, title, icon, view, isOverlay }) => (
        <Link.Default
          className={`
            ${typeof view === 'string' ? '' : className.navigationHandled}
            p-3
            text-gray-700
            dark:text-neutral-300
            rounded
            relative
            inline-flex
            items-center
            gap-x-2
            active:bg-white
            active:dark:bg-neutral-600
            ${
              task === activeTask
                ? 'bg-white dark:bg-neutral-600 lg:bg-transparent'
                : ''
            }
            lg:after:absolute
            lg:after:-bottom-1
            lg:after:w-full
            lg:after:left-0
            lg:after:right-0
            lg:after:h-2
            lg:after:bg-transparent
            lg:hover:after:bg-gray-200
            lg:hover:after:dark:bg-neutral-800
            ${task === activeTask ? 'lg:after:bg-gray-200' : ''}
            ${task === activeTask ? 'lg:after:dark:bg-neutral-800' : ''}
          `}
          key={task}
          href={typeof view === 'string' ? view : `/specify/task/${task}/`}
          aria-current={task === activeTask ? 'page' : undefined}
          onClick={(event): void => {
            if (typeof view === 'string') return;
            event.preventDefault();
            const backboneView = view({
              onClose: (): void => void backboneView.remove(),
            });
            if (isOverlay)
              setCurrentOverlay(backboneView, `/specify/task/${task}/`);
            else setCurrentView(backboneView);
          }}
        >
          {icon}
          {title}
        </Link.Default>
      ))}
    </nav>
  );
}

type Collections = {
  readonly available: RA<Readonly<[number, string]>>;
  readonly current: number | null;
};

export function CollectionSelector(): JSX.Element {
  const [collections] = useAsyncState<Collections>(
    React.useCallback(
      async () =>
        ajax<Collections>('/context/collection/', {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'application/json' },
        }).then(({ data }) => data),
      []
    )
  );

  return (
    <Select
      className="flex-1"
      title={commonText('currentCollection')}
      aria-label={commonText('currentCollection')}
      value={collections?.current ?? undefined}
      onValueChange={(value): void =>
        navigation.switchCollection(Number.parseInt(value), '/', () => {
          /* Nothing */
        })
      }
    >
      {Array.from(collections?.available ?? [])
        .sort(sortFunction(([_id, name]) => name))
        .map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
    </Select>
  );
}

export function ExpressSearch(): JSX.Element {
  const [searchQuery, setSearchQuery] = React.useState<string>(
    () => querystring.parse().q ?? ''
  );
  return (
    <Form
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
      <Input.Generic
        type="search"
        className="flex-1"
        name="q"
        placeholder={commonText('search')}
        aria-label={commonText('search')}
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
    </Form>
  );
}

export function UserTools({
  userTools,
}: {
  readonly userTools: RA<UserTool>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Simple
        className="max-w-[110px] overflow-hidden whitespace-nowrap text-overflow-ellipsis"
        title={commonText('currentUser')}
        onClick={handleOpen}
      >
        {userInformation.name}
      </Button.Simple>
      <Dialog
        isOpen={isOpen}
        header={commonText('userToolsDialogTitle')}
        className={{
          container: dialogClassNames.narrowContainer,
        }}
        onClose={handleClose}
        buttons={commonText('close')}
      >
        <nav>
          <Ul>
            {[
              {
                task: '/accounts/logout',
                title: commonText('logOut'),
                basePath: '',
                view: undefined,
                isOverlay: false,
              },
              {
                task: '/accounts/password_change',
                title: commonText('changePassword'),
                basePath: '',
                view: undefined,
                isOverlay: false,
              },
              ...userTools.map((userTool) => ({
                ...userTool,
                basePath: '/specify/task/',
              })),
            ].map(({ task, title, basePath, view, isOverlay }) => (
              <li key={task}>
                <Link.Default
                  href={typeof view === 'string' ? view : `${basePath}${task}/`}
                  className={
                    typeof view === 'string' ? '' : className.navigationHandled
                  }
                  onClick={(event): void => {
                    if (typeof view !== 'function') return;
                    event.preventDefault();
                    handleClose();
                    const backboneView = view({
                      onClose: (): void => void backboneView.remove(),
                    });
                    if (isOverlay)
                      setCurrentOverlay(backboneView, `${basePath}${task}/`);
                    else setCurrentView(backboneView);
                  }}
                >
                  {title}
                </Link.Default>
              </li>
            ))}
          </Ul>
        </nav>
      </Dialog>
    </>
  );
}
