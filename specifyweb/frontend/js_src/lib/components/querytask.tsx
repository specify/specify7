import React from 'react';

import { Http } from '../ajax';
import type { RecordSet, SpQuery } from '../datamodel';
import type { AnyTree } from '../datamodelutils';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { queryText } from '../localization/query';
import { hasPermission, hasToolPermission } from '../permissionutils';
import { fetchPickLists } from '../picklists';
import { queryFromTree } from '../queryfromtree';
import { parseUrl } from '../querystring';
import { router } from '../router';
import { getModel, schema } from '../schema';
import { setCurrentComponent } from '../specifyapp';
import type { SpecifyModel } from '../specifymodel';
import { isTreeModel } from '../treedefinitions';
import { userInformation } from '../userinfo';
import { useAsyncState } from './hooks';
import { NotFoundView } from './notfoundview';
import { ProtectedTool, ProtectedTree } from './permissiondenied';
import { QueryBuilder } from './querybuilder';

function useQueryRecordSet(): SpecifyResource<RecordSet> | false | undefined {
  const [recordSet] = useAsyncState<SpecifyResource<RecordSet> | false>(
    React.useCallback(() => {
      if (!hasToolPermission('recordSets', 'read')) return false;
      const recordSetId = f.parseInt(parseUrl().recordsetid ?? '');
      if (recordSetId === undefined) return false;
      const recordSet = new schema.models.RecordSet.Resource({
        id: recordSetId,
      });
      return recordSet.fetch();
    }, []),
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
}): JSX.Element | null {
  const isLoaded = typeof useAsyncState(fetchPickLists, true)[0] === 'object';

  return isLoaded ? (
    <QueryBuilder
      autoRun={autoRun}
      isReadOnly={
        !hasPermission('/querybuilder/query', 'execute') &&
        !hasToolPermission('queryBuilder', query.isNew() ? 'create' : 'update')
      }
      query={query}
      recordSet={typeof recordSet === 'object' ? recordSet : undefined}
    />
  ) : null;
}

function QueryBuilderById({
  queryId,
}: {
  readonly queryId: number;
}): JSX.Element | null {
  const [query] = useAsyncState<SpecifyResource<SpQuery>>(
    React.useCallback(async () => {
      const query = new schema.models.SpQuery.Resource({ id: queryId });
      return query.fetch().catch((error) => {
        if (error.status === Http.NOT_FOUND)
          setCurrentComponent(<NotFoundView />);
        else throw error;
        return undefined;
      });
    }, [queryId]),
    false
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

function NewQuery({
  tableName,
}: {
  readonly tableName: string;
}): JSX.Element | null {
  const query = React.useMemo<SpecifyResource<SpQuery> | undefined>(() => {
    const model = getModel(tableName);
    if (model === undefined) {
      setCurrentComponent(<NotFoundView />);
      return undefined;
    }
    return createQuery(queryText('newQueryName'), model);
  }, [tableName]);
  const recordSet = useQueryRecordSet();

  return query === undefined || recordSet === undefined ? null : (
    <QueryBuilderWrapper query={query} recordSet={recordSet} />
  );
}

function QueryBuilderFromTree({
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

export function task(): void {
  router.route('query/:id/', 'storedQuery', (id) =>
    setCurrentComponent(
      <ProtectedTool action="read" tool="queryBuilder">
        <QueryBuilderById queryId={Number.parseInt(id)} />
      </ProtectedTool>
    )
  );
  router.route('query/new/:table/', 'ephemeralQuery', (tableName) =>
    setCurrentComponent(<NewQuery tableName={tableName} />)
  );
  router.route(
    'query/fromtree/:table/:id/',
    'queryFromTree',
    (tableName, nodeId) =>
      setCurrentComponent(
        f.var(getModel(tableName), (model) =>
          typeof model === 'object' && isTreeModel(model.name) ? (
            <ProtectedTree action="read" treeName={model.name}>
              <QueryBuilderFromTree
                model={model as SpecifyModel<AnyTree>}
                nodeId={Number.parseInt(nodeId)}
              />
            </ProtectedTree>
          ) : (
            <NotFoundView />
          )
        )
      )
  );
}
