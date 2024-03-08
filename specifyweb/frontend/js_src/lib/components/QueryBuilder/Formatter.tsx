import React from 'react';

import { usePromise } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { Button } from '../Atoms/Button';
import { Select } from '../Atoms/Form';
import type { Tables } from '../DataModel/types';
import { fetchFormatters } from '../Formatters/formatters';

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
        ? formatters?.formatters.map(({ table, name, title, isDefault }) => ({
            table,
            name,
            title,
            isDefault,
          }))
        : formatters?.aggregators.map(({ table, name, title, isDefault }) => ({
            table,
            name,
            title,
            isDefault,
          }))
      )
        ?.filter(({ table }) => table?.name === tableName)
        .map(({ name, title = name, isDefault }) => ({
          name,
          title,
          isDefault,
        })),
    [type, formatters, tableName]
  );

  const [formatterSelectIsOpen, toggleFormatterSelect] = React.useState(false);

  return availableFormatters === undefined ? (
    typeof formatter === 'string' ? (
      <>{commonText.loading()}</>
    ) : null
  ) : availableFormatters.length > 1 ? (
    <>
      <Button.Icon
        className={`${
          availableFormatters.find((selected) => selected.name === formatter)
            ?.isDefault
            ? ''
            : 'bg-yellow-250 dark:bg-yellow-900 '
        } border border-gray-500 p-0.5`}
        icon="cog"
        title={queryText.chooseFormatter()}
        onClick={() => toggleFormatterSelect(!formatterSelectIsOpen)}
      />
      {formatterSelectIsOpen && (
        <div>
          <Select
            disabled={handleChange === undefined}
            value={formatter}
            onValueChange={(value) => {
              handleChange?.(value);
              toggleFormatterSelect(!formatterSelectIsOpen);
            }}
          >
            <option />
            {availableFormatters.map(({ name, title }, index) => (
              <option key={index} value={name}>
                {title}
              </option>
            ))}
          </Select>
        </div>
      )}
    </>
  ) : null;
}
