import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { split } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Label, Select } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { usePref } from '../UserPreferences/usePref';
import { defaultQueryTablesConfig, useQueryTables } from './QueryTables';

export function QueryTablesEdit({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  const [isNoRestrictionMode] = usePref(
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
          <Button.Blue onClick={(): void => handleChanged(defaultTables)}>
            {commonText.reset()}
          </Button.Blue>
          <span className="-ml-2 flex-1" />
          <Button.Blue onClick={handleClose}>{commonText.close()}</Button.Blue>
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

type Item = {
  readonly name: string;
  readonly label: string;
};

export function ListEdit({
  defaultValues,
  selectedValues,
  allItems,
  selectedLabel,
  availableLabel,
  onChange: handleRawChange,
}: {
  readonly defaultValues: RA<string>;
  readonly selectedValues: RA<string>;
  readonly allItems: RA<Item>;
  readonly selectedLabel: LocalizedString;
  readonly availableLabel: LocalizedString;
  readonly onChange: (items: RA<string>) => void;
}): JSX.Element {
  const handleChange = (items: RA<string>): void =>
    handleRawChange(
      JSON.stringify(items) === JSON.stringify(defaultValues) ? [] : items
    );

  const selectedItems = filterArray(
    selectedValues.map((name) => allItems.find((item) => item.name === name))
  );
  const possibleItems = allItems.filter(
    ({ name }) => !selectedValues.includes(name)
  );

  const [selectedSubset, setSelectedSubset] = React.useState<RA<string>>([]);
  const [possibleSubset, setPossibleSubset] = React.useState<RA<string>>([]);

  function handleMoveUp(): void {
    const firstIndex =
      f.min(...selectedSubset.map((name) => selectedValues.indexOf(name))) ?? 1;
    const insertionIndex = Math.max(0, firstIndex - 1);
    handleMove(selectedSubset, insertionIndex);
  }

  function handleMoveDown(): void {
    const firstIndex =
      f.min(...selectedSubset.map((name) => selectedValues.indexOf(name))) ?? 1;
    const insertionIndex = firstIndex + 1;
    handleMove(selectedSubset, insertionIndex);
  }

  function handleMove(selected: RA<string>, insertionIndex: number): void {
    const remainingTables = selectedValues.filter(
      (name) => !selected.includes(name)
    );
    handleChange([
      ...remainingTables.slice(0, insertionIndex),
      ...selected,
      ...remainingTables.slice(insertionIndex),
    ]);
  }

  function handleAdd(): void {
    const [remaining, toAdd] = split(
      possibleItems.map(({ name }) => name),
      (name) => possibleSubset.includes(name)
    );
    handleChange([...selectedValues, ...toAdd]);
    const newIndex = possibleItems.findIndex(
      ({ name }) => name === possibleSubset[0]
    );
    setPossibleSubset(filterArray([remaining[newIndex]]));
    setSelectedSubset(possibleSubset);
  }

  function handleRemove(): void {
    const newSelectedItems = selectedValues.filter(
      (name) => !selectedSubset.includes(name)
    );
    handleChange(newSelectedItems);
    const newIndex = selectedValues.indexOf(selectedSubset[0]);
    setSelectedSubset(filterArray([newSelectedItems[newIndex]]));
    setPossibleSubset(selectedSubset);
  }

  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <div className="grid grid-cols-[auto_1fr_auto_1fr] grid-rows-1">
      <div className="flex flex-col justify-center">
        <Button.Icon
          disabled={isReadOnly || selectedSubset.length === 0}
          icon="chevronUp"
          title={queryText.moveUp()}
          onClick={handleMoveUp}
        />
        <Button.Icon
          disabled={isReadOnly || selectedSubset.length === 0}
          icon="chevronDown"
          title={queryText.moveDown()}
          onClick={handleMoveDown}
        />
      </div>
      <Label.Block>
        {selectedLabel}
        <Select
          className="flex-1"
          disabled={isReadOnly}
          multiple
          size={10}
          value={selectedSubset}
          onValuesChange={(tables): void =>
            setSelectedSubset(tables as RA<keyof Tables>)
          }
        >
          {selectedItems.map(({ name, label }) => (
            <option key={name} value={name}>
              {label}
            </option>
          ))}
        </Select>
      </Label.Block>
      <div className="flex gap-2">
        <div className="flex items-center">
          <Button.Icon
            disabled={isReadOnly || possibleSubset.length === 0}
            icon="chevronLeft"
            title={commonText.add()}
            onClick={handleAdd}
          />
          <Button.Icon
            disabled={isReadOnly || selectedSubset.length === 0}
            icon="chevronRight"
            title={commonText.remove()}
            onClick={handleRemove}
          />
        </div>
      </div>
      <Label.Block>
        {availableLabel}
        <Select
          className="flex-1"
          disabled={isReadOnly}
          multiple
          size={10}
          value={possibleSubset}
          onValuesChange={(tables): void =>
            setPossibleSubset(tables as RA<keyof Tables>)
          }
        >
          {possibleItems.map(({ name, label }) => (
            <option key={name} value={name}>
              {label}
            </option>
          ))}
        </Select>
      </Label.Block>
    </div>
  );
}
