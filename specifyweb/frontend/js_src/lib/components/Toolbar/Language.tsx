/**
 * Change current UI language
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { StringToJsx } from '../../localization/utils';
import type { Language } from '../../localization/utils/config';
import {
  completeLanguages,
  devLanguage,
  devLanguages,
  LANGUAGE,
  languages,
} from '../../localization/utils/config';
import { ajax } from '../../utils/ajax';
import { csrfToken } from '../../utils/ajax/csrfToken';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Select } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import { raise } from '../Errors/Crash';
import { cacheableUrl } from '../InitialContext';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import type {
  PreferenceItem,
  PreferenceRendererProps,
} from '../Preferences/types';
import { userPreferences } from '../Preferences/userPreferences';
import { formatUrl } from '../Router/queryString';
import { languageSeparator } from '../SchemaConfig/Languages';

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
  showDevLanguages: showDevelopmentLanguages = process.env.NODE_ENV ===
    'development',
  // Whether the language picker is for the UI language (rather than schema)
  isForInterface,
}: {
  readonly value: LANGUAGES;
  readonly languages: IR<string> | undefined;
  readonly onChange: (language: LANGUAGES) => void;
  readonly showDevLanguages?: boolean;
  readonly isForInterface: boolean;
}): JSX.Element {
  const [showSupportDialog, setShowSupportDialog] = React.useState(false);
  const [warningLanguage, setWarningLanguage] = React.useState<
    LANGUAGES | undefined
  >(undefined);

  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <>
      {showSupportDialog && (
        <Dialog
          buttons={commonText.close()}
          className={{
            container: dialogClassNames.narrowContainer,
          }}
          header={headerText.helpLocalizeSpecify()}
          onClose={(): void => setShowSupportDialog(false)}
        >
          <p>
            <StringToJsx
              components={{
                link: (label) => (
                  <Link.NewTab href="https://discourse.specifysoftware.org/t/get-started-with-specify-7-localization/956">
                    {label}
                  </Link.NewTab>
                ),
              }}
              string={headerText.helpLocalizeSpecifyDescription()}
            />
          </p>
        </Dialog>
      )}
      {typeof warningLanguage === 'string' && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Info
                onClick={(): void => {
                  handleChange(warningLanguage);
                  setWarningLanguage(undefined);
                }}
              >
                {commonText.proceed()}
              </Button.Info>
            </>
          }
          className={{
            container: dialogClassNames.narrowContainer,
          }}
          header={headerText.incompleteLocalization()}
          onClose={(): void => setWarningLanguage(undefined)}
        >
          <p>
            <StringToJsx
              components={{
                link: (label) => (
                  <Link.NewTab href="https://discourse.specifysoftware.org/t/get-started-with-specify-7-localization/956">
                    {label}
                  </Link.NewTab>
                ),
              }}
              string={headerText.incompleteLocalizationDescription()}
            />
          </p>
        </Dialog>
      )}
      {typeof languages === 'object' ? (
        <Select
          disabled={isReadOnly}
          value={value}
          onValueChange={(value: string): void =>
            value === 'supportLocalization'
              ? setShowSupportDialog(true)
              : !isForInterface || f.has(completeLanguages, value)
                ? handleChange(value as LANGUAGES)
                : setWarningLanguage(value as LANGUAGES)
          }
        >
          {Object.entries(languages).map(([code, nameLocal]) => (
            <option key={code} value={code}>
              {`${nameLocal} (${code}) ${
                !isForInterface || f.has(completeLanguages, code)
                  ? ''
                  : headerText.incompleteInline()
              }`}
            </option>
          ))}
          {isForInterface && (
            <option value="supportLocalization">
              {headerText.helpLocalizeSpecify()}
            </option>
          )}
          {showDevelopmentLanguages && (
            <optgroup label="Development languages">
              {Object.entries(devLanguages).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </optgroup>
          )}
        </Select>
      ) : undefined}
    </>
  );
}

const url = cacheableUrl(
  formatUrl('/context/language/', {
    languages: languages.join(','),
  })
);

export function LanguagePreferencesItem({
  definition,
  category,
  subcategory,
  item,
}: PreferenceRendererProps<Language>): JSX.Element {
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
          headers: { Accept: 'application/json' },
        }).then(({ data }) =>
          Object.fromEntries(
            Object.entries(data)
              // eslint-disable-next-line @typescript-eslint/naming-convention
              .map(([code, { name_local }]) => [code, name_local])
          )
        ),
      []
    ),
    false
  );
  const [language, setLanguage] = React.useState(
    (devLanguage as Language) ?? LANGUAGE
  );

  /**
   * When editing someone else's user preferences, disable the language
   * selector, since language preference is stored in session storage.
   */
  const isRedirecting = React.useContext(userPreferences.Context) !== undefined;
  const isReadOnly =
    React.useContext(ReadOnlyContext) ||
    isRedirecting ||
    languages === undefined;
  return (
    <ReadOnlyContext.Provider value={isReadOnly}>
      <LanguageSelection<Language>
        isForInterface
        languages={languages ?? { loading: commonText.loading() }}
        value={language}
        onChange={(language): void => {
          /*
           * This component does not actually save the current language into
           * preferences but immediately sends it to the back-end.
           * This is why it has an independent state and manually triggers
           * save button
           */
          handleLanguageChange(language).catch(raise);
          setLanguage(language);
          userPreferences.events.trigger('update', {
            category,
            subcategory,
            item,
            definition: definition as PreferenceItem<unknown>,
          });
        }}
      />
    </ReadOnlyContext.Provider>
  );
}

export function SchemaLanguagePreferenceItem({
  value,
  onChange: handleChange,
}: PreferenceRendererProps<string>): JSX.Element {
  const languages = useSchemaLanguages(false);
  const isReadOnly =
    React.useContext(ReadOnlyContext) || languages === undefined;
  return (
    <ReadOnlyContext.Provider value={isReadOnly}>
      <LanguageSelection<string>
        isForInterface={false}
        languages={languages ?? { loading: commonText.loading() }}
        showDevLanguages={false}
        value={value}
        onChange={handleChange}
      />
    </ReadOnlyContext.Provider>
  );
}

export function useSchemaLanguages(
  loadingScreen: boolean
): IR<LocalizedString> | undefined {
  const [languages] = useAsyncState<IR<LocalizedString>>(
    fetchSchemaLanguages,
    loadingScreen
  );
  return languages;
}

export const fetchSchemaLanguages = async (): Promise<IR<LocalizedString>> =>
  ajax<
    RA<{
      readonly country: string | null;
      readonly language: string;
    }>
  >('/context/schema/language/', {
    headers: { Accept: 'application/json' },
    cache: 'no-cache',
  })
    .then(({ data }) =>
      // Sometimes languages are duplicated. Need to make the list unique
      f.unique(
        data.map(
          ({ country, language }) =>
            `${language}${
              country === null || country === ''
                ? ''
                : `${languageSeparator}${country}`
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
                localized(
                  new Intl.DisplayNames(LANGUAGE, { type: 'language' }).of(
                    language
                  ) ?? language
                ),
              ] as const
          )
          .sort(sortFunction(([_code, localized]) => localized))
      )
    );
