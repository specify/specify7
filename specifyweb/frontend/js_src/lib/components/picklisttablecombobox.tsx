import React from 'react';

import { f } from '../functools';
import { getPickListItems } from '../picklistmixins';
import { pickLists } from '../picklists';
import type { RA } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { PickListTypes } from './combobox';
import { PickListComboBox } from './picklist';

export function PickListTableComboBox(
  props: DefaultComboBoxProps
): JSX.Element {
  const getItems = React.useCallback(
    () =>
      props.resource.get('type') === PickListTypes.ITEMS
        ? []
        : f.maybe(
            pickLists[props.field.getPickList() ?? ''],
            getPickListItems
          ) ?? [],
    [props.resource, props.field]
  );
  const [items, setItems] = React.useState<RA<PickListItemSimple>>(getItems);
  React.useEffect(() => {
    const handleChange = (): void => {
      if (props.resource.get('type') === PickListTypes.ITEMS)
        props.resource.set('tableName', null as never);
      setItems(getItems);
    };
    props.resource.on('change:type', handleChange);
    return (): void => props.resource.off('change:type', handleChange);
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
