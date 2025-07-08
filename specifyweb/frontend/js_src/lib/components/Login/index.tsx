/**
 * The entrypoint for the login endpoint
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import type { Language } from '../../localization/utils/config';
import { devLanguage, LANGUAGE } from '../../localization/utils/config';
import { ajax } from '../../utils/ajax';
import { parseDjangoDump } from '../../utils/ajax/csrfToken';
import type { RA } from '../../utils/types';
import { ErrorMessage } from '../Atoms';
import { Form, Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { SplashScreen } from '../Core/SplashScreen';
import { handleLanguageChange, LanguageSelection } from '../Toolbar/Language';
import type { OicProvider } from './OicLogin';
import { OicLogin } from './OicLogin';

export function Login(): JSX.Element {
  const [isNewUser] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<boolean>(`/api/specify/is_new_user/`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          errorMode: 'silent',
        })
          .then(({ data }) => data)
          .catch((error) => {
            console.error('Failed to fetch isNewUser:', error);
            return undefined;
          }),
      []
    ),
    true
  );

  return React.useMemo(() => {
    const nextUrl = parseDjangoDump<string>('next-url') ?? '/specify/';
    const providers = parseDjangoDump<RA<OicProvider>>('providers') ?? [];

    if (isNewUser === true || isNewUser === undefined) {
      // Display here the new setup pages
      return <p>Welcome! No institutions are available at the moment.</p>;
    }

    return providers.length > 0 ? (
      <OicLogin
        data={{
          inviteToken: parseDjangoDump('invite-token') ?? '',
          providers,
          languages: parseDjangoDump('languages') ?? [],
          csrfToken: parseDjangoDump('csrf-token') ?? '',
        }}
        nextUrl={
          // REFACTOR: use parseUrl() and formatUrl() instead
          nextUrl.startsWith(nextDestination)
            ? nextUrl
            : `${nextDestination}${nextUrl}`
        }
      />
    ) : (
      <LegacyLogin
        data={{
          formErrors: parseDjangoDump('form-errors') ?? [],
          inputErrors: parseDjangoDump('input-errors') ?? [],
          externalUser: parseDjangoDump('external-user') ?? '',
          passwordErrors: parseDjangoDump('password-errors') ?? [],
          languages: parseDjangoDump('languages') ?? [],
          csrfToken: parseDjangoDump('csrf-token') ?? '',
        }}
        nextUrl={
          nextUrl.startsWith(nextDestination)
            ? nextUrl
            : `${nextDestination}${nextUrl}`
        }
      />
    );
  }, [isNewUser]);
}

const nextDestination = '/accounts/choose_collection/?next=';

export function LoginLanguageChooser({
  languages,
}: {
  readonly languages: RA<readonly [code: Language, name: string]>;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  return (
    <LanguageSelection<Language>
      isForInterface
      languages={Object.fromEntries(languages)}
      value={(devLanguage as Language) ?? LANGUAGE}
      onChange={(language): void =>
        loading(
          handleLanguageChange(language).then((): void =>
            globalThis.location.reload()
          )
        )
      }
    />
  );
}

function LegacyLogin({
  data,
  nextUrl,
}: {
  readonly data: {
    readonly formErrors: RA<string>;
    readonly inputErrors: RA<string>;
    readonly externalUser:
      | ''
      | {
          readonly name: string;
          readonly provider_title: LocalizedString;
        };
    readonly passwordErrors: RA<string>;
    readonly languages: RA<readonly [code: Language, name: string]>;
    readonly csrfToken: string;
  };
  readonly nextUrl: string;
}): JSX.Element {
  const [formErrors] = React.useState(data.formErrors);

  const { validationRef, inputRef } = useValidation(data.inputErrors);
  const { validationRef: passwordRef } = useValidation(data.passwordErrors);

  React.useEffect(() => inputRef.current?.focus());

  return (
    <SplashScreen>
      <Label.Block>
        {commonText.language()}
        <LoginLanguageChooser languages={data.languages} />
      </Label.Block>
      {typeof data.externalUser === 'object' && (
        <p>
          {userText.helloMessage({ userName: data.externalUser.name })}
          <br />
          {userText.unknownOicUser({
            providerName: data.externalUser.provider_title,
          })}
        </p>
      )}
      <Form method="post">
        <input
          name="csrfmiddlewaretoken"
          type="hidden"
          value={data.csrfToken}
        />
        {formErrors.length > 0 && <ErrorMessage>{formErrors}</ErrorMessage>}
        <Label.Block>
          {userText.username()}
          <Input.Text
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect="off"
            defaultValue=""
            forwardRef={validationRef}
            name="username"
            required
          />
        </Label.Block>
        <Label.Block>
          {userText.password()}
          <Input.Generic
            autoComplete="current-password"
            defaultValue=""
            forwardRef={passwordRef}
            name="password"
            required
            type="password"
          />
        </Label.Block>
        <input name="next" type="hidden" value={nextUrl} />
        <input name="this_is_the_login_form" type="hidden" value="1" />
        <Submit.Fancy className="mt-1">{userText.logIn()}</Submit.Fancy>
      </Form>
    </SplashScreen>
  );
}
