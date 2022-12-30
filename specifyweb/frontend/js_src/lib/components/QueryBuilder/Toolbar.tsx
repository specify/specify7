import React from 'react';

import { queryText } from '../../localization/query';
import { wbPlanText } from '../../localization/wbPlan';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import type { Tables } from '../DataModel/types';
import { isTreeModel } from '../InitialContext/treeRanks';
import { hasPermission } from '../Permissions/helpers';

export function QueryToolbar({
  showHiddenFields,
  modelName,
  isDistinct,
  onToggleHidden: handleToggleHidden,
  onToggleDistinct: handleToggleDistinct,
  onRunCountOnly: handleRunCountOnly,
  onSubmitClick: handleSubmitClick,
}: {
  readonly showHiddenFields: boolean;
  readonly modelName: keyof Tables;
  readonly isDistinct: boolean;
  readonly onToggleHidden: (value: boolean) => void;
  readonly onToggleDistinct: () => void;
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
          {/*
           * Query Distinct for trees is disabled because of
           * https://github.com/specify/specify7/pull/1019#issuecomment-973525594
           */}
          {!isTreeModel(modelName) && (
            <Label.Inline>
              <Input.Checkbox
                checked={isDistinct}
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
