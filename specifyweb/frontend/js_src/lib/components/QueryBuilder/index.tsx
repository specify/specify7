import React from 'react';
import { useParams } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { useAsyncState } from '../../hooks/useAsyncState';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { AnyTree } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { fetchResource } from '../DataModel/resource';
import { deserializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTable, tables } from '../DataModel/tables';
import type { RecordSet, SpQuery } from '../DataModel/types';
import { isTreeTable } from '../InitialContext/treeRanks';
import { userInformation } from '../InitialContext/userInformation';
import { hasToolPermission } from '../Permissions/helpers';
import { ProtectedTool, ProtectedTree } from '../Permissions/PermissionDenied';
import { NotFoundView } from '../Router/NotFoundView';
import { queryFromTree } from './fromTree';
import { QueryBuilder } from './Wrapped';

function useQueryRecordSet(): SpecifyResource<RecordSet> | false | undefined {
  const [recordsetid = ''] = useSearchParameter('recordSetId');
  const [recordSet] = useAsyncState<SpecifyResource<RecordSet> | false>(
    React.useCallback(async () => {
      if (!hasToolPermission('recordSets', 'read')) return false;
      const recordSetId = f.parseInt(recordsetid);
      if (recordSetId === undefined) return false;
      const recordSet = new tables.RecordSet.Resource({
        id: recordSetId,
      });
      return recordSet.fetch();
    }, [recordsetid]),
    true
  );

  return recordSet;
}

function QueryBuilderWrapper({
  query,
  autoRun = false,
  recordSet,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly autoRun?: boolean;
  readonly recordSet?: SpecifyResource<RecordSet> | false;
}): JSX.Element {
  return (
    <QueryBuilder
      autoRun={autoRun}
      forceCollection={undefined}
      query={query}
      recordSet={typeof recordSet === 'object' ? recordSet : undefined}
    />
  );
}

export function QueryBuilderById(): JSX.Element {
  const { id } = useParams();
  const queryId = f.parseInt(id);
  return typeof queryId === 'number' ? (
    <ProtectedTool action="read" tool="queryBuilder">
      <QueryById queryId={queryId} />
    </ProtectedTool>
  ) : (
    <NotFoundView />
  );
}

function QueryById({
  queryId,
}: {
  readonly queryId: number;
}): JSX.Element | null {
  const [query] = useAsyncState<SpecifyResource<SpQuery>>(
    React.useCallback(
      async () => fetchResource('SpQuery', queryId).then(deserializeResource),
      [queryId]
    ),
    true
  );
  const recordSet = useQueryRecordSet();

  return query === undefined || recordSet === undefined ? null : (
    <QueryBuilderWrapper key={queryId} query={query} recordSet={recordSet} />
  );
}

export function createQuery(
  name: string,
  table: SpecifyTable
): SpecifyResource<SpQuery> {
  const query = new tables.SpQuery.Resource();
  query.set('name', name);
  query.set('contextName', table.name);
  query.set('contextTableId', table.tableId);
  query.set('selectDistinct', false);
  query.set('selectSeries', false);
  query.set('countOnly', false);
  query.set('formatAuditRecIds', false);
  query.set('specifyUser', userInformation.resource_uri);
  query.set('isFavorite', true);
  /*
   * Ordinal seems to always get set to 32767 by Specify 6
   * needs to be set for the query to be visible in Specify 6
   */
  query.set('ordinal', 32_767);
  return query;
}

export function NewQueryBuilder(): JSX.Element {
  const { tableName = '' } = useParams();
  const table = getTable(tableName);
  return typeof table === 'object' ? (
    <NewQuery table={table} />
  ) : (
    <NotFoundView />
  );
}

function NewQuery({
  table,
}: {
  readonly table: SpecifyTable;
}): JSX.Element | null {
  const query = React.useMemo<SpecifyResource<SpQuery>>(
    () => createQuery(queryText.newQueryName(), table),
    [table]
  );

  const recordSet = useQueryRecordSet();

  return recordSet === undefined ? null : (
    <QueryBuilderWrapper key={table.name} query={query} recordSet={recordSet} />
  );
}

export function QueryBuilderFromTree(): JSX.Element | null {
  const { tableName = '', id } = useParams();
  const nodeId = f.parseInt(id);
  const table = getTable(tableName);
  return typeof table === 'object' &&
    isTreeTable(table.name) &&
    typeof nodeId === 'number' ? (
    <ProtectedTree action="read" treeName={table.name}>
      <QueryFromTree nodeId={nodeId} table={table as SpecifyTable<AnyTree>} />
    </ProtectedTree>
  ) : (
    <NotFoundView />
  );
}

function QueryFromTree({
  table,
  nodeId,
}: {
  readonly table: SpecifyTable<AnyTree>;
  readonly nodeId: number;
}): JSX.Element | null {
  const [query] = useAsyncState<SpecifyResource<SpQuery>>(
    React.useCallback(
      async () => queryFromTree(table.name, nodeId),
      [table.name, nodeId]
    ),
    true
  );

  return query === undefined ? null : (
    <QueryBuilderWrapper autoRun query={query} />
  );
}
