import React from 'react';

import { getModel } from '../schema';
import type { RA } from '../types';
import { defined } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { PickListTypes } from './combobox';
import { PickListComboBox } from './picklist';

export function PickListFieldComboBox(
  props: DefaultComboBoxProps
): JSX.Element {
  const getItems = React.useCallback(() => {
    if (props.resource.get('type') !== PickListTypes.FIELDS) return [];
    const model = defined(getModel(props.resource.get('tableName')));
    return model.fields.map((field) => ({
      value: field.name,
      title: field.label,
    }));
  }, [props.resource]);
  const [items, setItems] = React.useState<RA<PickListItemSimple>>(getItems);
  React.useEffect(() => {
    const handleChange = () => setItems(getItems);
    props.resource.on('change:tableName change:type', handleChange);
    return (): void =>
      props.resource.off('change:tableName change:type', handleChange);
  }, [props.resource, getItems]);

  return (
    <PickListComboBox
      {...props}
      items={items}
      onAdd={undefined}
      pickList={undefined}
      isDisabled={items.length === 0}
    />
  );
}
