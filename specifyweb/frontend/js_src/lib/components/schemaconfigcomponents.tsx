import React from 'react';

import commonText from '../localization/common';
import { ModalDialog } from './modaldialog';
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

export function AddLanguage({
  handleClose,
  handleGoBack,
  handleAddLanguage,
}: {
  readonly handleClose: () => void;
  readonly handleGoBack: () => void;
  readonly handleAddLanguage: (language: string) => void;
}): JSX.Element {
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [language, setLanguage] = React.useState<string>('');
  const [country, setCountry] = React.useState<string>('');
  const [addLanguage, setAddLanguage] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (addLanguage)
      handleAddLanguage(
        `${language.toLowerCase()}${
          country === '' ? '' : `_${country.toUpperCase()}`
        }`
      );
  }, [language, country, addLanguage]);
  return (
    <ModalDialog
      className="schema-config"
      properties={{
        title: commonText('addLanguageDialogTitle'),
        close: handleClose,
        buttons: [
          {
            text: commonText('back'),
            click: handleGoBack,
          },
          {
            text: commonText('add'),
            click(): void {
              if (formRef.current?.reportValidity() === true)
                setAddLanguage(true);
            },
          },
        ],
      }}
    >
      <form ref={formRef}>
        {commonText('addLanguageDialogHeader')}
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
    </ModalDialog>
  );
}
