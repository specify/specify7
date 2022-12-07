import { Button } from '../Atoms/Button';
import React from 'react';

export function StatsPageButton({
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
        className="min-w-28 flex-1 normal-case"
        onClick={handleClick}
      >
        {label}
      </Button.Gray>
      <Button.Icon
        title="remove"
        icon="pencil"
        className={handleRename === undefined ? 'invisible' : undefined}
        onClick={handleRename}
      />
    </div>
  );
}
