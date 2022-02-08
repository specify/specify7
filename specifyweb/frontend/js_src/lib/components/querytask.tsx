import React from 'react';

import type { RecordSet, SpQuery } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import queryText from '../localization/query';
import { NotFoundView } from '../notfoundview';
import queryFromTree from '../queryfromtree';
import * as querystring from '../querystring';
import { router } from '../router';
import { getModel } from '../schema';
import { schema } from '../schema';
import * as app from '../specifyapp';
import { setCurrentView } from '../specifyapp';
import { defined } from '../types';
import dataModelStorage from '../wbplanviewmodel';
import { dataModelPromise } from '../wbplanviewmodelfetcher';
import { crash } from './errorboundary';
import { LoadingScreen } from './modaldialog';
import { QueryBuilder } from './querybuilder';
import createBackboneView from './reactbackboneextend';
import { userInformation } from '../userinfo';
import { useAsyncState } from './hooks';

function useQueryRecordSet(): SpecifyResource<RecordSet> | undefined | false {
  const [recordSet] = useAsyncState<SpecifyResource<RecordSet> | false>(
    React.useCallback(() => {
      const recordSetId = querystring.parse().recordsetid;
      if (typeof recordSetId === 'undefined') return false;
      const recordSet = new schema.models.RecordSet.LazyCollection({
        filters: { id: Number.parseInt(recordSetId) },
      });
      return recordSet.fetchPromise().then(({ models }) => models[0]);
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
  const [isLoading, setIsLoading] = React.useState(
    typeof dataModelStorage.tables === 'undefined'
  );
  React.useEffect(() => {
    dataModelPromise.then(() => setIsLoading(false)).catch(crash);
  }, []);

  return isLoading ? (
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
      return Promise.resolve(query.fetch());
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

function NewQuery({ tableName }: { readonly tableName: string }): JSX.Element {
  const [query, setQuery] = React.useState<
    SpecifyResource<SpQuery> | undefined
  >(undefined);
  const recordSet = useQueryRecordSet();

  React.useEffect(() => {
    const query = new schema.models.SpQuery.Resource();
    const model = getModel(tableName);
    if (typeof model === 'undefined') {
      setCurrentView(new NotFoundView());
      return;
    }

    query.set('name', queryText('newQueryName'));
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
    setQuery(query);
  }, [tableName]);

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
  readonly tableName: string;
  readonly nodeId: number;
}): JSX.Element {
  const [query] = useAsyncState<SpecifyResource<SpQuery>>(
    React.useCallback(
      // TODO: convert to react
      () => queryFromTree(userInformation, tableName, nodeId),
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
    app.setCurrentView(new QueryById({ queryId: Number.parseInt(id) }))
  );
  router.route('query/new/:table/', 'ephemeralQuery', (tableName) =>
    app.setCurrentView(new NewQueryView({ tableName }))
  );
  router.route(
    'query/fromtree/:table/:id/',
    'queryFromTree',
    (tableName, nodeId) =>
      app.setCurrentView(
        new QueryFromTree({
          tableName,
          nodeId: Number.parseInt(nodeId),
        })
      )
  );
}
