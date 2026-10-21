import React from 'react';

import { formsText } from '../../localization/forms';
import { toggleItem } from '../../utils/utils';
import { Input, Label } from '../Atoms/Form';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { FORBID_ADDING, NO_CLONE } from '../Forms/ResourceView';
import { userPreferences } from '../Preferences/userPreferences';

export function CloneConfig({
  table,
}: {
  readonly table: SpecifyTable;
}): JSX.Element | null {
  const [globalDisabled, setGlobalDisabled] = userPreferences.use(
    'form',
    'preferences',
    'disableClone'
  );
  const isEnabled = !globalDisabled.includes(table.name);
  const canChange = !NO_CLONE.has(table.name);
  return canChange ? (
    <Label.Inline>
      <Input.Checkbox
        checked={isEnabled}
        disabled={NO_CLONE.has(table.name)}
        onChange={(): void =>
          setGlobalDisabled(toggleItem(globalDisabled, table.name))
        }
      />
      {formsText.cloneButtonEnabled()}
    </Label.Inline>
  ) : null;
}

export function AddButtonConfig({
  table,
}: {
  readonly table: SpecifyTable;
}): JSX.Element | null {
  const [globalDisabled, setGlobalDisabled] = userPreferences.use(
    'form',
    'preferences',
    'disableAdd'
  );
  const isEnabled = !globalDisabled.includes(table.name);
  const canChange = !FORBID_ADDING.has(table.name);
  return canChange ? (
    <Label.Inline>
      <Input.Checkbox
        checked={isEnabled}
        disabled={FORBID_ADDING.has(table.name)}
        onChange={(): void =>
          setGlobalDisabled(toggleItem(globalDisabled, table.name))
        }
      />
      {formsText.addButtonEnabled()}
    </Label.Inline>
  ) : null;
}
