import React from 'react';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import type { IR, RA } from '../../utils/types';
import type { SchemaData } from './SetupHooks';
import { useNavigate } from 'react-router-dom';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Select } from '../Atoms/Form';
import { schemaText } from '../../localization/schema';

export function SchemaConfigHeader({
  languages,
  language,
  onSave: handleSave,
}: {
  readonly languages: SchemaData['languages'];
  readonly language: string;
  readonly onSave: (() => void) | undefined;
}): JSX.Element {
  const navigate = useNavigate();
  return (
    <header className="flex gap-2">
      <H2 className="flex items-center">
        {schemaText.schemaConfig()} (
        {languages[language]?.replaceAll(/[()]/g, '') ?? language})
      </H2>
      <Button.Small
        onClick={(): void => navigate(`/specify/schema-config/${language}/`)}
      >
        {schemaText.changeBaseTable()}
      </Button.Small>
      <span className="-ml-2 flex-1" />
      <Button.Small onClick={handleSave}>{commonText.save()}</Button.Small>
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
  readonly groups: IR<IR<string> | RA<readonly [string, string]>>;
  readonly disabled?: boolean;
  readonly onChange: (value: string | null) => void;
  readonly className?: string;
}): JSX.Element {
  return (
    <Select
      aria-label={label}
      className={className}
      disabled={disabled}
      value={value ?? '0'}
      onValueChange={(value): void =>
        handleChange(value === '0' ? null : value)
      }
    >
      {Object.keys(groups).length === 0 ? (
        <option disabled value="0">
          {commonText.noneAvailable()}
        </option>
      ) : (
        <>
          <option value="0">{commonText.none()}</option>
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
            <option value={value}>{`${queryText.invalidPicklistValue(
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
  readonly values: IR<string> | RA<readonly [string, string]>;
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
