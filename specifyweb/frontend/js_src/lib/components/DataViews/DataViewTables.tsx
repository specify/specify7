import React from 'react';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { dataViewsText } from '../../localization/dataViews';
import { Http } from '../../utils/ajax/definitions';
import { throttledPromise } from '../../utils/ajax/throttledPromise';
import type { GetSet, IR, RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import { serializeResource } from '../DataModel/serializers';
import { SpecifyTable } from '../DataModel/specifyTable';
import type { Tables } from '../DataModel/types';
import { getTableById, strictGetTable } from '../DataModel/tables';
import { raise } from '../Errors/Crash';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { userPreferences } from '../Preferences/userPreferences';
import { OverlayContext } from '../Router/Router';
import { tablesFilter } from '../SchemaConfig/Tables';
import {
  queryCountPromiseGenerator,
  querySpecToResource,
} from '../Statistics/hooks';
import { TablesListEdit } from '../Toolbar/QueryTablesEdit';
import { QueryTables } from '../Toolbar/QueryTablesWrapper';
import { defaultDataViewTablesConfig } from './config';
import { DataViewQueryEditorContent } from './QueryEditor';
import {
  saveUserDataViewQueries,
  serializeDataViewQueries,
  useDataViewQueries,
} from './queries';

export function DataViewTables(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  const [tables, setTables] = useDataViewTables();
  const [isEditing, handleEditing] = useBooleanState();
  const [queries, reloadQueries] = useDataViewQueries();
  const [queryData, setQueryData] = React.useState<string | undefined>();
  const [queryTable, setQueryTable] = React.useState<keyof Tables | undefined>();
  const counts = useTableRecordCounts(tables);
  const handleOpenQueryEditor = (tableName: keyof Tables): void => {
    if (queries === undefined) return;
    setQueryData(serializeDataViewQueries(queries));
    setQueryTable(tableName);
  };
  const handleCloseQueryEditor = (): void => {
    setQueryTable(undefined);
    setQueryData(undefined);
  };
  if (queryTable !== undefined && queryData !== undefined)
    return (
      <Dialog
        buttons={
          <>
            <Button.Secondary onClick={handleCloseQueryEditor}>
              {commonText.cancel()}
            </Button.Secondary>
            <Button.Success
              onClick={(): void => {
                saveUserDataViewQueries(queryData)
                  .then(reloadQueries)
                  .then(handleCloseQueryEditor)
                  .catch(raise);
              }}
            >
              {commonText.save()}
            </Button.Success>
          </>
        }
        header={dataViewsText.configureQuery()}
        onClose={handleCloseQueryEditor}
      >
        <DataViewQueryEditorContent
          data={queryData}
          key={queryTable}
          tableName={queryTable}
          onChange={setQueryData}
        />
      </Dialog>
    );
  return isEditing ? (
    <TablesListEdit
      defaultTables={defaultDataViewTablesConfig}
      header={dataViewsText.configureDataViews()}
      tables={tables}
      onChange={setTables}
      onClose={handleClose}
    />
  ) : (
    <Dialog
      header={dataViewsText.dataViewsTitle()}
      buttons={
        <>
          <span className="-ml-2 flex-1" />
          <Button.Secondary onClick={handleClose}>
            {commonText.close()}
          </Button.Secondary>
        </>
      }
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      headerButtons={
        <div className="flex gap-2">
          <DataEntry.Edit onClick={handleEditing} />
        </div>
      }
      icon={icons.eye}
      onClose={handleClose}
    >
      <QueryTables
        counts={counts}
        getHref={(name) => `/specify/dataviews/${name.toLowerCase()}`}
        tables={tables}
        onClick={undefined}
        onEdit={handleOpenQueryEditor}
      />
    </Dialog>
  );
}

/**
 * Fetches the number of records in each table in the background, using the
 * same count-only query builder logic that is used in the Statistics page.
 */
function useTableRecordCounts(
  tables: RA<SpecifyTable>
): IR<number | undefined> {
  const [counts, setCounts] = React.useState<IR<number | undefined>>({});

  React.useEffect(() => {
    let destructorCalled = false;
    tables.forEach((table) => {
      const query = serializeResource(
        querySpecToResource(table.name, {
          tableName: table.name,
          fields: [],
        })
      );
      throttledPromise<number | undefined>(
        'queryStats',
        async () =>
          queryCountPromiseGenerator(query)().then((response) =>
            response.status === Http.OK ? response.data.count : undefined
          ),
        JSON.stringify(query)
      )
        .then((count) => {
          if (destructorCalled) return;
          setCounts((previousCounts) => ({
            ...previousCounts,
            [table.name]: count,
          }));
        })
        .catch(raise);
    });
    return (): void => {
      destructorCalled = true;
    };
  }, [tables]);

  return counts;
}

function useDataViewTables(): GetSet<RA<SpecifyTable>> {
  const [tables, setTables] = userPreferences.use(
    'dataViews',
    'general',
    'shownTables'
  );
  const allowedTables = React.useMemo(() => {
    const visibleTables =
      tables.length === 0
        ? defaultDataViewTablesConfig.map(strictGetTable)
        : tables.map(getTableById);

    return visibleTables.filter((table) =>
      tablesFilter(true, false, true, table)
    );
  }, [tables]);

  const handleChange = React.useCallback(
    (models: RA<SpecifyTable>) =>
      setTables(models.map((model) => model.tableId)),
    [setTables]
  );

  return [allowedTables, handleChange];
}
