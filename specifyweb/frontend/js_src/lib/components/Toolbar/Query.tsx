/**
 * Display a list of queries
 */

import React from 'react';
import { useOutletContext } from 'react-router';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
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
import { loadingGif } from '../Molecules';
import { DateElement } from '../Molecules/DateElement';
import { Dialog } from '../Molecules/Dialog';
import { usePaginator } from '../Molecules/Paginator';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { TableIcon } from '../Molecules/TableIcon';
import { hasPermission, hasToolPermission } from '../Permissions/helpers';
import { QueryEditButton } from '../QueryBuilder/Edit';
import { OverlayContext } from '../Router/Router';
import { SafeOutlet } from '../Router/RouterUtils';
import { DialogListSkeleton } from '../SkeletonLoaders/DialogList';
import { QueryTablesWrapper } from './QueryTablesWrapper';

export function QueriesOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return (
    <SafeOutlet<QueryListContextType>
      getQuerySelectCallback={undefined}
      newQueryUrl="/specify/overlay/queries/new/"
      onClose={handleClose}
    />
  );
}

export type QueryListContextType = {
  readonly newQueryUrl: string;
  readonly onClose: () => void;
  readonly getQuerySelectCallback?: (
    query: SerializedResource<SpQuery>
  ) => string | (() => void);
  readonly children?: (props: {
    readonly totalCount: number | undefined;
    readonly records: RA<SerializedResource<SpQuery>> | undefined;
    readonly children: JSX.Element;
    readonly dialog: (children: JSX.Element) => JSX.Element;
  }) => JSX.Element;
  readonly filters?: {
    readonly specifyUser: number;
    readonly contextTableId: number;
  };
};

export function QueryListOutlet(): JSX.Element {
  const props = useOutletContext<QueryListContextType>();
  return <QueryListDialog {...props} />;
}

const defaultChildren: Exclude<QueryListContextType['children'], undefined> = ({
  children,
  dialog,
}): JSX.Element =>
  children === undefined ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText.cancel()}</Button.DialogClose>}
      header={queryText.queries()}
      icon={icons.documentSearch}
      onClose={f.never()}
    >
      <DialogListSkeleton />
    </Dialog>
  ) : (
    dialog(children)
  );

export function QueryListDialog({
  newQueryUrl,
  onClose: handleClose,
  getQuerySelectCallback,
  children = defaultChildren,
  filters,
}: QueryListContextType): JSX.Element {
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
          domainFilter: false,
          ...(filters ?? { specifyUser: userInformation.id }),
          offset,
          orderBy,
        }),
      [limit, offset, orderBy]
    ),
    false
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
    [data, setData]
  );

  const totalCountRef = React.useRef<number | undefined>(undefined);
  totalCountRef.current = data?.totalCount ?? totalCountRef.current;
  const totalCount = totalCountRef.current;

  const isReadOnly = React.useContext(ReadOnlyContext);

  return children({
    totalCount,
    records: data?.records,
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
            {data?.records.map((query) => (
              <QueryList
                getQuerySelectCallback={getQuerySelectCallback}
                isReadOnly={isReadOnly}
                key={query.id}
                query={query}
              />
            ))}
          </tbody>
        </table>
        <span className="-ml-2 flex-1" />
        {data === undefined && loadingGif}
        {data !== undefined && data.records.length > 0
          ? paginator(data?.totalCount)
          : null}
      </>
    ),
    dialog: (children) => (
      <Dialog
        buttons={
          <>
            <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
            {(hasToolPermission('queryBuilder', 'create') ||
              hasPermission('/querybuilder/query', 'execute')) && (
              <Link.Info href={newQueryUrl}>{commonText.new()}</Link.Info>
            )}
          </>
        }
        header={
          totalCount === undefined
            ? queryText.queries()
            : commonText.countLine({
                resource: queryText.queries(),
                count: totalCount,
              })
        }
        icon={icons.documentSearch}
        onClose={handleClose}
      >
        {children}
      </Dialog>
    ),
  });
}

export function QueryList({
  query,
  getQuerySelectCallback,
  isReadOnly,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly getQuerySelectCallback?: (
    query: SerializedResource<SpQuery>
  ) => string | (() => void);
  readonly isReadOnly: boolean;
}): JSX.Element {
  const callBack =
    getQuerySelectCallback?.(query) ?? `/specify/query/${query.id}/`;
  const text = (
    <>
      <TableIcon label name={getTableById(query.contextTableId).name} />
      {query.name}
    </>
  );
  return (
    <tr title={query.remarks ?? undefined}>
      <td>
        {typeof callBack === 'string' ? (
          <Link.Default
            /*
             * BUG: consider applying these styles everywhere
             * className="max-w-full overflow-auto"
             */
            className="overflow-x-auto"
            href={callBack}
          >
            {text}
          </Link.Default>
        ) : (
          <Button.LikeLink className="overflow-x-auto" onClick={callBack}>
            {text}
          </Button.LikeLink>
        )}
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
  return <QueryTablesWrapper onClick={undefined} onClose={handleClose} />;
}
