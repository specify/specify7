import React from 'react';

import schema from '../schema';
import type { RA } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { crash } from './errorboundary';
import { PickListComboBox } from './picklist';

export function DivisionFieldComboBox(
  props: DefaultComboBoxProps
): JSX.Element {
  const getItems = React.useCallback(async () => {
    const divisionQuery = new schema.models.Division.LazyCollection();
    return divisionQuery.fetchPromise({ limit: 0 }).then(({ models }) =>
      models.map((division) => ({
        value: division.get('resource_uri'),
        title: division.get('name') ?? '',
      }))
    );
  }, []);
  const [items, setItems] = React.useState<RA<PickListItemSimple>>([]);
  React.useEffect(
    () => void getItems().then(setItems).catch(crash),
    [props.resource, getItems]
  );

  return (
    <PickListComboBox
      {...props}
      items={items}
      fieldName="division"
      onAdd={undefined}
      pickList={undefined}
      disabled={props.disabled || items.length === 0}
    />
  );
}
