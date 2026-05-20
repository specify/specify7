import React from 'react';

import { resourcesText } from '../../localization/resources';
import { filterArray } from '../../utils/types';
import { group } from '../../utils/utils';
import { formatNumber } from '../Atoms/Internationalization';
import { resolveRelative } from '../Router/queryString';
import { TableList } from '../SchemaConfig/Tables';
import { FieldFormattersContext } from './Editor';

export function FieldFormatterTablesList(): JSX.Element {
  const {
    parsed: [{ fieldFormatters }],
  } = React.useContext(FieldFormattersContext)!;

  const grouped = Object.fromEntries(
    group(
      filterArray(
        fieldFormatters.map((item) =>
          item.table === undefined ? undefined : [item.table.name, item]
        )
      )
    )
  );

  return (
    <>
      <p>{resourcesText.fieldFormattersDescription()}</p>
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
    </>
  );
}
