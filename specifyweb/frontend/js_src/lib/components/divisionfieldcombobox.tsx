import React from 'react';

import { schema } from '../schema';
import type { RA } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { PickListComboBox } from './picklist';
import { useAsyncState } from './hooks';

export function DivisionFieldComboBox(
  props: DefaultComboBoxProps
): JSX.Element {
  const [items] = useAsyncState<RA<PickListItemSimple>>(
    React.useCallback(async () => {
      const divisionQuery = new schema.models.Division.LazyCollection();
      return divisionQuery.fetchPromise({ limit: 0 }).then(({ models }) =>
        models.map((division) => ({
          value: division.get('resource_uri'),
          title: division.get('name') ?? '',
        }))
      );
    }, [])
  );

  return (
    <PickListComboBox
      {...props}
      items={items ?? []}
      fieldName="division"
      onAdd={undefined}
      pickList={undefined}
      disabled={
        props.disabled || typeof items === 'undefined' || items.length === 0
      }
    />
  );
}
