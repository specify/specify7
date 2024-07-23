import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { schemaText } from '../../localization/schema';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { genericTables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { userPreferences } from '../Preferences/userPreferences';
import { tablesFilter } from '../SchemaConfig/Tables';
import { ListEdit } from './ListEdit';
import { defaultQueryTablesConfig, useQueryTables } from './QueryTablesWrapper';

export function QueryTablesEdit({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  const [isNoRestrictionMode] = userPreferences.use(
    'queryBuilder',
    'general',
    'noRestrictionsMode'
  );
  const [tables, setTables] = useQueryTables();
  return (
    <TablesListEdit
      defaultTables={defaultQueryTablesConfig}
      header={queryText.configureQueryTables()}
      isNoRestrictionMode={isNoRestrictionMode}
      parent="QueryList"
      tables={tables}
      onChange={setTables}
      onClose={handleClose}
    />
  );
}
// TODO: temp fix, remove this, use to hide geo tables for COG until 9.8 release
export const HIDDEN_GEO_TABLES = new Set([
  'CollectionObjectType',
  'CollectionObjectGroup',
  'CollectionObjectGroupJoin',
  'CollectionObjectGroupType',
]);
export function TablesListEdit({
  isNoRestrictionMode,
  defaultTables,
  header,
  tables: selectedTables,
  onChange: handleChange,
  onClose: handleClose,
  parent,
}: {
  readonly isNoRestrictionMode: boolean;
  readonly defaultTables: RA<keyof Tables>;
  readonly header: LocalizedString;
  readonly tables: RA<SpecifyTable>;
  readonly onChange: (table: RA<SpecifyTable>) => void;
  readonly onClose: () => void;
  readonly parent?: 'QueryList';
}): JSX.Element {
  const selectedValues = selectedTables.map(({ name }) => name);
  const allTables = Object.values(genericTables)
    .filter((table) =>
      tablesFilter(
        isNoRestrictionMode,
        false,
        true,
        table,
        selectedValues,
        parent
      )
    )
    // TODO: temp fix, remove this, use to hide geo tables for COG until 9.8 release
    .filter((table) => !HIDDEN_GEO_TABLES.has(table.name))
    .map(({ name, label }) => ({ name, label }));

  const handleChanged = (items: RA<keyof Tables>): void =>
    handleChange(items.map((name) => genericTables[name]));
  return (
    <Dialog
      buttons={
        <>
          <Button.Info onClick={(): void => handleChanged(defaultTables)}>
            {commonText.reset()}
          </Button.Info>
          <span className="-ml-2 flex-1" />
          <Button.Info onClick={handleClose}>{commonText.close()}</Button.Info>
        </>
      }
      header={header}
      onClose={handleClose}
    >
      <ListEdit<keyof Tables>
        allItems={allTables}
        availableLabel={schemaText.possibleTables()}
        defaultValues={defaultTables}
        selectedLabel={schemaText.selectedTables()}
        selectedValues={selectedValues}
        onChange={handleChanged}
      />
    </Dialog>
  );
}
