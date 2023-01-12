import { SpecifyModel } from '../DataModel/specifyModel';
import { GetSet, RA } from '../../utils/types';
import React from 'react';
import { Aggregator } from './dataObjFormatters';

export function FormatterList<T extends Aggregator | Formatter>({
  table,
  items: [items, setItems],
  component,
  isReadOnly,
  onChangeTable: handleChangeTable,
}: {
  readonly table: SpecifyModel;
  readonly items: GetSet<RA<T>>;
  readonly component: (props: {
    readonly item: GetSet<T>;
    readonly isReadOnly: boolean;
  }) => JSX.Element;
  readonly isReadOnly: boolean;
  readonly onChangeTable: () => void;
}): JSX.Element {
  return (
    <div>
      <h4>{table.name}</h4>
    </div>
  );
}
