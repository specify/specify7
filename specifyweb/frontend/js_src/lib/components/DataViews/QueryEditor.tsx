import React from 'react';

import { dataViewsText } from '../../localization/dataViews';
import type { RA } from '../../utils/types';
import { Label, Select } from '../Atoms/Form';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQueryField, Tables } from '../DataModel/types';
import { QueryBuilder } from '../QueryBuilder/Wrapped';
import { defaultDataViewTablesConfig, useDataViewTables } from './config';
import {
  getDataViewQueryDefinition,
  makeDataViewQuery,
  parseDataViewQueries,
  serializeDataViewQueries,
  serializeStableDataViewQueries,
  type DataViewQueriesFile,
} from './queries';
import { schemaText } from '../../localization/schema';

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
  const [tables] = useDataViewTables();
  const tableNames = React.useMemo<RA<keyof Tables>>(
    () => tables.map(({ name }) => name),
    [tables]
  );
  const [tableName, setTableName] = React.useState<keyof Tables>(
    lockedTableName ?? tableNames[0] ?? defaultDataViewTablesConfig[0]
  );

  React.useEffect(() => {
    if (lockedTableName !== undefined) setTableName(lockedTableName);
  }, [lockedTableName]);

  React.useEffect(() => {
    if (lockedTableName === undefined && !tableNames.includes(tableName))
      setTableName(tableNames[0] ?? defaultDataViewTablesConfig[0]);
  }, [lockedTableName, tableName, tableNames]);

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
      makeDataViewQuery(tableName, getDataViewQueryDefinition(file, tableName)),
    [file, tableName]
  );

  const handleQueryChange = React.useCallback(
    (changes: {
      readonly fields: RA<SerializedResource<SpQueryField>>;
      readonly isDistinct: boolean | null;
      readonly searchSynonymy: boolean | null;
      readonly isSeries: boolean | null;
    }): void => {
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
    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
      {lockedTableName === undefined ? (
        <Label.Inline>
          {schemaText.table()}
          <Select
            value={tableName}
            onValueChange={(value): void => setTableName(value as keyof Tables)}
          >
            {tableNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Label.Inline>
      ) : undefined}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        <QueryBuilder
          autoRun={false}
          forceCollection={undefined}
          isEmbedded
          query={query}
          onChange={handleQueryChange}
        />
      </div>
      <p className="sr-only">{dataViewsText.configureQuery()}</p>
    </div>
  );
}
