import React from 'react';

import { Http } from '../ajax';
import type { RecordSet, SpQuery } from '../datamodel';
import type { AnyTree } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { queryText } from '../localization/query';
import { NotFoundView } from './notfoundview';
import { fetchPickLists } from '../picklists';
import { queryFromTree } from '../queryfromtree';
import { router } from '../router';
import { getModel, getModelById, schema } from '../schema';
import { setCurrentComponent } from '../specifyapp';
import type { SpecifyModel } from '../specifymodel';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { useAsyncState } from './hooks';
import { QueryBuilder } from './querybuilder';
import { PermissionDenied } from './permissiondenied';
import {
  hasPermission,
  hasTablePermission,
  hasToolPermission,
  hasTreeAccess,
} from '../permissions';
import { f } from '../functools';
import { parseUrl } from '../querystring';

function useQueryRecordSet(): SpecifyResource<RecordSet> | undefined | false {
  const [recordSet] = useAsyncState<SpecifyResource<RecordSet> | false>(
    React.useCallback(() => {
      if (!hasToolPermission('recordSets', 'read')) return false;
      const recordSetId = f.parseInt(parseUrl().recordsetid ?? '');
      if (typeof recordSetId === 'undefined') return false;
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
  recordSet,
}: {
  query: SpecifyResource<SpQuery>;
  recordSet?: SpecifyResource<RecordSet> | false;
}): JSX.Element | null {
  const isLoaded = typeof useAsyncState(fetchPickLists, true)[0] === 'object';

  return isLoaded ? (
    <QueryBuilder
      query={query}
      isReadOnly={false}
      model={defined(getModel(query.get('contextName')))}
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

  return typeof query === 'undefined' ||
    typeof recordSet === 'undefined' ? null : hasTablePermission(
      getModelById(query.get('contextTableId')).name,
      'read'
    ) ? (
    <QueryBuilderWrapper query={query} recordSet={recordSet} />
  ) : (
    <PermissionDenied />
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
    if (typeof model === 'undefined') {
      setCurrentComponent(<PermissionDenied />);
      return undefined;
    }
    return createQuery(queryText('newQueryName'), model);
  }, [tableName]);
  const recordSet = useQueryRecordSet();

  return typeof query === 'undefined' ||
    typeof recordSet === 'undefined' ? null : hasTablePermission(
      getModelById(query.get('contextTableId')).name,
      'read'
    ) ? (
    <QueryBuilderWrapper query={query} recordSet={recordSet} />
  ) : (
    <PermissionDenied />
  );
}

function QueryBuilderFromTree({
  tableName,
  nodeId,
}: {
  readonly tableName: AnyTree['tableName'];
  readonly nodeId: number;
}): JSX.Element | null {
  const [query] = useAsyncState<SpecifyResource<SpQuery>>(
    React.useCallback(
      async () => queryFromTree(tableName, nodeId),
      [tableName, nodeId]
    ),
    true
  );

  return typeof query === 'undefined' ? null : hasTreeAccess(
      defined(getModel(tableName)).name as 'Geography',
      'read'
    ) ? (
    <QueryBuilderWrapper query={query} />
  ) : (
    <PermissionDenied />
  );
}

export function task(): void {
  router.route('query/:id/', 'storedQuery', (id) =>
    setCurrentComponent(
      hasPermission('/querybuilder/query', 'execute') &&
        hasToolPermission('queryBuilder', 'read') ? (
        <QueryBuilderById queryId={Number.parseInt(id)} />
      ) : (
        <PermissionDenied />
      )
    )
  );
  router.route('query/new/:table/', 'ephemeralQuery', (tableName) =>
    setCurrentComponent(
      hasPermission('/querybuilder/query', 'execute') &&
        hasToolPermission('queryBuilder', 'create') ? (
        <NewQuery tableName={tableName} />
      ) : (
        <PermissionDenied />
      )
    )
  );
  router.route(
    'query/fromtree/:table/:id/',
    'queryFromTree',
    (tableName, nodeId) =>
      setCurrentComponent(
        hasPermission('/querybuilder/query', 'execute') &&
          hasToolPermission('queryBuilder', 'read') ? (
          <QueryBuilderFromTree
            tableName={tableName as AnyTree['tableName']}
            nodeId={Number.parseInt(nodeId)}
          />
        ) : (
          <PermissionDenied />
        )
      )
  );
}
