/**
 * Display a list of queries
 */

import React from 'react';
import { useOutletContext } from 'react-router';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import type { CollectionFetchFilters } from '../DataModel/collection';
import { fetchCollection } from '../DataModel/collection';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { getTableById, tables } from '../DataModel/tables';
import type { SpQuery } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { DateElement } from '../Molecules/DateElement';
import { Dialog } from '../Molecules/Dialog';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { TableIcon } from '../Molecules/TableIcon';
import { hasPermission, hasToolPermission } from '../Permissions/helpers';
import { QueryEditButton } from '../QueryBuilder/Edit';
import { OverlayContext } from '../Router/Router';
import { SafeOutlet } from '../Router/RouterUtils';
import { QueryTables } from './QueryTables';

export function QueriesOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  const queries = useQueries();
  return (
    <SafeOutlet<QueryListContextType>
      getQuerySelectUrl={undefined}
      newQueryUrl="/specify/overlay/queries/new/"
      queries={queries}
      onClose={handleClose}
    />
  );
}

const QUERY_FETCH_LIMIT = 5000;

export type QueryListContextType = {
  readonly queries: RA<SerializedResource<SpQuery>> | undefined;
  readonly newQueryUrl: string;
  readonly onClose: () => void;
  readonly getQuerySelectUrl?: (query: SerializedResource<SpQuery>) => string;
};

export function useQueries(
  spQueryFilter?: Partial<CollectionFetchFilters<SpQuery>>
): RA<SerializedResource<SpQuery>> | undefined {
  return useAsyncState<RA<SerializedResource<SpQuery>>>(
    React.useCallback(
      async () =>
        fetchCollection('SpQuery', {
          limit: QUERY_FETCH_LIMIT,
          ...(spQueryFilter ?? { specifyUser: userInformation.id }),
        }).then(({ records }) => records),
      [spQueryFilter]
    ),
    true
  )[0];
}

export function QueryListOutlet(): JSX.Element {
  const props = useOutletContext<QueryListContextType>();
  return <QueryListDialog {...props} />;
}

export function QueryListDialog({
  queries,
  newQueryUrl,
  onClose: handleClose,
  getQuerySelectUrl,
}: QueryListContextType): JSX.Element | null {
  return Array.isArray(queries) ? (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          {(hasToolPermission('queryBuilder', 'create') ||
            hasPermission('/querybuilder/query', 'execute')) && (
            <Link.Blue href={newQueryUrl}>{commonText.new()}</Link.Blue>
          )}
        </>
      }
      header={commonText.countLine({
        resource: queryText.queries(),
        count: queries.length,
      })}
      icon={<span className="text-blue-500">{icons.documentSearch}</span>}
      onClose={handleClose}
    >
      <QueryList getQuerySelectUrl={getQuerySelectUrl} queries={queries} />
    </Dialog>
  ) : null;
}

function QueryList({
  queries: unsortedQueries,
  getQuerySelectUrl,
}: {
  readonly queries: RA<SerializedResource<SpQuery>>;
  readonly getQuerySelectUrl?: (query: SerializedResource<SpQuery>) => string;
}): JSX.Element {
  const [sortConfig, handleSort, applySortConfig] = useSortConfig(
    'listOfQueries',
    'name',
    false
  );

  const queries = applySortConfig(
    unsortedQueries,
    (query) => query[sortConfig.sortField]
  );

  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <table className="grid-table grid-cols-[repeat(3,auto)_min-content] gap-2">
      <thead>
        <tr>
          <th
            className="pl-[calc(theme(spacing.table-icon)_+_theme(spacing.2))]"
            scope="col"
          >
            <Button.LikeLink onClick={(): void => handleSort('name')}>
              {getField(tables.SpQuery, 'name').label}
              <SortIndicator fieldName="name" sortConfig={sortConfig} />
            </Button.LikeLink>
          </th>
          <th scope="col">
            <Button.LikeLink
              onClick={(): void => handleSort('timestampCreated')}
            >
              {getField(tables.SpQuery, 'timestampCreated').label}
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
              {getField(tables.SpQuery, 'timestampModified').label}
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
                className="overflow-x-auto"
                href={
                  getQuerySelectUrl?.(query) ?? `/specify/query/${query.id}/`
                }
              >
                <TableIcon
                  label
                  name={getTableById(query.contextTableId).name}
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

export function NewQuery(): JSX.Element {
  const { queries, onClose: handleClose } =
    useOutletContext<QueryListContextType>();
  return <QueryTables queries={queries} onClose={handleClose} />;
}
