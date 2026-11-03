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
import { Input } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { DataEntry } from '../Atoms/DataEntry';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import { backendFilter, getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { idFromUrl, resourceEvents } from '../DataModel/resource';
import { deserializeResource } from '../DataModel/serializers';
import { getTableById, tables } from '../DataModel/tables';
import type { SpQuery } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { loadingGif } from '../Molecules';
import { DateElement } from '../Molecules/DateElement';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { usePaginator } from '../Molecules/Paginator';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { TableIcon } from '../Molecules/TableIcon';
import { hasPermission, hasToolPermission } from '../Permissions/helpers';
import { QueryEditButton } from '../QueryBuilder/Edit';
import { cloneSharedQuery } from '../QueryBuilder/Save';
import { OverlayContext } from '../Router/Router';
import { SafeOutlet } from '../Router/RouterUtils';
import { DialogListSkeleton } from '../SkeletonLoaders/DialogList';
import { QueryTablesWrapper } from './QueryTablesWrapper';
import { interactionsText } from '../../localization/interactions';

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

  const { paginator, limit, offset, currentPage } =
    usePaginator('queryBuilder');

  const orderBy = `${sortConfig.ascending ? '' : '-'}${
    sortConfig.sortField
  }` as const;

  const [search, setSearch] = React.useState('');
  const searchFilter = search.trim();
  const [section, setSection] = React.useState<
    'personal' | 'shared' | 'sharing'
  >('personal');
  const [refreshToken, setRefreshToken] = React.useState(0);
  const ownerId = filters?.specifyUser ?? userInformation.id;
  const [data] = useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection(
          'SpQuery',
          {
            limit,
            domainFilter: false,
            ...(section === 'shared'
              ? { contextTableId: filters?.contextTableId }
              : { ...filters, specifyUser: ownerId }),
            offset,
            orderBy,
          },
          {
            ...(section === 'shared'
              ? { share_grants__recipient: userInformation.id }
              : {
                  share_grants__isnull:
                    section === 'personal' ? 'true' : 'false',
                }),
            ...(searchFilter === ''
              ? {}
              : backendFilter('name').caseInsensitiveContains(searchFilter)),
          }
        ),
      [
        filters,
        ownerId,
        limit,
        offset,
        orderBy,
        searchFilter,
        section,
        refreshToken,
      ]
    ),
    false
  );

  React.useEffect(
    () =>
      resourceEvents.on('deleted', (resource) => {
        if (resource.specifyTable.name !== 'SpQuery' || data === undefined)
          return;
        setRefreshToken((token) => token + 1);
      }),
    [data]
  );

  React.useEffect(() => {
    if (section !== 'shared') return;
    const handleFocus = (): void => setRefreshToken((token) => token + 1);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [section]);

  React.useEffect(() => {
    if (data === undefined) return;
    const lastPage = Math.max(0, Math.ceil(data.totalCount / limit) - 1);
    if (currentPage[0] > lastPage) currentPage[1](lastPage);
  }, [data, limit, currentPage]);
  const totalCountRef = React.useRef<number | undefined>(undefined);
  totalCountRef.current = data?.totalCount ?? totalCountRef.current;
  const totalCount = totalCountRef.current;

  const isReadOnly = React.useContext(ReadOnlyContext);

  return children({
    totalCount,
    records: data?.records,
    children: (
      <>
        <div aria-label={queryText.queries()} className="flex gap-2">
          {(
            [
              ['personal', queryText.personalQueries()],
              ['shared', queryText.sharedQueries()],
              ...(userInformation.isadmin
                ? [['sharing', queryText.queriesIShare()] as const]
                : []),
            ] as const
          ).map(([value, label]) => (
            <Button.Secondary
              aria-pressed={section === value}
              key={value}
              onClick={(): void => {
                currentPage[1](0);
                setSection(value);
              }}
            >
              {label}
            </Button.Secondary>
          ))}
        </div>
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
                isReadOnly={
                  isReadOnly ||
                  idFromUrl(query.specifyUser) !== userInformation.id
                }
                canClone={
                  section === 'shared' &&
                  !isReadOnly &&
                  hasToolPermission('queryBuilder', 'create')
                }
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
            <Input.Text
              aria-label={commonText.searchFor({
                resource: queryText.queries(),
              })}
              className="min-w-0 max-w-sm flex-1"
              placeholder={commonText.searchFor({
                resource: queryText.queries(),
              })}
              value={search}
              onValueChange={(value): void => {
                setSearch(value);
                currentPage[1](0);
              }}
            />
            <span className="flex-1" />
            <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
            {(hasToolPermission('queryBuilder', 'create') ||
              hasPermission('/querybuilder/query', 'execute')) && (
              <Link.Info href={newQueryUrl}>{commonText.new()}</Link.Info>
            )}
          </>
        }
        className={{
          container: `${dialogClassNames.narrowContainer}
            h-[min(40rem)] w-[min(45rem)]`,
        }}
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
  canClone = false,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly getQuerySelectCallback?: (
    query: SerializedResource<SpQuery>
  ) => string | (() => void);
  readonly isReadOnly: boolean;
  readonly canClone?: boolean;
}): JSX.Element {
  const [confirmClone, setConfirmClone] = React.useState(false);
  const loading = React.useContext(LoadingContext);
  const callBack =
    getQuerySelectCallback?.(query) ?? `/specify/query/${query.id}/`;
  const text = (
    <>
      <TableIcon label name={getTableById(query.contextTableId).name} />
      {query.name}
    </>
  );
  return (
    <>
      <tr title={query.remarks ?? undefined}>
        <td>
          <div className="flex items-center gap-2">
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
            {canClone && (
              <DataEntry.Clone
                aria-label={queryText.cloneSharedQuery()}
                onClick={(): void => setConfirmClone(true)}
              />
            )}
          </div>
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
      {confirmClone && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Success
                onClick={(): void =>
                  loading(
                    cloneSharedQuery(deserializeResource(query)).then(() =>
                      setConfirmClone(false)
                    )
                  )
                }
              >
                {interactionsText.continue()}
              </Button.Success>
            </>
          }
          header={queryText.cloneSharedQuery()}
          onClose={(): void => setConfirmClone(false)}
        >
          <p>{queryText.confirmCloneSharedQuery({ queryName: query.name })}</p>
        </Dialog>
      )}
    </>
  );
}

export function NewQuery(): JSX.Element {
  const { onClose: handleClose } = useOutletContext<QueryListContextType>();
  return <QueryTablesWrapper onClick={undefined} onClose={handleClose} />;
}
