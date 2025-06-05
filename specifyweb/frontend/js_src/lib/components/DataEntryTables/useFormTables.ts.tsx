import React from 'react';

import type { GetSet, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTable, getTableById } from '../DataModel/tables';
import { defaultInteractionTablesId } from '../Interactions/fetch';
import { hasTablePermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { defaultFormTablesConfigId } from './fetch';
import { defaultVisibleForms } from './fetchTables';

export type TableType = 'form' | 'interactions';

export function useFormTables(type: TableType): GetSet<RA<SpecifyTable>> {
  const [tables, setTables] = userPreferences.use(
    type,
    'general',
    'shownTables'
  );

  // One-time cleanup if user still has "legacy" in preferences
  React.useEffect(() => {
    if (tables === 'legacy') {
      setTables(
        type === 'form' ? defaultFormTablesConfigId : defaultInteractionTablesId
      );
    }
  }, [tables, setTables, type]);

  // Safe fallback if legacy was still present or tables is invalid
  const tableIds = Array.isArray(tables) ? tables : [];

  const visibleTables =
    tableIds.length === 0
      ? filterArray(defaultVisibleForms[type].map(getTable))
      : tableIds.map(getTableById);

  const accessibleTables = visibleTables.filter(({ name }) =>
    hasTablePermission(name, 'read')
  );

  const handleChange = React.useCallback(
    (tables: RA<SpecifyTable>) =>
      setTables(tables.map(({ tableId }) => tableId)),
    [setTables]
  );

  return [accessibleTables, handleChange];
}
