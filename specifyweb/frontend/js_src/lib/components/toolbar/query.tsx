/**
 * Display a list of queries
 */

import React from 'react';

import type { CollectionFetchFilters } from '../../collection';
import { fetchCollection } from '../../collection';
import type { SpQuery } from '../../datamodel';
import type { SerializedResource } from '../../datamodelutils';
import { sortFunction } from '../../helpers';
import { commonText } from '../../localization/common';
import { hasPermission, hasToolPermission } from '../../permissionutils';
import { getUserPref } from '../../preferencesutils';
import { getModelById } from '../../schema';
import type { RA } from '../../types';
import { userInformation } from '../../userinfo';
import { Button, Link } from '../basic';
import { SortIndicator, TableIcon, useSortConfig } from '../common';
import { ErrorBoundary } from '../errorboundary';
import { useAsyncState, useBooleanState, useTitle } from '../hooks';
import { icons } from '../icons';
import { DateElement } from '../internationalization';
import type { MenuItem } from '../main';
import { Dialog } from '../modaldialog';
import { QueryEditButton } from '../queryedit';
import { QueryTables } from '../querytables';

const defaultSortConfig = {
  sortField: 'timestampCreated',
  ascending: false,
} as const;

function QueryList({
  queries: unsortedQueries,
  isReadOnly,
  getQuerySelectUrl,
}: {
  readonly queries: RA<SerializedResource<SpQuery>>;
  readonly isReadOnly: boolean;
  readonly getQuerySelectUrl?: (query: SerializedResource<SpQuery>) => string;
}): JSX.Element {
  const [sortConfig = defaultSortConfig, handleSort] =
    useSortConfig('listOfQueries');

  const queries = Array.from(unsortedQueries).sort(
    sortFunction(
      sortConfig.sortField === 'name'
        ? ({ name }): string => name
        : ({ timestampCreated }): string => timestampCreated,
      !sortConfig.ascending
    )
  );

  return (
    <table className="grid-table grid-cols-[repeat(3,auto)_min-content] gap-2">
      <thead>
        <tr>
          <th
            scope="col"
            className="pl-[calc(theme(spacing.table-icon)_+_theme(spacing.2))]"
          >
            <Button.LikeLink onClick={(): void => handleSort('name')}>
              {commonText('name')}
              <SortIndicator fieldName="name" sortConfig={sortConfig} />
            </Button.LikeLink>
          </th>
          <th scope="col">
            <Button.LikeLink
              onClick={(): void => handleSort('timestampCreated')}
            >
              {commonText('created')}
              <SortIndicator
                fieldName="timestampCreated"
                sortConfig={sortConfig}
              />
            </Button.LikeLink>
          </th>
          <th scope="col">
            <Button.LikeLink
              onClick={(): void => handleSort('timestampModified')}
            >
              {commonText('modified')}
              <SortIndicator
                fieldName="timestampModified"
                sortConfig={sortConfig}
              />
            </Button.LikeLink>
          </th>
          <td />
        </tr>
      </thead>
      <tbody>
        {queries.map((query) => (
          <tr key={query.id} title={query.remarks ?? undefined}>
            <td>
              <Link.Default
                href={
                  getQuerySelectUrl?.(query) ?? `/specify/query/${query.id}/`
                }
                className="overflow-x-auto"
              >
                <TableIcon
                  name={getModelById(query.contextTableId).name}
                  label
                />
                {query.name}
              </Link.Default>
            </td>
            <td>
              <DateElement date={query.timestampCreated} />
            </td>
            <td>
              {typeof query.timestampModified === 'string' && (
                <DateElement date={query.timestampModified} />
              )}
            </td>
            <td className="justify-end">
              {!isReadOnly && <QueryEditButton query={query} />}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const QUERY_FETCH_LIMIT = 5000;

export function QueryToolbarItem({
  onClose: handleClose,
  getQuerySelectUrl,
  spQueryFilter,
  onNewQuery: handleNewQuery,
  isReadOnly,
}: {
  readonly onClose: () => void;
  readonly getQuerySelectUrl?: (query: SerializedResource<SpQuery>) => string;
  readonly spQueryFilter?: Partial<CollectionFetchFilters<SpQuery>>;
  readonly onNewQuery?: () => void;
  readonly isReadOnly: boolean;
}): JSX.Element | null {
  useTitle(commonText('queries'));

  const [queries] = useAsyncState<RA<SerializedResource<SpQuery>>>(
    React.useCallback(
      async () =>
        fetchCollection('SpQuery', {
          limit: QUERY_FETCH_LIMIT,
          ...(spQueryFilter ?? { specifyUser: userInformation.id }),
        }).then(({ records }) => records),
      [spQueryFilter]
    ),
    true
  );

  const [isCreating, handleCreating] = useBooleanState();

  return isCreating ? (
    <QueryTables
      queries={queries}
      isReadOnly={isReadOnly}
      onClose={handleClose}
    />
  ) : Array.isArray(queries) ? (
    <Dialog
      icon={<span className="text-blue-500">{icons.documentSearch}</span>}
      header={commonText('queriesDialogTitle', queries.length)}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          {(hasToolPermission('queryBuilder', 'create') ||
            hasPermission('/querybuilder/query', 'execute')) && (
            <Button.Blue onClick={handleNewQuery ?? handleCreating}>
              {commonText('new')}
            </Button.Blue>
          )}
        </>
      }
    >
      <QueryList
        queries={queries}
        isReadOnly={isReadOnly}
        getQuerySelectUrl={getQuerySelectUrl}
      />
    </Dialog>
  ) : null;
}

export const menuItem: MenuItem = {
  task: 'query',
  title: commonText('queries'),
  icon: icons.documentSearch,
  isOverlay: true,
  enabled: () =>
    (hasToolPermission('queryBuilder', 'read') ||
      hasPermission('/querybuilder/query', 'execute')) &&
    getUserPref('header', 'menu', 'showQueries'),
  view: ({ onClose: handleClose }) => (
    <ErrorBoundary dismissable>
      <QueryToolbarItem
        onClose={handleClose}
        getQuerySelectUrl={undefined}
        isReadOnly={false}
      />
    </ErrorBoundary>
  ),
};
