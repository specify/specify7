import React from 'react';

import { Http } from '../ajax';
import type { RecordSet, SpQuery } from '../datamodel';
import type { AnyTree } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import queryText from '../localization/query';
import { NotFoundView } from '../notfoundview';
import { fetchPickLists } from '../picklists';
import { queryFromTree } from '../queryfromtree';
import * as querystring from '../querystring';
import { router } from '../router';
import { getModel, getModelById, schema } from '../schema';
import { setCurrentView } from '../specifyapp';
import type { SpecifyModel } from '../specifymodel';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { useAsyncState, useLiveState } from './hooks';
import { LoadingScreen } from './modaldialog';
import { QueryBuilder } from './querybuilder';
import createBackboneView from './reactbackboneextend';
import { PermissionDenied } from './permissiondenied';
import {
  hasPermission,
  hasTablePermission,
  hasToolPermission,
} from '../permissions';

function useQueryRecordSet(): SpecifyResource<RecordSet> | undefined | false {
  const [recordSet] = useAsyncState<SpecifyResource<RecordSet> | false>(
    React.useCallback(() => {
      if (!hasToolPermission('recordSets', 'read')) return false;
      const recordSetId = querystring.parse().recordsetid;
      if (typeof recordSetId === 'undefined') return false;
      const recordSet = new schema.models.RecordSet.Resource({
        id: Number.parseInt(recordSetId),
      });
      return recordSet.fetchPromise();
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
  const [isLoaded = false] = useAsyncState(
    async () => fetchPickLists().then(() => true),
    true
  );

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
      return query.fetchPromise().catch((error) => {
        if (error.status === Http.NOT_FOUND) setCurrentView(new NotFoundView());
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

const QueryById = createBackboneView(QueryBuilderById);

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

function NewQuery({ tableName }: { readonly tableName: string }): JSX.Element {
  const [query] = useLiveState<SpecifyResource<SpQuery> | undefined>(
    React.useCallback(() => {
      const model = getModel(tableName);
      if (typeof model === 'undefined') {
        setCurrentView(new NotFoundView());
        return undefined;
      }
      return createQuery(queryText('newQueryName'), model);
    }, [tableName])
  );
  const recordSet = useQueryRecordSet();

  return typeof query === 'undefined' || typeof recordSet === 'undefined' ? (
    <LoadingScreen />
  ) : hasTablePermission(
      getModelById(query.get('contextTableId')).name,
      'read'
    ) ? (
    <QueryBuilderWrapper query={query} recordSet={recordSet} />
  ) : (
    <PermissionDenied />
  );
}

const NewQueryView = createBackboneView(NewQuery);

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

  return typeof query === 'undefined' ? null : hasToolPermission(
      getModelById(query.get('contextTableId')).name as 'Geography',
      'read'
    ) ? (
    <QueryBuilderWrapper query={query} />
  ) : (
    <PermissionDenied />
  );
}

const QueryFromTree = createBackboneView(QueryBuilderFromTree);
const PermissionDeniedView = createBackboneView(PermissionDenied);

export default function Routes(): void {
  router.route('query/:id/', 'storedQuery', (id) =>
    setCurrentView(
      hasPermission('/querybuilder/query', 'execute') &&
        hasToolPermission('queryBuilder', 'read')
        ? new QueryById({ queryId: Number.parseInt(id) })
        : new PermissionDeniedView()
    )
  );
  router.route('query/new/:table/', 'ephemeralQuery', (tableName) =>
    setCurrentView(
      hasPermission('/querybuilder/query', 'execute') &&
        hasToolPermission('queryBuilder', 'create')
        ? new NewQueryView({ tableName })
        : new PermissionDeniedView()
    )
  );
  // TODO: test this:
  router.route(
    'query/fromtree/:table/:id/',
    'queryFromTree',
    (tableName, nodeId) =>
      setCurrentView(
        hasPermission('/querybuilder/query', 'execute') &&
          hasToolPermission('queryBuilder', 'read')
          ? new QueryFromTree({
              tableName: tableName as AnyTree['tableName'],
              nodeId: Number.parseInt(nodeId),
            })
          : new PermissionDeniedView()
      )
  );
}
