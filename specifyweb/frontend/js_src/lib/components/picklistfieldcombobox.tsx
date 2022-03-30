import React from 'react';

import { getModel } from '../schema';
import type { RA } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { PickListTypes } from '../picklistmixins';
import { PickListComboBox } from './picklist';

export function PickListFieldComboBox(
  props: DefaultComboBoxProps
): JSX.Element {
  const getItems = React.useCallback(
    () =>
      props.resource.get('type') === PickListTypes.FIELDS
        ? getModel(props.resource.get('tableName') ?? '')?.fields.map(
            (field) => ({
              value: field.name,
              title: field.label,
            })
          ) ?? []
        : [],
    [props.resource]
  );
  const [items, setItems] = React.useState<RA<PickListItemSimple>>(getItems);
  React.useEffect(() => {
    const handleChange = () => {
      if (props.resource.get('type') !== PickListTypes.FIELDS)
        props.resource.set('fieldName', null as never);
      setItems(getItems);
    };
    props.resource.on('change:tablename change:type', handleChange);
    return (): void =>
      props.resource.off('change:tablename change:type', handleChange);
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
