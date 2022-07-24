/**
 * Components for App's header and user tools
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { ajax } from '../ajax';
import type { Collection } from '../datamodel';
import type { SerializedModel } from '../datamodelutils';
import { serializeResource } from '../datamodelutils';
import { sortFunction, toLowerCase } from '../helpers';
import { commonText } from '../localization/common';
import { formatUrl, parseUrl } from '../querystring';
import { switchCollection } from '../specifyapp';
import type { IR, RA } from '../types';
import { Form, Input, Link, Select, Submit } from './basic';
import { useAsyncState } from './hooks';
import type { MenuItem } from './main';
import { usePref } from './preferenceshooks';

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
  /*React.useEffect(
    () =>
      resourceOn(router, 'route', (route: string) => {
        if (menuItems.some(({ task }) => task === route)) setActiveTask(route);
        else setActiveTask(routeMappings[route] ?? undefined);
      }),
    [menuItems]
  );*/

  return (
    <nav
      aria-label={commonText('primary')}
      className={`
        order-2 -mt-2 flex flex-1 flex-row flex-wrap
        px-2 lg:justify-center xl:m-0
      `}
    >
      {menuItems.map(({ title, icon, url }) => (
        <Link.Default
          // FIXME: refactor the active task system
          aria-current={url === activeTask ? 'page' : undefined}
          className={`
            relative
            inline-flex
            items-center
            gap-2
            rounded
            p-3
            text-gray-700
            active:bg-white
            dark:text-neutral-300
            active:dark:bg-neutral-600
            ${
              url === activeTask
                ? 'bg-white dark:bg-neutral-600 lg:!bg-transparent'
                : ''
            }
            lg:after:absolute
            lg:after:-bottom-1
            lg:after:left-0
            lg:after:right-0
            lg:after:h-2
            lg:after:w-full
            lg:after:bg-transparent
            lg:hover:after:bg-gray-200
            lg:hover:after:dark:bg-neutral-800
            ${url === activeTask ? 'lg:after:bg-gray-200' : ''}
            ${url === activeTask ? 'lg:after:dark:bg-neutral-800' : ''}
          `}
          href={url}
          key={url}
        >
          {icon}
          {title}
        </Link.Default>
      ))}
    </nav>
  );
}

type Collections = {
  readonly available: RA<SerializedModel<Collection>>;
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
    ),
    false
  );

  const [sortOrder] = usePref('chooseCollection', 'general', 'sortOrder');
  const isReverseSort = sortOrder.startsWith('-');
  const sortField = (isReverseSort ? sortOrder.slice(1) : sortOrder) as string &
    keyof Collection['fields'];
  const sortedCollections = React.useMemo(
    () =>
      typeof collections === 'object'
        ? Array.from(collections.available)
            .sort(
              sortFunction(
                (collection) => collection[toLowerCase(sortField)],
                isReverseSort
              )
            )
            .map(serializeResource)
        : undefined,
    [collections, isReverseSort, sortField]
  );

  return (
    <Select
      aria-label={commonText('currentCollection')}
      className="flex-1"
      title={commonText('currentCollection')}
      value={collections?.current ?? undefined}
      onValueChange={(value): void =>
        switchCollection(Number.parseInt(value), '/', () => {
          /* Nothing */
        })
      }
    >
      {collections === undefined && (
        <option disabled>{commonText('loading')}</option>
      )}
      {sortedCollections?.map(({ id, collectionName }) => (
        <option key={id} value={id}>
          {collectionName}
        </option>
      ))}
    </Select>
  );
}

export function ExpressSearch(): JSX.Element {
  const [searchQuery, setSearchQuery] = React.useState<string>(
    () => parseUrl().q ?? ''
  );
  const navigate = useNavigate();
  return (
    <Form
      action="/specify/express_search/"
      className="contents"
      role="search"
      onSubmit={(): void => {
        const query = searchQuery.trim();
        if (query.length === 0) return;
        const url = formatUrl('/specify/express_search/', {
          q: query,
        });
        navigate(url);
      }}
    >
      <Input.Generic
        aria-label={commonText('search')}
        autoComplete="on"
        className="flex-1"
        /* Name is for autocomplete purposes only */
        name="searchQuery"
        placeholder={commonText('search')}
        type="search"
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <Submit.Blue className="sr-only">{commonText('search')}</Submit.Blue>
    </Form>
  );
}
