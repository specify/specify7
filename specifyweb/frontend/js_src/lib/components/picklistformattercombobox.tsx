import React from 'react';

import { fetchFormatters } from '../dataobjformatters';
import { getModel } from '../schema';
import type { RA } from '../types';
import { defined } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { PickListTypes } from './combobox';
import { crash } from './errorboundary';
import { useAsyncState } from './hooks';
import { PickListComboBox } from './picklist';

export function PickListFormatterComboBox(
  props: DefaultComboBoxProps
): JSX.Element {
  const fetchItems = React.useCallback(async () => {
    if (props.resource.get('type') === PickListTypes.ITEMS) return [];
    const { formatters } = await fetchFormatters;
    const model = defined(getModel(props.resource.get('tableName')));
    return formatters
      .filter(({ className }) => className === model.longName)
      .map(({ name, title }) => ({
        value: name ?? title ?? '',
        title: title ?? name ?? '',
      }));
  }, [props.resource]);
  const [items, setItems] = useAsyncState<RA<PickListItemSimple>>(fetchItems);
  React.useEffect(() => {
    props.resource.on('change:tableName change:type', async () =>
      fetchItems().then(setItems).catch(crash)
    );
  }, [props.resource, fetchItems]);

  return (
    <PickListComboBox
      {...props}
      items={items}
      fieldName="fieldName"
      onAdd={undefined}
      pickList={undefined}
      disabled={
        props.disabled || typeof items === 'undefined' || items.length === 0
      }
    />
  );
}
