import React from 'react';
import { useParams } from 'react-router-dom';

import type { RecordSet, SpQuery } from '../DataModel/types';
import { f } from '../../utils/functools';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { queryText } from '../../localization/query';
import { hasPermission, hasToolPermission } from '../Permissions/helpers';
import { queryFromTree } from './fromTree';
import { fetchResource } from '../DataModel/resource';
import { getModel, schema } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { isTreeModel } from '../InitialContext/treeRanks';
import { userInformation } from '../InitialContext/userInformation';
import { NotFoundView } from '../Router/NotFoundView';
import { ProtectedTool, ProtectedTree } from '../Permissions/PermissionDenied';
import { QueryBuilder } from './Wrapped';
import { deserializeResource } from '../../hooks/resource';
import { useSearchParameter } from '../../hooks/navigation';
import { useAsyncState } from '../../hooks/useAsyncState';
import { AnyTree } from '../DataModel/helperTypes';

function useQueryRecordSet(): SpecifyResource<RecordSet> | false | undefined {
  const [recordsetid = ''] = useSearchParameter('recordsetid');
  const [recordSet] = useAsyncState<SpecifyResource<RecordSet> | false>(
    React.useCallback(() => {
      if (!hasToolPermission('recordSets', 'read')) return false;
      const recordSetId = f.parseInt(recordsetid);
      if (recordSetId === undefined) return false;
      const recordSet = new schema.models.RecordSet.Resource({
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
      isReadOnly={
        !hasPermission('/querybuilder/query', 'execute') &&
        !hasToolPermission('queryBuilder', query.isNew() ? 'create' : 'update')
      }
      query={query}
      recordSet={typeof recordSet === 'object' ? recordSet : undefined}
      forceCollection={undefined}
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
    <QueryBuilderWrapper query={query} recordSet={recordSet} />
  );
}

export function createQuery(
  name: string,
  model: SpecifyModel
): SpecifyResource<SpQuery> {
  const query = new schema.models.SpQuery.Resource();
  query.set('name', name);
  query.set('contextName', model.name);
  query.set('contextTableId', model.tableId);
  query.set('selectDistinct', false);
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
  const model = getModel(tableName);
  return typeof model === 'object' ? (
    <NewQuery model={model} />
  ) : (
    <NotFoundView />
  );
}

function NewQuery({
  model,
}: {
  readonly model: SpecifyModel;
}): JSX.Element | null {
  const query = React.useMemo<SpecifyResource<SpQuery>>(
    () => createQuery(queryText('newQueryName'), model),
    [model]
  );

  const recordSet = useQueryRecordSet();

  return recordSet === undefined ? null : (
    <QueryBuilderWrapper query={query} recordSet={recordSet} />
  );
}

export function QueryBuilderFromTree(): JSX.Element | null {
  const { tableName = '', id } = useParams();
  const nodeId = f.parseInt(id);
  const model = getModel(tableName);
  return typeof model === 'object' &&
    isTreeModel(model.name) &&
    typeof nodeId === 'number' ? (
    <ProtectedTree action="read" treeName={model.name}>
      <QueryFromTree model={model as SpecifyModel<AnyTree>} nodeId={nodeId} />
    </ProtectedTree>
  ) : (
    <NotFoundView />
  );
}

function QueryFromTree({
  model,
  nodeId,
}: {
  readonly model: SpecifyModel<AnyTree>;
  readonly nodeId: number;
}): JSX.Element | null {
  const [query] = useAsyncState<SpecifyResource<SpQuery>>(
    React.useCallback(
      async () => queryFromTree(model.name, nodeId),
      [model.name, nodeId]
    ),
    true
  );

  return query === undefined ? null : (
    <QueryBuilderWrapper autoRun query={query} />
  );
}
