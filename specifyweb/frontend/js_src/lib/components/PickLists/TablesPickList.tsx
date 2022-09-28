import React from 'react';

import { getPickListItems } from './fetch';
import { pickListTablesPickList, PickListTypes } from './definitions';
import { resourceOn } from '../DataModel/resource';
import type { RA } from '../../utils/types';
import type {
  DefaultComboBoxProps,
  PickListItemSimple,
} from '../FormFields/ComboBox';
import { PickListComboBox } from './index';

export function TablesPickList(
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
      isDisabled={items.length === 0}
      items={items}
      pickList={undefined}
      onAdd={undefined}
    />
  );
}
