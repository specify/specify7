import React from 'react';

import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import queryText from '../localization/query';
import * as navigation from '../navigation';
import NotFoundView from '../notfoundview';
import queryFromTree from '../queryfromtree';
import * as querystring from '../querystring';
import router from '../router';
import { getModel } from '../schema';
import schema from '../schemabase';
import * as app from '../specifyapp';
import { setCurrentView } from '../specifyapp';
import type { default as SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { defined } from '../types';
import userInfo from '../userinfo';
import {
  Button,
  Checkbox,
  ContainerFull,
  H2,
  LabelForCheckbox,
  Submit,
} from './basic';
import { TableIcon } from './common';
import { useId, useResource } from './hooks';
import icons from './icons';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { RecordSet, SpQuery, SpQueryField } from '../datamodel';

type QueryField = {
  id: number;
};

function QueryLine({
  field,
  onChange: handleChange,
  onRemove: handleRemove,
}: {
  readonly field: QueryField;
  readonly onChange: (newField: QueryField) => void;
  readonly onRemove: () => void;
}): JSX.Element {}

function QueryFields({
  fields,
  onChangeField: handleChangeField,
  onRemoveField: handleRemoveField,
}: {
  readonly fields: RA<QueryField>;
  readonly onChangeField: (index: number, field: QueryField) => void;
  readonly onRemoveField: (index: number) => void;
}): JSX.Element {
  return (
    <ul role="list" className="spqueryfields">
      {fields.map((field, index) => (
        <QueryLine
          key={field.id}
          field={field}
          onChange={(newField): void => handleChangeField(index, newField)}
          onRemove={(): void => handleRemoveField(index)}
        />
      ))}
    </ul>
  );
}

type Query = {
  readonly name: string;
  readonly specifyuser: string;
  readonly selectdistinct: boolean;
  readonly countonly: boolean;
  readonly formatauditrecids: boolean;
  readonly contexttableid: number;
};

function QueryBuilder({
  query: queryResource,
  readOnly,
  recordSet,
  model,
  fields: initialFields,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly readOnly: boolean;
  readonly model: SpecifyModel;
  readonly recordSet?: SpecifyResource<RecordSet>;
  readonly fields: RA<SpecifyResource<SpQueryField>>;
}): JSX.Element {
  const [saveRequired, setSaveRequired] = React.useState(queryResource.isNew());
  React.useEffect(() => {
    queryResource.on('saverequired', () => {
      setSaveRequired(true);
    });
  }, [queryResource]);

  const id = useId('query-builder');
  React.useEffect(() => {
    navigation.addUnloadProtect(
      id('unload-protect'),
      queryText('queryUnloadProtectDialogMessage')
    );
    return (): void => navigation.removeUnloadProtect(id('unload-protect'));
  }, [id, saveRequired]);

  const [query, setQuery] = useResource<Query>(queryResource);
  const [fields, setFields] =
    React.useState<RA<SpecifyResource<SpQueryField>>>(initialFields);

  return (
    <ContainerFull>
      <form>
        <header className="gap-x-2 flex items-center">
          <TableIcon tableName={model.name} />
          <H2>
            {typeof recordSet === 'object'
              ? queryText('queryRecordSetTitle')(
                  query.name,
                  recordSet.get('name')
                )
              : queryText('queryTaskTitle')(query.name)}
          </H2>
          <span className="flex-1 ml-2" />
          <Button.Simple>{queryText('createCsv')}</Button.Simple>
          <Button.Simple>{queryText('createKml')}</Button.Simple>
          {readOnly ? undefined : (
            <Button.Simple>{queryText('makeRecordSet')}</Button.Simple>
          )}
          {queryResource.isNew() ? undefined : (
            <Button.Simple disabled={!saveRequired}>
              {queryText('abandonChanges')}
            </Button.Simple>
          )}
          {readOnly ||
          query.specifyuser !== userInfo.resource_uri ? undefined : (
            <Button.Simple disabled={!saveRequired}>
              {commonText('save')}
            </Button.Simple>
          )}
          {readOnly || queryResource.isNew() ? undefined : (
            <Button.Simple>{queryText('saveAs')}</Button.Simple>
          )}
        </header>
        <QueryFields
          fields={fields}
          onRemoveField={(targetIndex: number): void =>
            setFields(fields.filter((_, index) => index !== targetIndex))
          }
        />
        <div role="toolbar" className="flex flex-wrap gap-2">
          <Button.Simple
            title={queryText('newButtonDescription')}
            aria-label={commonText('new')}
            onClick={(): void => {
              const newField = new schema.models.SpQueryField.Resource();
              newField.set('sorttype', 0);
              newField.set('isdisplay', true);
              newField.set('isnot', false);
              newField.set('startvalue', '');
              newField.set('query', queryResource.url());
              newField.set(
                'position',
                fields.slice(-1)[0]?.get('position') ?? 0
              );
              setFields([...fields, newField]);
            }}
          >
            {icons.plus}
          </Button.Simple>
          <LabelForCheckbox>
            <Checkbox
              checked={query.countonly}
              onChange={({ target }): void =>
                setQuery({
                  ...query,
                  countonly: target.checked,
                })
              }
            />
            {queryText('countOnly')}
          </LabelForCheckbox>
          <LabelForCheckbox>
            <Checkbox
              checked={query.selectdistinct}
              onChange={({ target }): void =>
                setQuery({
                  ...query,
                  selectdistinct: target.checked,
                })
              }
            />
            {queryText('distinct')}
          </LabelForCheckbox>
          {query.contexttableid === schema.models.SpAuditLog.tableId ? (
            <LabelForCheckbox>
              <Checkbox
                checked={query.formatauditrecids}
                onChange={({ target }): void =>
                  setQuery({
                    ...query,
                    formatauditrecids: target.checked,
                  })
                }
              />
              {queryText('format')}
            </LabelForCheckbox>
          ) : undefined}
          <Submit.Simple value={commonText('query')} />
        </div>
      </form>
    </ContainerFull>
  );
}

function QueryBuilderWrapper({
  query,
  recordSet,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly recordSet?: SpecifyResource<RecordSet> | false;
}): JSX.Element {
  const [queryFields, setQueryFields] = React.useState<
    RA<SpecifyResource<SpQueryField>> | undefined
  >(undefined);

  React.useEffect(
    () =>
      void query.rget('fields').then(({ models }) => {
        setQueryFields(
          Array.from(models).sort((left, right) =>
            left.get('position') > right.get('position')
              ? -1
              : left.get('position') == right.get('position')
              ? 0
              : 1
          )
        );
      }),
    [query]
  );

  return typeof queryFields === 'object' ? (
    <QueryBuilder
      query={query}
      readOnly={userInfo.isReadOnly}
      model={defined(getModel(query.get('contextname')))}
      recordSet={typeof recordSet === 'object' ? recordSet : undefined}
      fields={queryFields}
    />
  ) : (
    <LoadingScreen />
  );
}

function useQueryRecordSet(): SpecifyResource<RecordSet> | undefined | false {
  const [recordSet, setRecordSet] = React.useState<
    SpecifyResource<RecordSet> | undefined | false
  >(undefined);
  React.useEffect(() => {
    const recordSetId = querystring.parse().recordsetid;
    if (typeof recordSetId === 'undefined') {
      setRecordSet(false);
      return;
    }
    const recordSet = new schema.models.RecordSet.LazyCollection({
      filters: { id: Number.parseInt(recordSetId) },
    });
    recordSet.fetch().then(({ models }) => setRecordSet(models[0]));
  }, []);

  return recordSet;
}

function QueryBuilderById({
  queryId,
}: {
  readonly queryId: number;
}): JSX.Element {
  const [query, setQuery] = React.useState<SpecifyResource<SpQuery>>();
  const recordSet = useQueryRecordSet();
  React.useEffect(() => {
    const query = new schema.models.SpQuery.Resource({ id: queryId });
    query.fetch().then(setQuery, app.handleError);
  }, [queryId]);

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
    query.set('contextname', model.name);
    query.set('contexttableid', model.tableId);
    query.set('selectdistinct', false);
    query.set('countonly', false);
    query.set('formatauditrecids', false);
    query.set('specifyuser', userInfo.resource_uri);
    query.set('isfavorite', true);
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
  const [query, setQuery] = React.useState<
    SpecifyResource<SpQuery> | undefined
  >(undefined);

  React.useEffect(
    () => queryFromTree(userInfo, tableName, nodeId).then(setQuery),
    [tableName, nodeId]
  );

  return typeof query === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <QueryBuilderWrapper query={query} />
  );
}

const QueryFromTree = createBackboneView(QueryBuilderFromTree);

export default function Routes(): void {
  router.route('newQuery/:id/', 'storedQuery', (id) =>
    app.setCurrentView(new QueryById({ queryId: Number.parseInt(id) }))
  );
  router.route('newQuery/new/:table/', 'ephemeralQuery', (tableName) =>
    app.setCurrentView(new NewQueryView({ tableName }))
  );
  router.route(
    'newQuery/fromtree/:table/:id/',
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
