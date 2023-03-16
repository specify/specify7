import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpQuery } from '../DataModel/types';
import { FrontEndStatsResultDialog } from './ResultsDialog';
import type { QuerySpec } from './types';

export function StatsResult({
  value,
  query,
  label,
  onClick: handleClick,
  onRemove: handleRemove,
  onEdit: handleEdit,
  onRename: handleRename,
  onClone: handleClone,
}: {
  readonly value: number | string | undefined;
  readonly query: SpecifyResource<SpQuery> | undefined;
  readonly label: string | undefined;
  readonly onClick: (() => void) | undefined;
  readonly onRemove: (() => void) | undefined;
  readonly onEdit: ((querySpec: QuerySpec) => void) | undefined;
  readonly onRename: ((newLabel: string) => void) | undefined;
  readonly onClone: ((querySpec: QuerySpec) => void) | undefined;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const isDisabled =
    handleEdit === undefined &&
    handleRename === undefined &&
    handleClick === undefined;
  const handleClickResolved = isDisabled
    ? undefined
    : handleClick ?? (query === undefined ? undefined : handleOpen);
  return (
    <>
      {label === undefined ? (
        <li>{commonText.loading()}</li>
      ) : typeof handleRename === 'function' ? (
        <>
          <Button.Icon
            icon="trash"
            title={commonText.remove()}
            onClick={handleRemove}
          />
          <Input.Text required value={label} onValueChange={handleRename} />
          <span className="self-center text-right">
            {value ?? commonText.loading()}
          </span>
        </>
      ) : (
        <li className="flex gap-2">
          <Button.LikeLink
            className="flex-1 text-left"
            onClick={handleClickResolved}
          >
            <span className="self-start">{label}</span>
            <span className="-ml-2 flex-1" />
            <span className="self-start">{value ?? commonText.loading()}</span>
          </Button.LikeLink>
        </li>
      )}

      {isOpen && query !== undefined && label !== undefined ? (
        <FrontEndStatsResultDialog
          label={label}
          matchClone
          query={query}
          onClone={handleClone}
          onClose={handleClose}
          onEdit={handleEdit}
        />
      ) : undefined}
    </>
  );
}
