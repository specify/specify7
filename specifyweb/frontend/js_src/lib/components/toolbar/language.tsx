/**
 * Change current UI language
 */

import React from 'react';

import { ajax } from '../../ajax';
import { ping } from '../../ping';
import { formData } from '../../ajaxUtils';
import { csrfToken } from '../../csrftoken';
import { f } from '../../functools';
import { sortFunction } from '../../helpers';
import { cachableUrl } from '../../initialcontext';
import { commonText } from '../../localization/common';
import type { Language } from '../../localization/utils';
import { enabledLanguages, LANGUAGE } from '../../localization/utils';
import type { IR, RA } from '../../types';
import { Select } from '../basic';
import { fail, supportLink } from '../errorboundary';
import { useAsyncState } from '../hooks';
import { Dialog, dialogClassNames } from '../modaldialog';
import type { PreferenceItem, PreferenceItemComponent } from '../preferences';
import { PreferencesContext, prefEvents } from '../preferenceshooks';

export const handleLanguageChange = async (language: Language): Promise<void> =>
  ping('/context/language/', {
    method: 'POST',
    body: formData({
      language,
      csrfmiddlewaretoken: csrfToken,
    }),
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
      {showSupportDialog && (
        <Dialog
          buttons={commonText('close')}
          className={{
            container: dialogClassNames.narrowContainer,
          }}
          header={commonText('helpLocalizeSpecify')}
          onClose={(): void => setShowSupportDialog(false)}
        >
          <p>{commonText('helpLocalizeSpecifyDialogText', supportLink)}</p>
        </Dialog>
      )}
      {typeof languages === 'object' ? (
        <Select
          aria-label={commonText('language')}
          disabled={isReadOnly}
          value={value}
          onChange={({ target }): void =>
            target.value === 'supportLocalization'
              ? setShowSupportDialog(true)
              : handleChange(target.value as LANGUAGES)
          }
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
  function LanguagePreferencesItem({ isReadOnly, definition }) {
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
      false
    );
    const [language, setLanguage] = React.useState(LANGUAGE);

    /**
     * When editing someone else's user preferences, disable the language
     * selector, since language preference is stored in session storage.
     */
    const isRedirecting = React.useContext(PreferencesContext) !== undefined;
    return (
      <LanguageSelection<Language>
        isReadOnly={isReadOnly || isRedirecting || languages === undefined}
        languages={languages ?? { loading: commonText('loading') }}
        value={language}
        onChange={(language): void => {
          /*
           * This component does not actually save the current language into
           * preferences but immediately sends it to the back-end.
           * This is why it has an independent state and manually triggers
           * save button
           */
          handleLanguageChange(language).catch(fail);
          setLanguage(language);
          prefEvents.trigger('update', definition as PreferenceItem<unknown>);
        }}
      />
    );
  };

export function useSchemaLanguages(
  loadingScreen: boolean
): IR<string> | undefined {
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
                    country === null || country === '' ? '' : `-${country}`
                  }`
              )
            )
          )
          .then((languages) =>
            // Get translated language names
            Object.fromEntries(
              languages
                .map(
                  (language) =>
                    [
                      language,
                      new Intl.DisplayNames(LANGUAGE, { type: 'language' }).of(
                        language
                      ) ?? language,
                    ] as const
                )
                .sort(sortFunction(([_code, localized]) => localized))
            )
          ),
      []
    ),
    loadingScreen
  );
  return languages;
}

export const SchemaLanguagePreferenceItem: PreferenceItemComponent<string> =
  function SchemaLanguagePreferenceItem({
    value,
    onChange: handleChange,
    isReadOnly,
  }) {
    const languages = useSchemaLanguages(false);
    return (
      <LanguageSelection<string>
        isReadOnly={isReadOnly || languages === undefined}
        languages={languages ?? { loading: commonText('loading') }}
        value={value}
        onChange={handleChange}
      />
    );
  };
