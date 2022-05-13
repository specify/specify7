import React from 'react';

import { f } from '../functools';
import { getPickListItems, PickListTypes } from '../picklistmixins';
import { getPickLists } from '../picklists';
import type { RA } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { PickListComboBox } from './picklist';
import { resourceOn } from '../resource';

export function PickListTableComboBox(
  props: DefaultComboBoxProps
): JSX.Element {
  const getItems = React.useCallback(
    () =>
      props.resource.get('type') === PickListTypes.ITEMS
        ? []
        : f.maybe(
            getPickLists()[props.field.getPickList() ?? ''],
            getPickListItems
          ) ?? [],
    [props.resource, props.field]
  );
  const [items, setItems] = React.useState<RA<PickListItemSimple>>(getItems);
  React.useEffect(
    () =>
      resourceOn(props.resource, 'change:type', (): void => {
        if (props.resource.get('type') === PickListTypes.ITEMS)
          props.resource.set('tableName', null as never);
        setItems(getItems);
      }),
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
