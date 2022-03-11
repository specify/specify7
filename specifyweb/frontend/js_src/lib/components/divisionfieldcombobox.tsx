import React from 'react';

import { fetchCollection } from '../collection';
import type { RA } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { useAsyncState } from './hooks';
import { PickListComboBox } from './picklist';

export function DivisionFieldComboBox(
  props: DefaultComboBoxProps
): JSX.Element {
  const [items] = useAsyncState<RA<PickListItemSimple>>(
    React.useCallback(
      async () =>
        fetchCollection('Division', { limit: 0 }).then(({ records }) =>
          records.map((division) => ({
            value: division.resource_uri,
            title: division.name ?? '',
          }))
        ),
      []
    )
  );

  return (
    <PickListComboBox
      {...props}
      items={items}
      fieldName="division"
      onAdd={undefined}
      pickList={undefined}
      disabled={
        props.disabled || typeof items === 'undefined' || items.length === 0
      }
    />
  );
}
