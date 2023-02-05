import React from 'react';
import type { SpQuery } from '../DataModel/types';
import { useBooleanState } from '../../hooks/useBooleanState';
import { FrontEndStatsResultDialog } from './ResultsDialog';
import { Button } from '../Atoms/Button';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { Input } from '../Atoms/Form';
import { QuerySpec } from './types';

export function StatsResult({
  value,
  query,
  label,
  onClick: handleClick,
  onRemove: handleRemove,
  onEdit: handleEdit,
  onRename: handleRename,
  isDefault,
}: {
  readonly value: string | number | undefined;
  readonly query: SpecifyResource<SpQuery> | undefined;
  readonly label: string | undefined;
  readonly isDefault: boolean;
  readonly onClick: (() => void) | undefined;
  readonly onRemove: (() => void) | undefined;
  readonly onEdit: ((querySpec: QuerySpec) => void) | undefined;
  readonly onRename: ((newLabel: string) => void) | undefined;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      {label === undefined ? (
        <li>{commonText.loading()}</li>
      ) : typeof handleRename === 'function' ? (
        <>
          <Button.Icon
            icon={isDefault ? 'x' : 'trash'}
            title={isDefault ? commonText.remove() : commonText.delete()}
            onClick={handleRemove}
          />
          <Input.Text required value={label} onValueChange={handleRename} />
          <span className="self-center">{value ?? commonText.loading()}</span>
        </>
      ) : (
        <li className="flex gap-2">
          <Button.LikeLink
            className="flex-1"
            onClick={
              handleClick ?? (query === undefined ? undefined : handleOpen)
            }
          >
            <span>{label}</span>
            <span className="-ml-2 flex-1" />
            <span>{value ?? commonText.loading()}</span>
          </Button.LikeLink>
        </li>
      )}

      {isOpen && query !== undefined && label !== undefined ? (
        <FrontEndStatsResultDialog
          query={query}
          onClose={handleClose}
          label={label}
          onEdit={handleEdit}
        />
      ) : undefined}
    </>
  );
}
