import React from 'react';

import { queryText } from '../../localization/query';
import { wbPlanText } from '../../localization/wbPlan';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import type { Tables } from '../DataModel/types';
import { isTreeTable } from '../InitialContext/treeRanks';
import { hasPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';

export function QueryToolbar({
  showHiddenFields,
  tableName,
  isDistinct,
  isSeries,
  showSeries,
  onToggleHidden: handleToggleHidden,
  onToggleDistinct: handleToggleDistinct,
  onToggleSeries: handleToggleSeries,
  onScheduleCountOnlyRun: handleScheduleCountOnlyRun,
  onScheduleRun: handleScheduleRun,
  onSubmitClick: handleSubmitClick,
}: {
  readonly showHiddenFields: boolean;
  readonly tableName: keyof Tables;
  readonly isDistinct: boolean;
  readonly isSeries: boolean;
  readonly showSeries: boolean;
  readonly onToggleHidden: (value: boolean) => void;
  readonly onToggleDistinct: () => void;
  readonly onToggleSeries: () => void;
  readonly onScheduleCountOnlyRun: () => void;
  readonly onScheduleRun: () => void;
  readonly onSubmitClick: () => void;
}): JSX.Element {
  const canRun = hasPermission('/querybuilder/query', 'execute');
  /*
   * Query Distinct for trees is disabled because of
   * https://github.com/specify/specify7/pull/1019#issuecomment-973525594
   */
  const canRunDistinct = canRun && !isTreeTable(tableName);

  const runDistinctKeyboardShortcut = userPreferences.useKeyboardShortcut(
    'queryBuilder',
    'actions',
    'distinct',
    canRunDistinct ? handleToggleDistinct : undefined
  );
  const runCountOnlyKeyboardShortcut = userPreferences.useKeyboardShortcut(
    'queryBuilder',
    'actions',
    'count',
    canRun ? handleScheduleCountOnlyRun : undefined
  );
  const runQueryKeyboardShortcut = userPreferences.useKeyboardShortcut(
    'queryBuilder',
    'actions',
    'query',
    canRun ? handleScheduleRun : undefined
  );

  return (
    <div className="flex flex-wrap gap-2" role="toolbar">
      <Label.Inline>
        <Input.Checkbox
          checked={showHiddenFields}
          onValueChange={handleToggleHidden}
        />
        {wbPlanText.revealHiddenFormFields()}
      </Label.Inline>
      <span className="-ml-2 flex-1" />
      {canRun && (
        <>
          {showSeries && (
            <Label.Inline>
              <Input.Checkbox
                checked={isSeries}
                isReadOnly={isDistinct}
                onChange={handleToggleSeries}
              />
              {queryText.series()}
            </Label.Inline>
          )}
          {/*
           * Query Distinct for trees is disabled because of
           * https://github.com/specify/specify7/pull/1019#issuecomment-973525594
           */}
          {canRunDistinct && (
            <Label.Inline title={runDistinctKeyboardShortcut}>
              <Input.Checkbox
                checked={isDistinct}
                isReadOnly={isSeries}
                onChange={handleToggleDistinct}
              />
              {queryText.distinct()}
            </Label.Inline>
          )}
          <Button.Small
            title={runCountOnlyKeyboardShortcut}
            onClick={handleScheduleCountOnlyRun}
          >
            {queryText.countOnly()}
          </Button.Small>
          <Submit.Small
            title={runQueryKeyboardShortcut}
            onClick={handleSubmitClick}
          >
            {queryText.query()}
          </Submit.Small>
        </>
      )}
    </div>
  );
}
