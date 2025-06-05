import React from 'react';

import { formsText } from '../../localization/forms';
import type { GetSet, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTable, getTableById } from '../DataModel/tables';
import { defaultInteractionTablesId } from '../Interactions/fetch';
import { hasTablePermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { TablesListEdit } from '../Toolbar/QueryTablesEdit';
import { defaultFormTablesConfigId } from './fetch';
import { defaultVisibleForms } from './fetchTables';

export type TableType = 'form' | 'interactions';

export function EditFormTables({
  onClose: handleClose,
  type,
}: {
  readonly onClose: () => void;
  readonly type: TableType;
}): JSX.Element {
  const [tables, setTables] = useFormTables(type);

  return (
    <CustomEditTables
      tables={tables}
      type={type}
      onChange={setTables}
      onClose={handleClose}
    />
  );
}

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
    tables.length === 0
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

function CustomEditTables({
  tables,
  type,
  onChange: handleChange,
  onClose: handleClose,
}: {
  readonly tables: RA<SpecifyTable>;
  readonly type: TableType;
  readonly onChange: (tables: RA<SpecifyTable>) => void;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <TablesListEdit
      defaultTables={defaultVisibleForms[type]}
      header={
        type === 'form'
          ? formsText.configureDataEntryTables()
          : formsText.configureInteractionTables()
      }
      isNoRestrictionMode={false}
      tables={tables}
      onChange={handleChange}
      onClose={handleClose}
    />
  );
}
