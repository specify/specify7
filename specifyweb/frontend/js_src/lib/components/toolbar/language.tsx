/**
 * Change current UI language
 */

import React from 'react';

import { ajax, ping } from '../../ajax';
import { csrfToken } from '../../csrftoken';
import { f } from '../../functools';
import { cachableUrl } from '../../initialcontext';
import { commonText } from '../../localization/common';
import type { Language } from '../../localization/utils';
import { enabledLanguages, LANGUAGE } from '../../localization/utils';
import type { PreferenceItemComponent } from '../preferences';
import type { IR, RA } from '../../types';
import { Select } from '../basic';
import { supportLink } from '../errorboundary';
import { useAsyncState } from '../hooks';
import { Dialog, dialogClassNames } from '../modaldialog';

export const handleLanguageChange = async (language: Language): Promise<void> =>
  ping('/context/language/', {
    method: 'POST',
    body: {
      language,
      csrfmiddlewaretoken: csrfToken,
    },
  }).then(f.void);

export function LanguageSelection<LANGUAGES extends string>({
  value,
  languages,
  onChange: handleChange,
  isReadOnly = false,
}: {
  readonly value: LANGUAGES;
  readonly languages: IR<string> | undefined;
  readonly onChange: (language: LANGUAGES) => void;
  readonly isReadOnly?: boolean;
}): JSX.Element {
  const [showSupportDialog, setShowSupportDialog] = React.useState(false);

  return (
    <>
      {showSupportDialog ? (
        <Dialog
          header={commonText('helpLocalizeSpecify')}
          onClose={(): void => setShowSupportDialog(false)}
          buttons={commonText('close')}
          className={{
            container: dialogClassNames.narrowContainer,
          }}
        >
          <p>{commonText('helpLocalizeSpecifyDialogText')(supportLink)}</p>
        </Dialog>
      ) : typeof languages === 'object' ? (
        <Select
          aria-label={commonText('language')}
          value={value}
          onChange={({ target }): void =>
            target.value === 'supportLocalization'
              ? setShowSupportDialog(true)
              : handleChange(target.value as LANGUAGES)
          }
          disabled={isReadOnly}
        >
          {Object.entries(languages).map(([code, nameLocal]) => (
            <option key={code} value={code}>
              {nameLocal} ({code})
            </option>
          ))}
          <option value="supportLocalization">
            {commonText('helpLocalizeSpecify')}
          </option>
        </Select>
      ) : undefined}
    </>
  );
}

const url = cachableUrl('/context/language/');
export const LanguagePreferencesItem: PreferenceItemComponent<Language> =
  function LanguagePreferencesItem({
    value,
    onChange: handleChange,
    isReadOnly,
  }) {
    const [languages] = useAsyncState<IR<string>>(
      React.useCallback(
        async () =>
          ajax<
            RA<{
              // eslint-disable-next-line @typescript-eslint/naming-convention
              readonly name_local: string;
              readonly code: string;
            }>
          >(url, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { Accept: 'application/json' },
          }).then(({ data }) =>
            Object.fromEntries(
              Object.entries(data)
                .filter(([code]) => f.includes(enabledLanguages, code))
                // eslint-disable-next-line @typescript-eslint/naming-convention
                .map(([code, { name_local }]) => [code, name_local])
            )
          ),
        []
      ),
      true
    );
    return (
      <LanguageSelection<Language>
        languages={languages}
        value={value}
        onChange={handleChange}
        isReadOnly={isReadOnly}
      />
    );
  };

export function useSchemaLanguages(): IR<string> | undefined {
  const [languages] = useAsyncState<IR<string>>(
    React.useCallback(
      async () =>
        ajax<
          RA<{
            readonly country: string | null;
            readonly language: string;
          }>
        >('/context/schema/language/', {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'application/json' },
          cache: 'no-cache',
        })
          .then(({ data }) =>
            // Sometimes languages are duplicated. Need to make the list unique
            f.unique(
              data.map(
                ({ country, language }) =>
                  `${language}${
                    country === null || country === '' ? '' : `_${country}`
                  }`
              )
            )
          )
          .then((languages) =>
            // Get translated language names
            Object.fromEntries(
              languages.map(
                (language) =>
                  [
                    language,
                    new Intl.DisplayNames(LANGUAGE, { type: 'language' }).of(
                      language.replace('_', '-')
                    ) ?? language,
                  ] as const
              )
            )
          ),
      []
    ),
    true
  );
  return languages;
}

export const SchemaLanguagePreferenceItem: PreferenceItemComponent<string> =
  function SchemaLanguagePreferenceItem({
    value,
    onChange: handleChange,
    isReadOnly,
  }) {
    const languages = useSchemaLanguages();
    return (
      <LanguageSelection<string>
        languages={languages}
        value={value}
        onChange={handleChange}
        isReadOnly={isReadOnly}
      />
    );
  };
