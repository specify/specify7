import React from 'react';
import { FormattersContext } from './index';
import { useRoutePart } from '../Router/useRoutePart';
import { filterArray, GetSet, RA } from '../../utils/types';
import { SpecifyModel } from '../DataModel/specifyModel';
import { group } from '../../utils/utils';
import { TableList } from '../SchemaConfig/Tables';
import { Aggregator, Formatter } from './spec';

export function FormatterTable(): JSX.Element {
  const { element } = React.useContext(FormattersContext)!;
  const [type] = useRoutePart('type');
  const [table, setTable] = useRoutePart('tableName');

  return (
    <Items
      component={FormatterElement}
      items={[
        parsed.formatters,
        (formatters): void =>
          setParsed({
            ...parsed,
            formatters,
          }),
      ]}
    />
  );
}

function Items<T extends Aggregator | Formatter>({
  items: [items, setItems],
  component,
}: {
  readonly items: GetSet<RA<T>>;
  readonly isReadOnly: boolean;
  readonly component: (props: {
    readonly item: GetSet<T>;
    readonly isReadOnly: boolean;
  }) => JSX.Element;
}): JSX.Element {
  const [table, setTable] = React.useState<SpecifyModel | undefined>(undefined);
  return table === undefined ? (
    <TablesList items={items} onChange={setTable} />
  ) : (
    <List
      component={component}
      items={[items, setItems]}
      table={table}
      onChangeTable={(): void => setTable(undefined)}
    />
  );
}

function TablesList<T extends Aggregator | Formatter>({
  items,
  onChange: handleChange,
}: {
  readonly items: RA<T>;
  readonly onChange: (model: SpecifyModel) => void;
}): JSX.Element {
  const grouped = Object.fromEntries(
    group(
      filterArray(
        items.map((item) =>
          item.tableName === undefined ? undefined : [item.tableName, item]
        )
      )
    )
  );
  return (
    <TableList
      cacheKey="appResources"
      getAction={(model) => () => handleChange(model)}
    >
      {({ name }): string | undefined =>
        grouped[name] === undefined ? undefined : `(${grouped[name].length})`
      }
    </TableList>
  );
}
