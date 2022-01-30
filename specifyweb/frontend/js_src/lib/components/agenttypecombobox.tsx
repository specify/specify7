import React from 'react';

import formsText from '../localization/forms';
import type { DefaultComboBoxProps } from './combobox';
import { PickListComboBox } from './picklist';

export const agentTypes = [
  formsText('organization'),
  formsText('person'),
  formsText('other'),
  formsText('group'),
] as const;

export function AgentTypeComboBox(props: DefaultComboBoxProps): JSX.Element {
  return (
    <PickListComboBox
      {...props}
      items={agentTypes.map((type, index) => ({
        value: index.toString(),
        title: type,
      }))}
      onAdd={undefined}
      pickList={undefined}
    />
  );
}
