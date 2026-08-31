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
import { fetchCollection } from '../DataModel/collection';
import { serializeResource } from '../DataModel/serializers';
import { SpecifyTable } from '../DataModel/specifyTable';
import { getTableById, strictGetTable } from '../DataModel/tables';
import { Tables } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { hasToolPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { OverlayContext } from '../Router/Router';
import { tablesFilter } from '../SchemaConfig/Tables';
import {
  queryCountPromiseGenerator,
  querySpecToResource,
} from '../Statistics/hooks';
import { TablesListEdit } from '../Toolbar/QueryTablesEdit';
import { QueryTables } from '../Toolbar/QueryTablesWrapper';
import { createDefaultDataViewQuery } from './defaultQueries';
import { DataViewQueryEditor } from './QueryEditor';

const defaultDataViewTablesConfig: RA<keyof Tables> = [
  'Accession',
  'Agent',
  'CollectionObject',
  'CollectingEvent',
  'Gift',
  'Loan',
  'Locality',
];

export function DataViewTables(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  const [tables, setTables] = useDataViewTables();
  const [isEditing, handleEditing] = useBooleanState();
  const counts = useTableRecordCounts(tables);
  const [queryIds, refreshQueryId] = useDataViewQueryIds(tables);
  const [editingQueryTable, setEditingQueryTable] = React.useState<
    SpecifyTable | undefined
  >(undefined);
  return isEditing ? (
    <TablesListEdit
      defaultTables={defaultDataViewTablesConfig}
      header={dataViewsText.configureDataViews()}
      tables={tables}
      onChange={setTables}
      onClose={handleClose}
    />
  ) : (
    <>
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
        headerButtons={<DataEntry.Edit onClick={handleEditing} />}
        icon={icons.eye}
        onClose={handleClose}
      >
        <QueryTables
          counts={counts}
          disabledTitle={dataViewsText.noDataViewQuery()}
          getHref={(name) => `/specify/dataviews/${name.toLowerCase()}`}
          isDisabled={(table): boolean =>
            typeof queryIds[table.name] !== 'number'
          }
          tables={tables}
          onClick={undefined}
          renderAction={(table): JSX.Element => {
            const hasQuery = typeof queryIds[table.name] === 'number';
            return (
              <Button.Icon
                icon={hasQuery ? 'pencil' : 'plus'}
                title={
                  hasQuery
                    ? dataViewsText.editDataViewQuery()
                    : dataViewsText.createDataViewQuery()
                }
                onClick={(): void => setEditingQueryTable(table)}
              />
            );
          }}
        />
      </Dialog>
      {editingQueryTable !== undefined && (
        <DataViewQueryEditor
          queryId={queryIds[editingQueryTable.name] ?? undefined}
          table={editingQueryTable}
          onClose={(): void => setEditingQueryTable(undefined)}
          onSaved={(): void => refreshQueryId(editingQueryTable)}
        />
      )}
    </>
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

/**
 * Looks up each table's saved "Data View" query (Spquery.isDataView=true),
 * if one exists. Absent key = still loading; undefined value = none found.
 */
function useDataViewQueryIds(
  tables: RA<SpecifyTable>
): readonly [IR<number | undefined>, (table: SpecifyTable) => void] {
  const [queryIds, setQueryIds] = React.useState<IR<number | undefined>>({});
  const seededTables = React.useRef<Set<string>>(new Set());

  const fetchQueryId = React.useCallback(async (table: SpecifyTable) => {
    const { records } = await fetchCollection('SpQuery', {
      contextTableId: table.tableId,
      isDataView: true,
      domainFilter: false,
      limit: 1,
    });
    let queryId: number | undefined = records[0]?.id;
    if (
      queryId === undefined &&
      !seededTables.current.has(table.name) &&
      hasToolPermission('queryBuilder', 'create')
    ) {
      seededTables.current.add(table.name);
      queryId = await createDefaultDataViewQuery(table.name).catch(
        (): undefined => undefined
      );
    }
    setQueryIds((previousIds) => ({
      ...previousIds,
      [table.name]: queryId,
    }));
  }, []);

  React.useEffect(() => {
    let destructorCalled = false;
    tables.forEach((table) => {
      fetchQueryId(table)
        .then(() => undefined)
        .catch((error) => {
          if (!destructorCalled) raise(error);
        });
    });
    return (): void => {
      destructorCalled = true;
    };
  }, [tables, fetchQueryId]);

  return [queryIds, fetchQueryId] as const;
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
