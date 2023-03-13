import React from 'react';

import type { RA } from '../../utils/types';
import { resourceOn } from '../DataModel/resource';
import type {
  DefaultComboBoxProps,
  PickListItemSimple,
} from '../FormFields/ComboBox';
import { pickListTablesPickList, PickListTypes } from './definitions';
import { getPickListItems } from './fetch';
import { PickListComboBox } from './index';

export function TablesPickList(
  props: DefaultComboBoxProps
): JSX.Element | null {
  const getItems = React.useCallback(
    () =>
      props.resource?.get('type') === PickListTypes.ITEMS
        ? []
        : getPickListItems(pickListTablesPickList()),
    [props.resource, props.field]
  );
  const [items, setItems] = React.useState<RA<PickListItemSimple>>([]);
  React.useEffect(
    () =>
      props.resource === undefined
        ? undefined
        : resourceOn(
            props.resource,
            'change:type',
            (): void => {
              if (props.resource === undefined) return;
              if (props.resource.get('type') === PickListTypes.ITEMS)
                props.resource.set('tableName', null as never);
              setItems(getItems());
            },
            true
          ),
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
