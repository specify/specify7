import React from 'react';

import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';

export function StatsAsideButton({
  label,
  isCurrent,
  onClick: handleClick,
  onRename: handleRename,
}: {
  readonly label: string;
  readonly isCurrent: boolean;
  readonly onClick: (() => void) | undefined;
  readonly onRename: (() => void) | undefined;
}): JSX.Element {
  return (
    <div className="flex">
      <Button.Small
        aria-current={isCurrent ? 'page' : undefined}
        className={`min-w-[theme(spacing.40)] max-w-xs flex-1 !justify-start overflow-x-auto normal-case ${
          isCurrent ? 'bg-brand-300 text-white !ring-brand-300' : ''
        }`}
        onClick={handleClick}
      >
        {label}
      </Button.Small>
      <Button.Icon
        className={handleRename === undefined ? 'invisible' : undefined}
        icon="pencil"
        title={commonText.edit()}
        onClick={handleRename}
      />
    </div>
  );
}
