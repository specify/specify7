import React from 'react';

import type { DefaultComboBoxProps } from './combobox';
import { PickListComboBox } from './picklist';

export function UserTypeComboBox(props: DefaultComboBoxProps): JSX.Element {
  return (
    <PickListComboBox
      {...props}
      items={['Manager', 'FullAccess', 'LimitedAccess', 'Guest'].map(
        (type, index) => ({
          value: index.toString(),
          title: type,
        })
      )}
      onAdd={undefined}
      pickList={undefined}
    />
  );
}
