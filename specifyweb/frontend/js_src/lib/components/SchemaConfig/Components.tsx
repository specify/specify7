import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { schemaText } from '../../localization/schema';
import type { IR, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Select } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { formatUrl } from '../Router/queryString';
import type { SchemaData } from './schemaData';

export function SchemaConfigHeader({
  languages,
  rawLanguage,
  onSave: handleSave,
  onImport: handleImport,
  importDisabled = false,
}: {
  readonly languages: SchemaData['languages'];
  readonly rawLanguage: string;
  readonly onSave: (() => void) | undefined;
  readonly onImport?: (file: File) => void;
  readonly importDisabled?: boolean;
}): JSX.Element {
  const [language] = rawLanguage.split('-');
  const importInput = React.useRef<HTMLInputElement | null>(null);
  return (
    <header className="flex gap-2">
      <H2 className="flex items-center">
        {localized(
          `${schemaText.schemaConfig()} (${
            languages[language]?.replaceAll(/[()]/gu, '') ?? language
          })`
        )}
      </H2>
      <Link.Small
        download={`schema_localization_${rawLanguage}.json`}
        href={formatUrl('/context/schema_localization.json', {
          lang: rawLanguage,
        })}
      >
        {commonText.export()}
      </Link.Small>
      {handleImport !== undefined && (
        <>
          <input
            ref={importInput}
            accept=".json,application/json"
            className="sr-only"
            disabled={importDisabled}
            type="file"
            onChange={(event): void => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file !== undefined) handleImport(file);
            }}
          />
          <Button.Small
            disabled={importDisabled}
            onClick={(): void => importInput.current?.click()}
          >
            {schemaText.importSchema()}
          </Button.Small>
        </>
      )}
      <span className="-ml-2 flex-1" />
      <Button.Small variant={className.saveButton} onClick={handleSave}>
        {commonText.save()}
      </Button.Small>
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
  readonly label?: LocalizedString;
  readonly value: string | null;
  readonly groups: IR<IR<string> | RA<readonly [name: string, title: string]>>;
  readonly disabled?: boolean;
  readonly onChange: (value: string | null) => void;
  readonly className?: string;
}): JSX.Element {
  return (
    <Select
      aria-label={label}
      className={className}
      disabled={disabled}
      value={value ?? ''}
      onValueChange={(value): void => handleChange(value === '' ? null : value)}
    >
      {Object.keys(groups).length === 0 ? (
        <option disabled value="">
          {commonText.noneAvailable()}
        </option>
      ) : (
        <>
          <option value="">{commonText.none()}</option>
          {/*
           * If current value is not present in the list, add it, and mark as
           * invalid
           */}
          {typeof value !== 'string' ||
          Object.values(groups)
            .flatMap((group) =>
              Array.isArray(group)
                ? group.map(([name]) => name)
                : Object.keys(group)
            )
            .includes(value) ? undefined : (
            <option value={value}>{`${queryText.invalidPicklistValue({
              value,
            })}`}</option>
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
        </>
      )}
    </Select>
  );
}

function Values({
  values,
}: {
  readonly values: IR<string> | RA<readonly [value: string, label: string]>;
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
