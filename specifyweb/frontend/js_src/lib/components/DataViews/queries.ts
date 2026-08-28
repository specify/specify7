import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { addMissingFields } from '../DataModel/addMissingFields';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { serializeResource } from '../DataModel/serializers';
import { strictGetTable } from '../DataModel/tables';
import type { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { createQuery } from '../QueryBuilder';
import { getAppResourceUrl } from '../../utils/ajax/helpers';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { clearUrlCache } from '../RouterCommands/CacheBuster';
import { keysToLowerCase } from '../../utils/utils';
import type { RA, RR } from '../../utils/types';

export const dataViewQueriesResourceName = 'DataViewQueries';

export type DataViewQueryDefinition = {
  readonly fields: RA<SerializedResource<SpQueryField>>;
  readonly selectDistinct?: boolean;
  readonly searchSynonymy?: boolean;
  readonly smushed?: boolean;
};

export type DataViewQueriesFile = {
  readonly version: 1;
  readonly queries: Partial<RR<keyof Tables, DataViewQueryDefinition>>;
};

const emptyDataViewQueries: DataViewQueriesFile = { version: 1, queries: {} };

export function parseDataViewQueries(
  data: unknown
): DataViewQueriesFile {
  if (data === null || data === undefined) return emptyDataViewQueries;
  try {
    const parsed: unknown =
      typeof data === 'string'
        ? data.trim() === ''
          ? undefined
          : JSON.parse(data)
        : data;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as { version?: unknown }).version !== 1 ||
      typeof (parsed as { queries?: unknown }).queries !== 'object'
    )
      return emptyDataViewQueries;
    return parsed as DataViewQueriesFile;
  } catch {
    return emptyDataViewQueries;
  }
}

export function serializeDataViewQueries(data: DataViewQueriesFile): string {
  return JSON.stringify(data, undefined, 2);
}

/** Ignore transient Backbone resource metadata when comparing editor state. */
export function serializeStableDataViewQueries(
  data: DataViewQueriesFile
): string {
  return JSON.stringify(data, (key, value: unknown) =>
    new Set([
      'id',
      'resource_uri',
      'timestampCreated',
      'timestampModified',
      'version',
    ]).has(key)
      ? undefined
      : value
  );
}

export function defaultDataViewQuery(
  tableName: keyof Tables
): DataViewQueryDefinition {
  const table = strictGetTable(tableName);
  const fields = table.literalFields
    .filter(
      ({ isHidden, isVirtual, name, isRelationship }) =>
        !isHidden &&
        !isVirtual &&
        !isRelationship &&
        !dataViewDefaultFieldBlacklist.has(name.toLowerCase()) &&
        name !== table.idField.name
    )
    .map(({ name }) =>
      serializeResource(
        QueryFieldSpec.fromPath(table.name, [name]).toSpQueryField()
      )
    );
  return {
    fields,
    selectDistinct: false,
    searchSynonymy: false,
    smushed: false,
  };
}

export const dataViewDefaultFieldBlacklist = new Set([
  'id',
  'timestampcreated',
  'timestampmodified',
  'version',
]);

export function getDataViewQueryDefinition(
  file: DataViewQueriesFile,
  tableName: keyof Tables
): DataViewQueryDefinition {
  return file.queries[tableName] ?? defaultDataViewQuery(tableName);
}

export function makeDataViewQuery(
  tableName: keyof Tables,
  definition: DataViewQueryDefinition
): SpecifyResource<SpQuery> {
  const table = strictGetTable(tableName);
  const query = createQuery(`Data View: ${table.label}`, table);
  query.set(
    'fields',
    definition.fields.map((field) => addMissingFields('SpQueryField', field))
  );
  query.set('selectDistinct', definition.selectDistinct ?? false);
  query.set('searchSynonymy', definition.searchSynonymy ?? false);
  query.set('smushed', definition.smushed ?? false);
  query.set('countOnly', false);
  return query;
}

/** Fetches the context-resolved resource, including discipline and defaults. */
export function useDataViewQueries(): [
  DataViewQueriesFile | undefined,
  () => void,
] {
  const [reload, setReload] = React.useState(0);
  const [data] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<unknown>(
          `${getAppResourceUrl(dataViewQueriesResourceName, 'quiet')}&dataViewReload=${reload}`,
          {
            cache: 'no-store',
            headers: { Accept: 'application/json' },
            errorMode: 'silent',
            expectedErrors: [Http.NO_CONTENT, Http.NOT_FOUND],
          }
        ).then(({ data }) => parseDataViewQueries(data)),
      [reload]
    ),
    true
  );
  return [data, (): void => setReload((value) => value + 1)];
}

export async function saveUserDataViewQueries(data: string): Promise<void> {
  const resources = await ajax<
    RA<{
      readonly id: number;
      readonly name: string;
      readonly mimetype: string;
    }>
  >('/context/user_resource/', { headers: { Accept: 'application/json' } });
  const resource = resources.data.find(
    ({ name, mimetype }) =>
      name === dataViewQueriesResourceName && mimetype === 'application/json'
  );
  const payload = keysToLowerCase({
    name: dataViewQueriesResourceName,
    mimetype: 'application/json',
    metadata: '',
    data,
  });
  await ping(
    resource === undefined
      ? '/context/user_resource/'
      : `/context/user_resource/${resource.id}/`,
    {
      method: resource === undefined ? 'POST' : 'PUT',
      body: payload,
    }
  );
  // The context-resolved app.resource endpoint is cacheable. Invalidate it
  // after changing the user override so the next Data View load does not
  // receive the previous default definition.
  await clearUrlCache(getAppResourceUrl(dataViewQueriesResourceName));
}
