import React from 'react';

import schema from '../schema';
import type { RA } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { PickListTypes } from './combobox';
import { PickListComboBox } from './picklist';

export function PickListTableComboBox(
  props: DefaultComboBoxProps
): JSX.Element {
  const getItems = React.useCallback(() => {
    if (props.resource.get('type') !== PickListTypes.TABLE) return [];
    return Object.entries(schema.models).map(([tableName, tableData]) => ({
      value: tableName,
      title: tableData.getLocalizedName() ?? tableName,
    }));
  }, [props.resource]);
  const [items, setItems] = React.useState<RA<PickListItemSimple>>(getItems);
  React.useEffect(() => {
    props.resource.on('change:type', () => setItems(getItems));
  }, [props.resource, getItems]);

  return (
    <PickListComboBox
      {...props}
      items={items}
      fieldName="tableName"
      onAdd={undefined}
      pickList={undefined}
      disabled={props.disabled || items.length === 0}
    />
  );
}
