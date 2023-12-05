import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { schemaText } from '../../localization/schema';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { userPreferences } from '../Preferences/userPreferences';
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
      tables={tables}
      onChange={setTables}
      onClose={handleClose}
    />
  );
}

export function TablesListEdit({
  isNoRestrictionMode,
  defaultTables,
  header,
  tables: selectedTables,
  onChange: handleChange,
  onClose: handleClose,
}: {
  readonly isNoRestrictionMode: boolean;
  readonly defaultTables: RA<keyof Tables>;
  readonly header: LocalizedString;
  readonly tables: RA<SpecifyTable>;
  readonly onChange: (table: RA<SpecifyTable>) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const allTables = Object.values(tables)
    .filter(
      ({ isSystem, isHidden }) =>
        isNoRestrictionMode || (!isSystem && !isHidden)
    )
    .map(({ name, label }) => ({ name, label }));
  const handleChanged = (items: RA<string>): void =>
    handleChange(items.map((name) => tables[name as keyof Tables]));
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
      <ListEdit
        allItems={allTables}
        availableLabel={schemaText.possibleTables()}
        defaultValues={defaultTables}
        selectedLabel={schemaText.selectedTables()}
        selectedValues={selectedTables.map(({ name }) => name)}
        onChange={handleChanged}
      />
    </Dialog>
  );
}
