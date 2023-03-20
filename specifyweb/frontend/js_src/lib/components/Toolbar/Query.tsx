/**
 * Display a list of queries
 */

import React from 'react';
import { useOutletContext } from 'react-router';
import { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { resourceEvents } from '../DataModel/resource';
import { getTableById, tables } from '../DataModel/tables';
import type { SpQuery } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { DateElement } from '../Molecules/DateElement';
import { Dialog } from '../Molecules/Dialog';
import { usePaginator } from '../Molecules/Paginator';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { TableIcon } from '../Molecules/TableIcon';
import { hasPermission, hasToolPermission } from '../Permissions/helpers';
import { QueryEditButton } from '../QueryBuilder/Edit';
import { OverlayContext } from '../Router/Router';
import { SafeOutlet } from '../Router/RouterUtils';
import { QueryTables } from './QueryTables';

export function QueriesOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return (
    <SafeOutlet<QueryListContextType>
      getQuerySelectUrl={undefined}
      newQueryUrl="/specify/overlay/queries/new/"
      onClose={handleClose}
    />
  );
}

export type QueryListContextType = {
  readonly queries?: RA<SerializedResource<SpQuery>>;
  readonly newQueryUrl: string;
  readonly onClose: () => void;
  readonly getQuerySelectUrl?: (
    query: SerializedResource<SpQuery>
  ) => string | undefined;
  readonly children?: (props: {
    readonly totalCount: number;
    readonly records: RA<SerializedResource<SpQuery>>;
    readonly children: JSX.Element;
    readonly dialog: (children: JSX.Element) => JSX.Element;
  }) => JSX.Element;
};

export function QueryListOutlet(): JSX.Element {
  const props = useOutletContext<QueryListContextType>();
  return <QueryListDialog {...props} />;
}

export function QueryListDialog({
  newQueryUrl,
  onClose: handleClose,
  getQuerySelectUrl,
  children = ({ children, dialog }): JSX.Element => dialog(children),
}: QueryListContextType): JSX.Element | null {
  const [sortConfig, handleSort] = useSortConfig(
    'listOfQueries',
    'name',
    false
  );

  const { paginator, limit, offset } = usePaginator('queryBuilder');

  const orderBy = `${sortConfig.ascending ? '' : '-'}${
    sortConfig.sortField
  }` as const;

  const [data, setData] = useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('SpQuery', {
          limit,
          specifyUser: userInformation.id,
          offset,
          orderBy,
        }),
      [limit, offset, orderBy]
    ),
    true
  );

  React.useEffect(
    () =>
      resourceEvents.on('deleted', (resource) => {
        if (resource.specifyTable.name === 'SpQuery')
          setData(
            data === undefined
              ? undefined
              : {
                  records: data.records.filter(
                    (query) => query.id !== resource.id
                  ),
                  totalCount: data.totalCount - 1,
                }
          );
      }),
    [data]
  );

  const isReadOnly = React.useContext(ReadOnlyContext);

  return typeof data === 'object'
    ? children({
        ...data,
        children: (
          <>
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
                {data.records.map((query) => (
                  <QueryList
                    key={query.id}
                    query={query}
                    isReadOnly={isReadOnly}
                    getQuerySelectUrl={getQuerySelectUrl}
                  />
                ))}
                {data.totalCount !== data.records.length && (
                  <tr>
                    <td colSpan={3}>{commonText.listTruncated()}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {paginator(data?.totalCount)}
          </>
        ),
        dialog: (children) => (
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
              count: data.totalCount,
            })}
            icon={<span className="text-blue-500">{icons.documentSearch}</span>}
            onClose={handleClose}
          >
            {children}
          </Dialog>
        ),
      })
    : null;
}

function QueryList({
  query,
  getQuerySelectUrl,
  isReadOnly,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly getQuerySelectUrl?: (
    query: SerializedResource<SpQuery>
  ) => string | undefined;
  readonly isReadOnly: boolean;
}): JSX.Element {
  return (
    <tr title={query.remarks ?? undefined}>
      <td>
        <Link.Default
          className="overflow-x-auto"
          href={getQuerySelectUrl?.(query) ?? `/specify/query/${query.id}/`}
        >
          <TableIcon label name={getTableById(query.contextTableId).name} />
          {query.name as LocalizedString}
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
  );
}

export function NewQuery(): JSX.Element {
  const { onClose: handleClose } = useOutletContext<QueryListContextType>();
  return <QueryTables onClose={handleClose} />;
}
