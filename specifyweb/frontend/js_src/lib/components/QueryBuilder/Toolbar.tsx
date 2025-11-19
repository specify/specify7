import React from 'react';

import { queryText } from '../../localization/query';
import { wbPlanText } from '../../localization/wbPlan';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import type { Tables } from '../DataModel/types';
import { isTreeTable } from '../InitialContext/treeRanks';
import { hasPermission } from '../Permissions/helpers';

export function QueryToolbar({
  showHiddenFields,
  tableName,
  isDistinct,
  isSeries,
  showSeries,
  onToggleHidden: handleToggleHidden,
  onToggleDistinct: handleToggleDistinct,
  onToggleSeries: handleToggleSeries,
  onRunCountOnly: handleRunCountOnly,
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
  readonly onRunCountOnly: () => void;
  readonly onSubmitClick: () => void;
}): JSX.Element {
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
      {hasPermission('/querybuilder/query', 'execute') && (
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
          {!isTreeTable(tableName) && (
            <Label.Inline>
              <Input.Checkbox
                checked={isDistinct}
                isReadOnly={isSeries}
                onChange={handleToggleDistinct}
              />
              {queryText.distinct()}
            </Label.Inline>
          )}
          <Button.Small onClick={handleRunCountOnly}>
            {queryText.countOnly()}
          </Button.Small>
          <Submit.Small onClick={handleSubmitClick}>
            {queryText.query()}
          </Submit.Small>
        </>
      )}
    </div>
  );
}
