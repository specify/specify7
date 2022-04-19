import React from 'react';

import { commonText } from '../localization/common';
import { queryText } from '../localization/query';
import type { IR, RA } from '../types';
import { Button, Form, Input, Label, Select, Submit } from './basic';
import { useId } from './hooks';
import { Dialog } from './modaldialog';

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
              Array.isArray(group) ? group[0] : Object.values(group)
            )
            .includes(value) ? undefined : (
            <option value={value}>{`${queryText('invalidPicklistValue')(
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

export function AddLanguage({
  onClose: handleClose,
  onGoBack: handleGoBack,
  onAddLanguage: handleAddLanguage,
}: {
  readonly onClose: () => void;
  readonly onGoBack: () => void;
  readonly onAddLanguage: (language: string) => void;
}): JSX.Element {
  const id = useId('schema-config-add-language');
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [language, setLanguage] = React.useState<string>('');
  const [country, setCountry] = React.useState<string>('');
  return (
    <Dialog
      title={commonText('addLanguageDialogTitle')}
      header={commonText('addLanguageDialogHeader')}
      onClose={handleClose}
      buttons={
        <>
          <Button.Transparent onClick={handleGoBack}>
            {commonText('back')}
          </Button.Transparent>
          <Submit.Blue form={id('form')}>{commonText('add')}</Submit.Blue>
        </>
      }
    >
      <Form
        className="contents"
        forwardRef={formRef}
        id={id('form')}
        onSubmit={(): void =>
          handleAddLanguage(
            `${language.toLowerCase()}${
              country === '' ? '' : `_${country.toUpperCase()}`
            }`
          )
        }
      >
        <Label.Generic>
          {commonText('language')}
          <Input.Text
            required
            minLength={2}
            maxLength={2}
            placeholder="en"
            value={language}
            onValueChange={setLanguage}
          />
        </Label.Generic>
        <Label.Generic>
          {commonText('country')}
          <Input.Text
            minLength={2}
            maxLength={2}
            placeholder="US"
            value={country}
            onValueChange={setCountry}
          />
        </Label.Generic>
      </Form>
    </Dialog>
  );
}
