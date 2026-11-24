/**
 * Display a list of queries
 */

import React from 'react';
import { useOutletContext } from 'react-router';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { raise } from '../Errors/Crash';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { DataEntry } from '../Atoms/DataEntry';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import type { SerializedCollection } from '../DataModel/collection';
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
import { useQueryRefresh } from '../QueryBuilder/useQueryRefresh';
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

type CloneState = {
  readonly confirmClone: boolean;
  readonly clonePending: boolean;
};

const defaultCloneState: CloneState = {
  confirmClone: false,
  clonePending: false,
};

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
  const [cloneStates, setCloneStates] = React.useState<
    Readonly<Record<number, CloneState>>
  >({});
  const ownerId = filters?.specifyUser ?? userInformation.id;
  const fetchQueries = React.useCallback(
    async (waitForPendingGet = false) =>
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
                share_grants__isnull: section === 'personal' ? 'true' : 'false',
              }),
          ...(searchFilter === ''
            ? {}
            : backendFilter('name').caseInsensitiveContains(searchFilter)),
        },
        { waitForPendingGet }
      ),
    [filters, ownerId, limit, offset, orderBy, searchFilter, section]
  );
  const [data, setData] = React.useState<
    SerializedCollection<SpQuery> | undefined
  >(undefined);
  const lastFetchQueries = React.useRef(fetchQueries);
  const lastRefreshToken = React.useRef(refreshToken);
  React.useLayoutEffect(() => {
    const isRefresh = lastRefreshToken.current !== refreshToken;
    lastRefreshToken.current = refreshToken;
    if (lastFetchQueries.current !== fetchQueries) {
      lastFetchQueries.current = fetchQueries;
      setData(undefined);
    }

    let isCurrent = true;
    void fetchQueries(isRefresh)
      .then((newData) => {
        if (isCurrent) setData(newData);
      })
      .catch(raise);
    return (): void => {
      isCurrent = false;
    };
  }, [fetchQueries, refreshToken]);

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
    const handleFocus = (): void => setRefreshToken((token) => token + 1);
    window.addEventListener('focus', handleFocus);
    const interval =
      section === 'shared' || section === 'sharing'
        ? window.setInterval(handleFocus, 30_000)
        : undefined;
    return () => {
      if (interval !== undefined) window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
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
      <div className="flex min-h-0 min-w-0 flex-1 gap-4 overflow-hidden">
        <nav
          aria-label={queryText.queries()}
          className="flex w-44 shrink-0 flex-col gap-1 border-r border-gray-200 pr-3 dark:border-neutral-700"
        >
          {(
            [
              ['personal', queryText.yourQueries(), icons.folder],
              ['sharing', queryText.queriesIShare(), icons.documentSearch],
              ['shared', queryText.sharedQueries(), icons.globe],
            ] as const
          ).map(([value, label, icon]) => (
            <Button.LikeLink
              aria-current={section === value ? 'page' : undefined}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left ${
                section === value
                  ? 'bg-brand-100 font-semibold dark:bg-brand-400 dark:text-white dark:hover:text-white'
                  : 'hover:bg-brand-50 dark:hover:bg-neutral-700'
              }`}
              key={value}
              onClick={(): void => {
                currentPage[1](0);
                setSection(value);
              }}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {icon}
              </span>
              <span>{label}</span>
            </Button.LikeLink>
          ))}
        </nav>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto">
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
                    cloneState={cloneStates[query.id] ?? defaultCloneState}
                    onCloneStateChange={(state): void =>
                      setCloneStates((states) => ({
                        ...states,
                        [query.id]: {
                          ...(states[query.id] ?? defaultCloneState),
                          ...state,
                        },
                      }))
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-shrink-0 items-center pt-2">
            <span className="-ml-2 flex-1" />
            {data === undefined && loadingGif}
            {data !== undefined && data.records.length > 0
              ? paginator(data?.totalCount)
              : null}
          </div>
        </div>
      </div>
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
          container: `${dialogClassNames.normalContainer}
            h-[min(40rem)] w-[min(55rem,90vw)]`,
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
  cloneState: { confirmClone, clonePending },
  onCloneStateChange: handleCloneStateChange,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly getQuerySelectCallback?: (
    query: SerializedResource<SpQuery>
  ) => string | (() => void);
  readonly isReadOnly: boolean;
  readonly canClone?: boolean;
  readonly cloneState: CloneState;
  readonly onCloneStateChange: (state: Partial<CloneState>) => void;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const queryResource = React.useMemo(
    () => deserializeResource(query),
    [query]
  );
  const { refreshQuery, conflictDialog } = useQueryRefresh(queryResource);
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
                onClick={(): void =>
                  handleCloneStateChange({ confirmClone: true })
                }
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
          {!isReadOnly && (
            <QueryEditButton
              queryResource={queryResource}
              onRefresh={refreshQuery}
            />
          )}
        </td>
      </tr>
      {conflictDialog}
      {confirmClone && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Success
                disabled={clonePending}
                onClick={(): void => {
                  handleCloneStateChange({ clonePending: true });
                  loading(
                    cloneSharedQuery(deserializeResource(query))
                      .then(() =>
                        handleCloneStateChange({ confirmClone: false })
                      )
                      .finally(() =>
                        handleCloneStateChange({ clonePending: false })
                      )
                  );
                }}
              >
                {interactionsText.continue()}
              </Button.Success>
            </>
          }
          header={queryText.cloneSharedQuery()}
          onClose={(): void => handleCloneStateChange({ confirmClone: false })}
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
