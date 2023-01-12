import React from 'react';
import { useOutletContext } from 'react-router';

import { filterArray } from '../../utils/types';
import { group } from '../../utils/utils';
import { useRoutePart } from '../Router/useRoutePart';
import { TableList } from '../SchemaConfig/Tables';
import type { FormatterTypesOutlet } from './Types';

export function FormatterTablesList(): JSX.Element {
  const [_, setTableName] = useRoutePart('tableName');
  const {
    items: [items],
  } = useOutletContext<FormatterTypesOutlet>();
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
      getAction={({ name }) =>
        () =>
          setTableName(name)}
    >
      {({ name }): string | undefined =>
        grouped[name] === undefined ? undefined : `(${grouped[name].length})`
      }
    </TableList>
  );
}
