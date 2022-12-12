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
  statCachedValue,
  onClick: handleClick,
  onRemove: handleRemove,
  onSpecChanged: handleSpecChanged,
  onValueLoad: handleValueLoad,
}: {
  readonly statValue: string | number | undefined;
  readonly query: SpecifyResource<SpQuery> | undefined;
  readonly statLabel: string | undefined;
  readonly statCachedValue: number | string | undefined;
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
  readonly onValueLoad: (statValue: string | number, itemName: string) => void;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  React.useEffect(() => {
    if (statValue !== undefined && statLabel !== undefined) {
      handleValueLoad(statValue, statLabel);
    }
  }, [statLabel, statValue]);
  return React.useMemo(
    () => (
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
              <span>
                {statValue ?? statCachedValue ?? commonText('loading')}
              </span>
            </Button.LikeLink>
          </p>
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
    ),
    [statLabel, statValue, statCachedValue]
  );
}
