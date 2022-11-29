import { Button } from '../Atoms/Button';
import React from 'react';

export function PageButton({
  label,
  isActive,
  onClick: handleClick,
  onDialogOpen: handleDialogOpen,
}: {
  readonly label: string;
  readonly isActive: boolean;
  readonly onClick: () => void;
  readonly onDialogOpen: (() => void) | undefined;
}): JSX.Element {
  return (
    <div className="flex">
      <Button.Gray
        aria-current={isActive ? 'page' : undefined}
        className="min-w-28 flex-1"
        onClick={handleClick}
      >
        {label}
      </Button.Gray>
      <Button.Icon
        title="remove"
        icon="pencil"
        className={handleDialogOpen === undefined ? 'invisible' : undefined}
        onClick={handleDialogOpen}
      />
    </div>
  );
}
