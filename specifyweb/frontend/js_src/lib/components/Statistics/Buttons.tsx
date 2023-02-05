import { Button } from '../Atoms/Button';
import React from 'react';
import { commonText } from '../../localization/common';

export function StatsAsideButton({
  label,
  isCurrent,
  onClick: handleClick,
  onRename: handleRename,
}: {
  readonly label: string;
  readonly isCurrent: boolean;
  readonly onClick: () => void;
  readonly onRename: (() => void) | undefined;
}): JSX.Element {
  return (
    <div className="flex">
      <Button.Gray
        aria-current={isCurrent ? 'page' : undefined}
        className="min-w-[theme(spacing.40)] flex-1 !justify-start normal-case"
        onClick={handleClick}
      >
        {label}
      </Button.Gray>
      <Button.Icon
        title={commonText.edit()}
        icon="pencil"
        className={handleRename === undefined ? 'invisible' : undefined}
        onClick={handleRename}
      />
    </div>
  );
}
