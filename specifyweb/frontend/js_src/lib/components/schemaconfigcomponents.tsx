import React from 'react';

import commonText from '../localization/common';
import type { IR, RA } from './wbplanview';

export function PickList({
  label,
  value,
  values,
  disabled = false,
  onChange: handleChange,
}: {
  readonly label?: string;
  readonly value: string | null;
  readonly values: RA<string> | IR<string>;
  readonly disabled?: boolean;
  readonly onChange: (value: string | null) => void;
}): JSX.Element {
  return (
    <select
      aria-label={label}
      value={value ?? '0'}
      disabled={disabled}
      onChange={({ target }): void =>
        handleChange(target.value === '0' ? null : target.value)
      }
    >
      {Object.keys(values).length === 0 ? (
        <option value="0" disabled>
          {commonText('noneAvailable')}
        </option>
      ) : (
        <>
          <option value="0">{commonText('none')}</option>
          {Array.isArray(values)
            ? (values as RA<string>).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))
            : Object.entries(values).map(([key, value]) => (
                <option key={key} value={key}>
                  {value || key}
                </option>
              ))}
        </>
      )}
    </select>
  );
}
