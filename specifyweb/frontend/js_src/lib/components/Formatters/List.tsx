import React from 'react';
import { useRoutePart } from '../Router/useRoutePart';
import { useOutletContext } from 'react-router';
import { FormatterTypesOutlet } from './Types';
import { strictGetModel } from '../DataModel/schema';
import { Ul } from '../Atoms';

export function FormatterList(): JSX.Element {
  const [tableName, setTableName] = useRoutePart('tableName');
  const {
    items: [items, setItems],
  } = useOutletContext<FormatterTypesOutlet>();
  return (
    <>
      <h4>{strictGetModel(tableName).name}</h4>
      <Ul className="flex flex-1 flex-col gap-1 overflow-y-auto"></Ul>
    </>
  );
}
