import React from 'react';
import { useOutletContext } from 'react-router';

import { filterArray } from '../../utils/types';
import { group } from '../../utils/utils';
import { formatNumber } from '../Atoms/Internationalization';
import { TableList } from '../SchemaConfig/Tables';
import type { FormatterTypesOutlet } from './Types';
import { resolveRelative } from '../Router/queryString';

export function FormatterTablesList(): JSX.Element {
  const {
    items: [items],
  } = useOutletContext<FormatterTypesOutlet>();
  const grouped = Object.fromEntries(
    group(
      filterArray(
        items.map((item) =>
          item.table === undefined ? undefined : [item.table.name, item]
        )
      )
    )
  );
  return (
    <TableList
      cacheKey="appResources"
      getAction={({ name }): string => resolveRelative(`./${name}`)}
    >
      {({ name }): string | undefined =>
        grouped[name] === undefined
          ? undefined
          : `(${formatNumber(grouped[name].length)})`
      }
    </TableList>
  );
}
