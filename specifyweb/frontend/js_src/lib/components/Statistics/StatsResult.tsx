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
  hasPermission,
  onClick: handleClick,
  onRemove: handleRemove,
  onEdit: handleEdit,
  onRename: handleRename,
  onClone: handleClone,
}: {
  readonly value: number | string | undefined;
  readonly query: SpecifyResource<SpQuery> | undefined;
  readonly hasPermission: boolean;
  readonly label: string | undefined;
  readonly onClick: (() => void) | undefined;
  readonly onRemove: (() => void) | undefined;
  readonly onEdit: ((querySpec: QuerySpec) => void) | undefined;
  readonly onRename: ((newLabel: string) => void) | undefined;
  readonly onClone: (() => void) | undefined;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();

  /**
   * Cases
   *
   * 1. In the add stats dialog, default to clicking.
   *
   * 2. In the normal page and normal mode
   *    a. If it doesn't have query, disable
   *    b. If it has query, allow viewing the query.
   *
   * 3. In the normal page and edit mode and have permission
   *    a. It is a query stat or a back end stat -> use handleRename
   *
   * 4. In the normal page and edit mode but no permission
   *    a. Disable everything.
   *
   */
  const isDisabled = handleRename !== undefined && !hasPermission;
  const handleClickResolved =
    handleClick ?? (isDisabled || query === undefined ? undefined : handleOpen);
  return (
    <>
      {label === undefined ? (
        <li>{commonText.loading()}</li>
      ) : typeof handleRename === 'function' && hasPermission ? (
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
          <Button.LikeLink className="flex-1" onClick={handleClickResolved}>
            <span className="self-start" style={{ wordBreak: 'break-word' }}>
              {label}
            </span>
            <span className="-ml-2 flex-1" />
            <span className="min-w-fit self-start">
              {value ?? commonText.loading()}
            </span>
          </Button.LikeLink>
        </li>
      )}

      {isOpen && query !== undefined && label !== undefined ? (
        <FrontEndStatsResultDialog
          label={label}
          query={query}
          showClone
          onClone={hasPermission ? handleClone : undefined}
          onClose={handleClose}
          onEdit={hasPermission ? handleEdit : undefined}
        />
      ) : undefined}
    </>
  );
}
