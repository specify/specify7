import React from 'react';

import type { RA } from '../../utils/types';
import type { GetSet } from '../../utils/types';
import { getTableById, strictGetTable } from '../DataModel/tables';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { Tables } from '../DataModel/types';
import { userPreferences } from '../Preferences/userPreferences';
import { tablesFilter } from '../SchemaConfig/Tables';

export const defaultDataViewTablesConfig: RA<keyof Tables> = [
  'Accession',
  'Agent',
  'CollectionObject',
  'CollectingEvent',
  'Gift',
  'Loan',
  'Locality',
];

export function useDataViewTables(): GetSet<RA<SpecifyTable>> {
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
