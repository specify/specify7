import React from 'react';
import { useOutletContext } from 'react-router';

import { formatNumber } from '../Atoms/Internationalization';
import type { Tables } from '../DataModel/types';
import { resolveRelative } from '../Router/queryString';
import { TableList } from '../SchemaConfig/Tables';
import type { FormEditorOutlet } from './index';

export function FormEditorList(): JSX.Element {
  const {
    viewSets: [viewSets],
  } = useOutletContext<FormEditorOutlet>();
  const counts = React.useMemo(
    () =>
      viewSets.views.reduce<Partial<Record<keyof Tables, number>>>(
        (total, { table }) => {
          if (table === undefined) return total;
          total[table.name] ??= 0;
          total[table.name]! += 1;
          return total;
        },
        {}
      ),
    [viewSets.views]
  );
  return (
    <TableList
      cacheKey="appResources"
      getAction={({ name }): string => resolveRelative(`./${name}`)}
    >
      {({ name }): string | undefined =>
        counts[name] === undefined
          ? undefined
          : `(${formatNumber(counts[name]!)})`
      }
    </TableList>
  );
}
