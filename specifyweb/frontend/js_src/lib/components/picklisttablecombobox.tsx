import React from 'react';
import { getPickListItems, PickListTypes } from '../picklistmixins';
import { resourceOn } from '../resource';
import type { RA } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { PickListComboBox } from './picklist';
import { pickListTablesPickList } from '../picklists';

export function PickListTableComboBox(
  props: DefaultComboBoxProps
): JSX.Element | null {
  const getItems = React.useCallback(
    () =>
      props.resource.get('type') === PickListTypes.ITEMS
        ? []
        : getPickListItems(pickListTablesPickList()),
    [props.resource, props.field]
  );
  const [items, setItems] = React.useState<RA<PickListItemSimple>>([]);
  React.useEffect(
    () =>
      resourceOn(
        props.resource,
        'change:type',
        (): void => {
          if (props.resource.get('type') === PickListTypes.ITEMS)
            props.resource.set('tableName', null as never);
          setItems(getItems);
        },
        true
      ),
    [props.resource, getItems]
  );

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
