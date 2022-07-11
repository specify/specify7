import React from 'react';

import type { Tables } from '../datamodel';
import { split } from '../helpers';
import { commonText } from '../localization/common';
import { queryText } from '../localization/query';
import { schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { Button, Label, Select } from './basic';
import { Dialog } from './modaldialog';
import { usePref } from './preferenceshooks';
import { defaultQueryTablesConfig, useQueryModels } from './querytables';

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
  const [models, setModels] = useQueryModels();
  return (
    <TablesListEdit
      isNoRestrictionMode={isNoRestrictionMode}
      defaultTables={defaultQueryTablesConfig}
      models={models}
      onChange={setModels}
      onClose={handleClose}
    />
  );
}

export function TablesListEdit({
  isNoRestrictionMode,
  defaultTables,
  models: selectedModels,
  onChange: handleRawChange,
  onClose: handleClose,
}: {
  readonly isNoRestrictionMode: boolean;
  readonly defaultTables: RA<keyof Tables>;
  readonly models: RA<SpecifyModel>;
  readonly onChange: (models: RA<SpecifyModel>) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const handleChange = (models: RA<SpecifyModel>): void =>
    handleRawChange(
      JSON.stringify(models.map(({ name }) => name)) ===
        JSON.stringify(defaultTables)
        ? []
        : models
    );

  const [selectedSubset, setSelectedSubset] = React.useState<RA<keyof Tables>>(
    []
  );

  const possibleModels = Object.values(schema.models)
    .filter((model) => !selectedModels.includes(model))
    .filter(
      ({ isSystem, isHidden }) =>
        isNoRestrictionMode || (!isSystem && !isHidden)
    );
  const [possibleSubset, setPossibleSubset] = React.useState<RA<keyof Tables>>(
    []
  );

  function handleMoveUp(): void {
    const selected: RA<SpecifyModel> = selectedSubset.map(
      (tableName) => schema.models[tableName]
    );
    const firstIndex = Math.min(
      ...selected.map((model) => selectedModels.indexOf(model))
    );
    const insertionIndex = Math.max(0, firstIndex - 1);
    handleMove(selected, insertionIndex);
  }

  function handleMoveDown(): void {
    const selected: RA<SpecifyModel> = selectedSubset.map(
      (tableName) => schema.models[tableName]
    );
    const firstIndex = Math.min(
      ...selected.map((model) => selectedModels.indexOf(model))
    );
    const insertionIndex = firstIndex + 1;
    handleMove(selected, insertionIndex);
  }

  function handleMove(
    selected: RA<SpecifyModel>,
    insertionIndex: number
  ): void {
    const remainingTables = selectedModels.filter(
      (model) => !selected.includes(model)
    );
    handleChange([
      ...remainingTables.slice(0, insertionIndex),
      ...selected,
      ...remainingTables.slice(insertionIndex),
    ]);
  }

  function handleAdd(): void {
    const [remaining, toAdd] = split(possibleModels, ({ name }) =>
      possibleSubset.includes(name)
    );
    handleChange([...selectedModels, ...toAdd]);
    setPossibleSubset(remaining.slice(0, 1).map(({ name }) => name));
  }

  function handleRemove(): void {
    handleChange(
      selectedModels.filter((model) => !selectedSubset.includes(model.name))
    );
    const firstPossible: RA<SpecifyModel> = selectedModels
      .filter((model) => !selectedModels.includes(model))
      .slice(0, 1);
    setSelectedSubset(firstPossible.map(({ name }) => name));
  }

  return (
    <Dialog
      header={queryText('configureQueryTables')}
      buttons={
        <>
          <Button.Blue onClick={(): void => handleRawChange([])}>
            {commonText('reset')}
          </Button.Blue>
          <span className="flex-1 -ml-2" />
          <Button.Blue onClick={handleClose}>{commonText('close')}</Button.Blue>
        </>
      }
      onClose={handleClose}
    >
      <div className="grid grid-rows-1 grid-cols-[auto_1fr_auto_1fr]">
        <div className="flex flex-col justify-center">
          <Button.Icon
            icon="chevronUp"
            title={commonText('moveUp')}
            disabled={selectedSubset.length === 0}
            onClick={handleMoveUp}
          />
          <Button.Icon
            icon="chevronDown"
            title={commonText('moveDown')}
            disabled={selectedSubset.length === 0}
            onClick={handleMoveDown}
          />
        </div>
        <Label.Generic>
          {commonText('selectedTables')}
          <Select
            className="flex-1"
            multiple
            value={selectedSubset}
            onValuesChange={(tables): void =>
              setSelectedSubset(tables as RA<keyof Tables>)
            }
            size={10}
          >
            {selectedModels.map(({ name, label }) => (
              <option key={name} value={name}>
                {label}
              </option>
            ))}
          </Select>
        </Label.Generic>
        <div className="flex gap-2">
          <div className="flex items-center">
            <Button.Icon
              icon="chevronLeft"
              title={commonText('add')}
              disabled={possibleSubset.length === 0}
              onClick={handleAdd}
            />
            <Button.Icon
              icon="chevronRight"
              title={commonText('remove')}
              disabled={selectedSubset.length === 0}
              onClick={handleRemove}
            />
          </div>
        </div>
        <Label.Generic>
          {commonText('possibleTables')}
          <Select
            className="flex-1"
            multiple
            value={possibleSubset}
            onValuesChange={(tables): void =>
              setPossibleSubset(tables as RA<keyof Tables>)
            }
            size={10}
          >
            {possibleModels.map(({ name, label }) => (
              <option key={name} value={name}>
                {label}
              </option>
            ))}
          </Select>
        </Label.Generic>
      </div>
    </Dialog>
  );
}
