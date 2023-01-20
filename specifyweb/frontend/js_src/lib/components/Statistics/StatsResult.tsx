import React from 'react';
import type { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import { useBooleanState } from '../../hooks/useBooleanState';
import { FrontEndStatsResultDialog } from './ResultsDialog';
import { Button } from '../Atoms/Button';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { SerializedResource } from '../DataModel/helperTypes';
import { RA } from '../../utils/types';
import { Input } from '../Atoms/Form';

export function StatsResult({
  statValue,
  query,
  statLabel,
  onClick: handleClick,
  onRemove: handleRemove,
  onSpecChanged: handleSpecChanged,
  onItemRename: handleItemRename,
  isDefault,
}: {
  readonly statValue: string | number | undefined;
  readonly query: SpecifyResource<SpQuery> | undefined;
  readonly statLabel: string | undefined;
  readonly isDefault: boolean;
  readonly onClick: (() => void) | undefined;
  readonly onRemove: (() => void) | undefined;
  readonly onSpecChanged:
    | ((
        tableName: keyof Tables,
        fields: RA<
          Partial<SerializedResource<SpQueryField>> & { readonly path: string }
        >
      ) => void)
    | undefined;
  readonly onItemRename: ((newLabel: string) => void) | undefined;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      {statLabel === undefined ? (
        <li>{commonText.loading()}</li>
      ) : typeof handleRemove === 'function' ? (
        <>
          <Button.Icon
            icon={isDefault ? 'x' : 'trash'}
            title={isDefault ? commonText.remove() : commonText.delete()}
            onClick={handleRemove}
          />
          <Input.Text
            required
            value={statLabel}
            onValueChange={(newname): void => {
              handleItemRename?.(newname);
            }}
          />
          <span className="self-center">
            {statValue ?? commonText.loading()}
          </span>
        </>
      ) : (
        <li className="flex gap-2">
          <Button.LikeLink
            className="flex-1"
            onClick={
              handleClick ?? (query === undefined ? undefined : handleOpen)
            }
          >
            <span>{statLabel}</span>
            <span className="-ml-2 flex-1" />
            <span>{statValue ?? commonText.loading()}</span>
          </Button.LikeLink>
        </li>
      )}

      {isOpen && query !== undefined && statLabel !== undefined ? (
        <FrontEndStatsResultDialog
          query={query}
          onClose={handleClose}
          statLabel={statLabel}
          onSpecChanged={handleSpecChanged}
        />
      ) : undefined}
    </>
  );
}
