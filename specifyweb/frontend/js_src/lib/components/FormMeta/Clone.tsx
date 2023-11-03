import React from 'react';

import { formsText } from '../../localization/forms';
import { toggleItem } from '../../utils/utils';
import { Input, Label } from '../Atoms/Form';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { NO_CLONE } from '../Forms/ResourceView';
import { userPreferences } from '../Preferences/userPreferences';

export function CloneConfig({
  model,
}: {
  readonly model: SpecifyModel;
}): JSX.Element | null {
  const [globalDisabled, setGlobalDisabled] = userPreferences.use(
    'form',
    'preferences',
    'disableClone'
  );
  const isEnabled = !globalDisabled.includes(model.name);
  const canChange = !NO_CLONE.has(model.name);
  return canChange ? (
    <Label.Inline>
      <Input.Checkbox
        checked={isEnabled}
        disabled={NO_CLONE.has(model.name)}
        onChange={(): void =>
          setGlobalDisabled(toggleItem(globalDisabled, model.name))
        }
      />
      {formsText.cloneButtonEnabled()}
    </Label.Inline>
  ) : null;
}

export function AddButtonConfig({
  model,
}: {
  readonly model: SpecifyModel;
}): JSX.Element | null {
  const [globalDisabled, setGlobalDisabled] = userPreferences.use(
    'form',
    'preferences',
    'disableAdd'
  );
  const isEnabled = !globalDisabled.includes(model.name);
  const canChange = !NO_CLONE.has(model.name);
  return canChange ? (
    <Label.Inline>
      <Input.Checkbox
        checked={isEnabled}
        disabled={NO_CLONE.has(model.name)}
        onChange={(): void =>
          setGlobalDisabled(toggleItem(globalDisabled, model.name))
        }
      />
      {formsText.addButtonEnabled()}
    </Label.Inline>
  ) : null;
}
