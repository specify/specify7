import React from 'react';

import formsText from '../localization/forms';
import type { DefaultComboBoxProps } from './combobox';
import { PickListComboBox } from './picklist';

export function PickListTypeComboBox(props: DefaultComboBoxProps): JSX.Element {
  return (
    <PickListComboBox
      {...props}
      items={[
        formsText('userDefinedItems'),
        formsText('entireTable'),
        formsText('fieldFromTable'),
      ].map((type, index) => ({
        value: index.toString(),
        title: type,
      }))}
      onAdd={undefined}
      pickList={undefined}
    />
  );
}
