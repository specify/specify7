import React from 'react';

import type { RA } from '../../utils/types';
import { resourceOn } from '../DataModel/resource';
import { getTable } from '../DataModel/tables';
import type {
  DefaultComboBoxProps,
  PickListItemSimple,
} from '../FormFields/ComboBox';
import { PickListTypes } from './definitions';
import { PickListComboBox } from './index';

export function FieldsPickList(props: DefaultComboBoxProps): JSX.Element {
  const getItems = React.useCallback(
    () =>
      props.resource?.get('type') === PickListTypes.FIELDS
        ? (getTable(props.resource.get('tableName') ?? '')?.fields.map(
            (field) => ({
              value: field.name,
              title: field.label,
            })
          ) ?? [])
        : [],
    [props.resource]
  );
  const [items, setItems] = React.useState<RA<PickListItemSimple>>(getItems);
  React.useEffect(
    () =>
      props.resource === undefined
        ? undefined
        : resourceOn(
            props.resource,
            'change:tableName change:type',
            () => {
              if (props.resource === undefined) return;
              if (props.resource.get('type') !== PickListTypes.FIELDS)
                props.resource.set('fieldName', null as never);
              setItems(getItems);
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
