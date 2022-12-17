import React from 'react';

import type { Tables } from '../DataModel/types';
import { split } from '../../utils/utils';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { schema } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { RA } from '../../utils/types';
import { Dialog } from '../Molecules/Dialog';
import { defaultQueryTablesConfig, useQueryModels } from './QueryTables';
import { Button } from '../Atoms/Button';
import { Label, Select } from '../Atoms/Form';
import { usePref } from '../UserPreferences/usePref';
import { f } from '../../utils/functools';
import { schemaText } from '../../localization/schema';

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
      defaultTables={defaultQueryTablesConfig}
      isNoRestrictionMode={isNoRestrictionMode}
      models={models}
      header={queryText.configureQueryTables()}
      onChange={setModels}
      onClose={handleClose}
    />
  );
}

export function TablesListEdit({
  isNoRestrictionMode,
  defaultTables,
  header,
  models: selectedModels,
  onChange: handleRawChange,
  onClose: handleClose,
}: {
  readonly isNoRestrictionMode: boolean;
  readonly defaultTables: RA<keyof Tables>;
  readonly header: string;
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
    const firstIndex =
      f.min(...selected.map((model) => selectedModels.indexOf(model))) ?? 1;
    const insertionIndex = Math.max(0, firstIndex - 1);
    handleMove(selected, insertionIndex);
  }

  function handleMoveDown(): void {
    const selected: RA<SpecifyModel> = selectedSubset.map(
      (tableName) => schema.models[tableName]
    );
    const firstIndex =
      f.min(...selected.map((model) => selectedModels.indexOf(model))) ?? -1;
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
      buttons={
        <>
          <Button.Blue onClick={(): void => handleRawChange([])}>
            {commonText.reset()}
          </Button.Blue>
          <span className="-ml-2 flex-1" />
          <Button.Blue onClick={handleClose}>{commonText.close()}</Button.Blue>
        </>
      }
      header={header}
      onClose={handleClose}
    >
      <div className="grid grid-cols-[auto_1fr_auto_1fr] grid-rows-1">
        <div className="flex flex-col justify-center">
          <Button.Icon
            disabled={selectedSubset.length === 0}
            icon="chevronUp"
            title={commonText.moveUp()}
            onClick={handleMoveUp}
          />
          <Button.Icon
            disabled={selectedSubset.length === 0}
            icon="chevronDown"
            title={commonText.moveDown()}
            onClick={handleMoveDown}
          />
        </div>
        <Label.Block>
          {schemaText.selectedTables()}
          <Select
            className="flex-1"
            multiple
            size={10}
            value={selectedSubset}
            onValuesChange={(tables): void =>
              setSelectedSubset(tables as RA<keyof Tables>)
            }
          >
            {selectedModels.map(({ name, label }) => (
              <option key={name} value={name}>
                {label}
              </option>
            ))}
          </Select>
        </Label.Block>
        <div className="flex gap-2">
          <div className="flex items-center">
            <Button.Icon
              disabled={possibleSubset.length === 0}
              icon="chevronLeft"
              title={commonText.add()}
              onClick={handleAdd}
            />
            <Button.Icon
              disabled={selectedSubset.length === 0}
              icon="chevronRight"
              title={commonText.remove()}
              onClick={handleRemove}
            />
          </div>
        </div>
        <Label.Block>
          {schemaText.possibleTables()}
          <Select
            className="flex-1"
            multiple
            size={10}
            value={possibleSubset}
            onValuesChange={(tables): void =>
              setPossibleSubset(tables as RA<keyof Tables>)
            }
          >
            {possibleModels.map(({ name, label }) => (
              <option key={name} value={name}>
                {label}
              </option>
            ))}
          </Select>
        </Label.Block>
      </div>
    </Dialog>
  );
}
