import React from 'react';
import type { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import { useBooleanState } from '../../hooks/useBooleanState';
import { FrontEndStatsResultDialog } from './ResultsDialog';
import { Button } from '../Atoms/Button';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { SerializedResource } from '../DataModel/helperTypes';
import { RA } from '../../utils/types';

export function StatsResult({
  statValue,
  query,
  statLabel,
  onClick: handleClick,
  onRemove: handleRemove,
  onSpecChanged: handleSpecChanged,
}: {
  readonly statValue: string | number | undefined;
  readonly query: SpecifyResource<SpQuery> | undefined;
  readonly statLabel: string;
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
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      {statLabel === undefined ? (
        <div>{commonText('loading')}</div>
      ) : (
        <p className="flex gap-2">
          {typeof handleRemove === 'function' && (
            <Button.Icon
              icon="trash"
              title={commonText('remove')}
              onClick={handleRemove}
            />
          )}
          <Button.LikeLink
            className="flex-1"
            onClick={
              handleClick ?? (query === undefined ? undefined : handleOpen)
            }
          >
            <span>{statLabel}</span>
            <span className="-ml-2 flex-1" />
            <span>{statValue ?? commonText('loading')}</span>
          </Button.LikeLink>
        </p>
      )}

      {isOpen && query !== undefined ? (
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
