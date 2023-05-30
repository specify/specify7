import React from 'react';
import { useOutletContext } from 'react-router';
import { useParams } from 'react-router-dom';

import { resourcesText } from '../../localization/resources';
import { filterArray } from '../../utils/types';
import { group } from '../../utils/utils';
import { formatNumber } from '../Atoms/Internationalization';
import { resolveRelative } from '../Router/queryString';
import { TableList } from '../SchemaConfig/Tables';
import type { FormatterTypesOutlet } from './Types';

export function FormatterTablesList(): JSX.Element {
  const { type } = useParams();
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
    <>
      <p>
        {type === 'formatter'
          ? resourcesText.formatterDescription()
          : resourcesText.aggregatorDescription()}
      </p>
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
