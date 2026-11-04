import React from 'react';

import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { Button } from '../Atoms/Button';
import { statisticsAreLoading, useStatisticsLoading } from './requests';

export function StatsRefreshButton({
  onClick: handleClick,
}: {
  readonly onClick: () => void;
}): JSX.Element {
  const isLoading = useStatisticsLoading();
  return (
    <Button.BorderedGray
      disabled={isLoading}
      title={isLoading ? commonText.loading() : undefined}
      onClick={() => {
        if (!statisticsAreLoading()) handleClick();
      }}
    >
      {statsText.refresh()}
    </Button.BorderedGray>
  );
}

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
        className={` 
          aria-handled !dark:bg-[color:var(--secondary-light-button-color)] 
          min-w-[theme(spacing.40)] max-w-xs flex-1 !justify-start overflow-x-auto normal-case 
          ${isCurrent ? '!bg-brand-400 !text-white !ring-brand-300' : ''}
        `}
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
