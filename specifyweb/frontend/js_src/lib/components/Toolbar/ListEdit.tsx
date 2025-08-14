/**
 * A two-column list with buttons for moving entires
 * between the columns.
 *
 * First column is for selected values, second one for
 * possible values
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { split } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Label, Select } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';

export function ListEdit<T extends string = string>({
  defaultValues,
  selectedValues,
  allItems,
  selectedLabel,
  availableLabel,
  onChange: handleRawChange,
}: {
  readonly defaultValues: RA<T>;
  readonly selectedValues: RA<T>;
  readonly allItems: RA<{
    readonly name: T;
    readonly label: string;
  }>;
  readonly selectedLabel: LocalizedString;
  readonly availableLabel: LocalizedString;
  readonly onChange: (items: RA<T>) => void;
}): JSX.Element {
  const handleChange = (items: RA<T>): void =>
    handleRawChange(
      JSON.stringify(items) === JSON.stringify(defaultValues) ? [] : items
    );

  const selectedItems = filterArray(
    selectedValues.map((name) => allItems.find((item) => item.name === name))
  );
  const possibleItems = allItems.filter(
    ({ name }) => !selectedValues.includes(name)
  );

  const [selectedSubset, setSelectedSubset] = React.useState<RA<T>>([]);
  const [possibleSubset, setPossibleSubset] = React.useState<RA<T>>([]);

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

  function handleMove(selected: RA<T>, insertionIndex: number): void {
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
    <div className="grid h-full flex-1 grid-rows-1 md:grid-cols-[auto_1fr_auto_1fr] md:flex-row min-h-60">
      <div className="flex md:contents">
        <div className="flex flex-col justify-center">
          <Button.Icon
            disabled={isReadOnly || (selectedSubset ?? []).length === 0}
            icon="chevronUp"
            title={queryText.moveUp()}
            onClick={handleMoveUp}
          />
          <Button.Icon
            disabled={isReadOnly || (selectedSubset ?? []).length === 0}
            icon="chevronDown"
            title={queryText.moveDown()}
            onClick={handleMoveDown}
          />
        </div>
        <Label.Block className="flex flex-1 flex-col">
          {selectedLabel}
          <Select
            className="flex-1"
            disabled={isReadOnly}
            multiple
            value={selectedSubset}
            onValuesChange={(values): void =>
              setSelectedSubset(values as RA<LocalizedString & T>)
            }
          >
            {selectedItems.map(({ name, label }) => (
              <option key={name} value={name}>
                {label}
              </option>
            ))}
          </Select>
        </Label.Block>
      </div>
      <div className="flex items-center justify-center">
        <Button.Icon
          disabled={isReadOnly || (possibleSubset ?? []).length === 0}
          icon="chevronLeft"
          title={commonText.add()}
          onClick={handleAdd}
        />
        <Button.Icon
          disabled={isReadOnly || (selectedSubset ?? []).length === 0}
          icon="chevronRight"
          title={commonText.remove()}
          onClick={handleRemove}
        />
      </div>
      <div className="flex justify-end md:flex-col">
        <Label.Block className="flex flex-1 flex-col">
          {availableLabel}
          <Select
            className="flex-1"
            disabled={isReadOnly}
            multiple
            value={possibleSubset}
            onValuesChange={(values): void =>
              setPossibleSubset(values as RA<LocalizedString & T>)
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
    </div>
  );
}