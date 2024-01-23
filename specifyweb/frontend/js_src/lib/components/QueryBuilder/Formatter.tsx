import React from 'react';

import { usePromise } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { Select } from '../Atoms/Form';
import type { Tables } from '../DataModel/types';
import { fetchFormatters } from '../Formatters/formatters';
import { mappingElementDivider } from '../WbPlanView/LineComponents';

export function QueryFieldFormatter({
  type,
  tableName,
  formatter,
  onChange: handleChange,
}: {
  readonly type: 'aggregator' | 'formatter';
  readonly tableName: keyof Tables;
  readonly formatter: string | undefined;
  readonly onChange: ((formatter: string | undefined) => void) | undefined;
}): JSX.Element | null {
  const [formatters] = usePromise(fetchFormatters, false);
  const availableFormatters = React.useMemo(
    () =>
      // Some code duplication, but required by TypeScript
      (type === 'formatter'
        ? formatters?.formatters.map(({ table, name, title }) => ({
            table,
            name,
            title,
          }))
        : formatters?.aggregators.map(({ table, name, title }) => ({
            table,
            name,
            title,
          }))
      )
        ?.filter(({ table }) => table?.name === tableName)
        .map(({ name, title = name }) => ({ name, title })),
    [type, formatters, tableName]
  );
  return availableFormatters === undefined ? (
    typeof formatter === 'string' ? (
      <>{commonText.loading()}</>
    ) : null
  ) : availableFormatters.length > 1 ? (
    <>
      {mappingElementDivider}
      <div>
        <Select
          disabled={handleChange === undefined}
          value={formatter}
          onValueChange={handleChange}
        >
          <option />
          {availableFormatters.map(({ name, title }, index) => (
            <option key={index} value={name}>
              {title}
            </option>
          ))}
        </Select>
      </div>
    </>
  ) : null;
}
