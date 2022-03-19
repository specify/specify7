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
import { getModel, schema } from '../schema';
import { setCurrentView } from '../specifyapp';
import type { SpecifyModel } from '../specifymodel';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { useAsyncState } from './hooks';
import { LoadingScreen } from './modaldialog';
import { QueryBuilder } from './querybuilder';
import createBackboneView from './reactbackboneextend';

function useQueryRecordSet(): SpecifyResource<RecordSet> | undefined | false {
  const [recordSet] = useAsyncState<SpecifyResource<RecordSet> | false>(
    React.useCallback(() => {
      const recordSetId = querystring.parse().recordsetid;
      if (typeof recordSetId === 'undefined') return false;
      const recordSet = new schema.models.RecordSet.Resource({
        id: Number.parseInt(recordSetId),
      });
      return recordSet.fetchPromise();
    }, [])
  );

  return recordSet;
}

function QueryBuilderWrapper({
  query,
  recordSet,
}: {
  query: SpecifyResource<SpQuery>;
  recordSet?: SpecifyResource<RecordSet> | false;
}) {
  const [pickListsLoading = true] = useAsyncState(async () =>
    fetchPickLists().then(() => false)
  );

  return pickListsLoading ? (
    <LoadingScreen />
  ) : (
    <QueryBuilder
      query={query}
      readOnly={userInformation.isReadOnly}
      model={defined(getModel(query.get('contextName')))}
      recordSet={typeof recordSet === 'object' ? recordSet : undefined}
    />
  );
}

function QueryBuilderById({
  queryId,
}: {
  readonly queryId: number;
}): JSX.Element {
  const [query] = useAsyncState<SpecifyResource<SpQuery>>(
    React.useCallback(async () => {
      const query = new schema.models.SpQuery.Resource({ id: queryId });
      return query.fetchPromise().catch((error) => {
        if (error.status === Http.NOT_FOUND) setCurrentView(new NotFoundView());
        else throw error;
        return undefined;
      });
    }, [queryId])
  );
  const recordSet = useQueryRecordSet();

  return typeof query === 'undefined' || typeof recordSet === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <QueryBuilderWrapper query={query} recordSet={recordSet} />
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
  const [query] = useAsyncState<SpecifyResource<SpQuery>>(
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
  ) : (
    <QueryBuilderWrapper query={query} recordSet={recordSet} />
  );
}

const NewQueryView = createBackboneView(NewQuery);

function QueryBuilderFromTree({
  tableName,
  nodeId,
}: {
  readonly tableName: AnyTree['tableName'];
  readonly nodeId: number;
}): JSX.Element {
  const [query] = useAsyncState<SpecifyResource<SpQuery>>(
    React.useCallback(
      async () => queryFromTree(tableName, nodeId),
      [tableName, nodeId]
    )
  );

  return typeof query === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <QueryBuilderWrapper query={query} />
  );
}

const QueryFromTree = createBackboneView(QueryBuilderFromTree);

export default function Routes(): void {
  router.route('query/:id/', 'storedQuery', (id) =>
    setCurrentView(new QueryById({ queryId: Number.parseInt(id) }))
  );
  router.route('query/new/:table/', 'ephemeralQuery', (tableName) =>
    setCurrentView(new NewQueryView({ tableName }))
  );
  // TODO: test this:
  router.route(
    'query/fromtree/:table/:id/',
    'queryFromTree',
    (tableName, nodeId) =>
      setCurrentView(
        new QueryFromTree({
          tableName: tableName as AnyTree['tableName'],
          nodeId: Number.parseInt(nodeId),
        })
      )
  );
}
