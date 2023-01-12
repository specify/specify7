import React from 'react';
import { Aggregator, Formatter } from './spec';
import { useRoutePart } from '../Router/useRoutePart';
import { useOutletContext } from 'react-router';
import { FormatterTypesOutlet } from './Types';
import { strictGetModel } from '../DataModel/schema';

export function FormatterList<T extends Aggregator | Formatter>(): JSX.Element {
  const [tableName, setTableName] = useRoutePart('tableName');
  const {
    items: [items, setItems],
  } = useOutletContext<FormatterTypesOutlet>();
  return (
    <div>
      <h4>{strictGetModel(tableName).name}</h4>
    </div>
  );
}
