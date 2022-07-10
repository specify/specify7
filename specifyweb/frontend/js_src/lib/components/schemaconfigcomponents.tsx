import React from 'react';

import { commonText } from '../localization/common';
import { queryText } from '../localization/query';
import type { IR, RA } from '../types';
import { Button, H2, Select } from './basic';
import type { SchemaData } from './schemaconfigsetuphooks';

export function SchemaConfigHeader({
  languages,
  language,
  onBack: handleBack,
  onSave: handleSave,
}: {
  readonly languages: SchemaData['languages'];
  readonly language: string;
  readonly onBack: () => void;
  readonly onSave: (() => void) | undefined;
}): JSX.Element {
  return (
    <header className="gap-x-2 flex">
      <H2>
        {commonText('schemaConfig')} (
        {languages[language]?.replaceAll(/[()]/g, '') ?? language})
      </H2>
      <Button.Small onClick={handleBack}>
        {commonText('changeBaseTable')}
      </Button.Small>
      <span className="flex-1 -ml-2" />
      <Button.Small onClick={handleSave}>{commonText('save')}</Button.Small>
    </header>
  );
}

export function PickList({
  label,
  value,
  groups,
  disabled = false,
  onChange: handleChange,
  className,
}: {
  readonly label?: string;
  readonly value: string | null;
  readonly groups: IR<RA<Readonly<[string, string]>> | IR<string>>;
  readonly disabled?: boolean;
  readonly onChange: (value: string | null) => void;
  readonly className?: string;
}): JSX.Element {
  return (
    <Select
      className={className}
      aria-label={label}
      value={value ?? '0'}
      disabled={disabled}
      onValueChange={(value): void =>
        handleChange(value === '0' ? null : value)
      }
    >
      {Object.keys(groups).length === 0 ? (
        <option value="0" disabled>
          {commonText('noneAvailable')}
        </option>
      ) : (
        <>
          <option value="0">{commonText('none')}</option>
          {/*
           * If current value is not present in the list, add it, and mark as
           * invalid
           */}
          {typeof value !== 'string' ||
          Object.values(groups)
            .flatMap((group) =>
              Array.isArray(group)
                ? group.map(([name]) => name)
                : Object.values(group)
            )
            .includes(value) ? undefined : (
            <option value={value}>{`${queryText(
              'invalidPicklistValue',
              value
            )}`}</option>
          )}
          {Object.keys(groups).length === 1 ? (
            <Values values={Object.values(groups)[0]} />
          ) : (
            Object.entries(groups).map(([label, values], index) => (
              <optgroup key={index} label={label}>
                <Values values={values} />
              </optgroup>
            ))
          )}
          {}
        </>
      )}
    </Select>
  );
}

function Values({
  values,
}: {
  readonly values: RA<Readonly<[string, string]>> | IR<string>;
}): JSX.Element {
  return (
    <>
      {Array.isArray(values)
        ? values.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))
        : Object.entries(values).map(([value, label]) => (
            <option key={value} value={value}>
              {label || value}
            </option>
          ))}
    </>
  );
}
