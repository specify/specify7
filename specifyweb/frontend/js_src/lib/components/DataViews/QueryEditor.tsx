import React from 'react';

import { dataViewsText } from '../../localization/dataViews';
import type { RA } from '../../utils/types';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQueryField, Tables } from '../DataModel/types';
import { QueryBuilder } from '../QueryBuilder/Wrapped';
import { defaultDataViewTablesConfig } from './config';
import {
  getStoredDataViewQueryDefinition,
  makeDataViewQuery,
  parseDataViewQueries,
  serializeDataViewQueries,
  serializeStableDataViewQueries,
  type DataViewQueriesFile,
} from './queries';
import { schemaText } from '../../localization/schema';
import { TableList } from '../SchemaConfig/Tables';

export function DataViewQueryEditor({
  data,
  onChange: handleChange,
}: AppResourceTabProps): JSX.Element {
  return (
    <DataViewQueryEditorContent
      data={data}
      onChange={(nextData): void => handleChange(nextData)}
    />
  );
}

export function DataViewQueryEditorContent({
  data,
  onChange: handleChange,
  tableName: lockedTableName,
}: {
  readonly data: string | null | undefined;
  readonly onChange: (data: string) => void;
  readonly tableName?: keyof Tables;
}): JSX.Element {
  const initialFile = React.useMemo(() => parseDataViewQueries(data), [data]);
  const [file, setFile] = React.useState<DataViewQueriesFile>(initialFile);
  const fileRef = React.useRef(file);
  const [tableName, setTableName] = React.useState<keyof Tables>(
    lockedTableName ?? defaultDataViewTablesConfig[0]
  );

  React.useEffect(() => {
    if (lockedTableName !== undefined) setTableName(lockedTableName);
  }, [lockedTableName]);

  React.useEffect(() => {
    if (
      serializeStableDataViewQueries(fileRef.current) ===
      serializeStableDataViewQueries(initialFile)
    )
      return;
    fileRef.current = initialFile;
    setFile(initialFile);
  }, [initialFile]);

  const query = React.useMemo(
    () =>
      makeDataViewQuery(
        tableName,
        getStoredDataViewQueryDefinition(fileRef.current, tableName) ?? {
          fields: [],
        }
      ),
    [tableName]
  );

  const handleQueryChange = React.useCallback(
    (changes: {
      readonly fields: RA<SerializedResource<SpQueryField>>;
      readonly isDistinct: boolean | null;
      readonly searchSynonymy: boolean | null;
      readonly isSeries: boolean | null;
    }): void => {
      if (
        changes.fields.length === 0 &&
        getStoredDataViewQueryDefinition(fileRef.current, tableName) ===
          undefined
      )
        return;
      const nextFile: DataViewQueriesFile = {
        ...file,
        queries: {
          ...file.queries,
          [tableName]: {
            fields: changes.fields,
            selectDistinct: changes.isDistinct ?? false,
            searchSynonymy: changes.searchSynonymy ?? false,
            smushed: changes.isSeries ?? false,
          },
        },
      };
      if (
        serializeStableDataViewQueries(nextFile) ===
        serializeStableDataViewQueries(fileRef.current)
      )
        return;
      fileRef.current = nextFile;
      setFile(nextFile);
      handleChange(serializeDataViewQueries(nextFile));
    },
    [file, handleChange, tableName]
  );

  return (
    <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
      {lockedTableName === undefined ? (
        <div className="flex w-64 min-w-0 flex-col overflow-hidden">
          <p className="font-bold">{schemaText.tables()}</p>
          <TableList
            cacheKey="appResources"
            currentTableName={tableName}
            getAction={(table): (() => void) =>
              (): void =>
                setTableName(table.name)
              }
          />
        </div>
      ) : undefined}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
        <QueryBuilder
          autoRun={false}
          forceCollection={undefined}
          isEmbedded
          key={tableName}
          query={query}
          onChange={handleQueryChange}
        />
      </div>
      <p className="sr-only">{dataViewsText.configureQuery()}</p>
    </div>
  );
}
