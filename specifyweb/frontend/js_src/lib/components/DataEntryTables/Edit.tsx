import React from 'react';

import { formsText } from '../../localization/forms';
import type { GetSet, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTable, getTableById } from '../DataModel/tables';
import { hasTablePermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { TablesListEdit } from '../Toolbar/QueryTablesEdit';
import { defaultVisibleForms } from './defaults';

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

  const visibleTables =
    Array.isArray(tables) && tables.length > 0
      ? tables.map(getTableById)
      : filterArray(defaultVisibleForms[type].map(getTable));

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
