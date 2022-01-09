import React from 'react';

import commonText from '../localization/common';
import type { IR, RA } from '../types';
import { useId } from './hooks';
import { Dialog } from './modaldialog';
import { Submit, Button } from './basic';

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
  readonly groups: IR<RA<string> | IR<string>>;
  readonly disabled?: boolean;
  readonly onChange: (value: string | null) => void;
  readonly className?: string;
}): JSX.Element {
  return (
    <select
      className={className}
      aria-label={label}
      value={value ?? '0'}
      disabled={disabled}
      onChange={({ target }): void =>
        handleChange(target.value === '0' ? null : target.value)
      }
    >
      {Object.keys(groups).length === 0 ? (
        <option value="0" disabled>
          {commonText('noneAvailable')}
        </option>
      ) : (
        <>
          <option value="0">{commonText('none')}</option>
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
    </select>
  );
}

function Values({
  values,
}: {
  readonly values: RA<string> | IR<string>;
}): JSX.Element {
  return (
    <>
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
  );
}

export function AddLanguage({
  handleClose,
  handleGoBack,
  handleAddLanguage,
}: {
  readonly handleClose: () => void;
  readonly handleGoBack: () => void;
  readonly handleAddLanguage: (language: string) => void;
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
          <Submit.Blue key="button" form={id('form')}>
            {commonText('add')}
          </Submit.Blue>
        </>
      }
    >
      <form
        className="grid"
        ref={formRef}
        id={id('form')}
        onSubmit={(event): void => {
          event.preventDefault();
          handleAddLanguage(
            `${language.toLowerCase()}${
              country === '' ? '' : `_${country.toUpperCase()}`
            }`
          );
        }}
      >
        <label>
          {commonText('language')}
          <input
            type="text"
            required
            minLength={2}
            maxLength={2}
            placeholder="en"
            value={language}
            onChange={({ target }): void => setLanguage(target.value)}
          />
        </label>
        <label>
          {commonText('country')}
          <input
            type="text"
            minLength={2}
            maxLength={2}
            placeholder="US"
            value={country}
            onChange={({ target }): void => setCountry(target.value)}
          />
        </label>
      </form>
    </Dialog>
  );
}
