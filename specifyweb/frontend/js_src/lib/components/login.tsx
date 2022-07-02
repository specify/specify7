/**
 * The entrypoint for the login endpoint
 */

import '../../css/main.css';

import React from 'react';

import { commonText } from '../localization/common';
import type { Language } from '../localization/utils';
import { enabledLanguages, LANGUAGE } from '../localization/utils';
import type { RA } from '../types';
import { ErrorMessage, Form, Input, Label, Submit } from './basic';
import { useTitle, useValidation } from './hooks';
import type { OicProvider } from './oiclogin';
import { OicLogin } from './oiclogin';
import { entrypoint, parseDjangoDump, SplashScreen } from './splashscreen';
import { handleLanguageChange, LanguageSelection } from './toolbar/language';
import { LoadingContext } from './contexts';

function Login({
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
          readonly provider_title: string;
        };
    readonly passwordErrors: RA<string>;
    readonly languages: RA<Readonly<[code: Language, name: string]>>;
    readonly csrfToken: string;
  };
  readonly nextUrl: string;
}): JSX.Element {
  useTitle(commonText('login'));
  const [formErrors] = React.useState(data.formErrors);

  const { validationRef, inputRef } = useValidation(data.inputErrors);
  const { validationRef: passwordRef } = useValidation(data.passwordErrors);

  React.useEffect(() => inputRef.current?.focus());

  const loading = React.useContext(LoadingContext);
  return (
    <SplashScreen>
      <LanguageSelection<Language>
        languages={Object.fromEntries(
          data.languages.filter(([code]) => enabledLanguages.includes(code))
        )}
        value={LANGUAGE}
        onChange={(language): void =>
          loading(
            handleLanguageChange(language).then((): void =>
              globalThis.location.reload()
            )
          )
        }
      />
      {typeof data.externalUser === 'object' && (
        <p>
          {commonText('helloMessage', data.externalUser.name)}
          <br />
          {commonText('unknownOicUser', data.externalUser.provider_title)}
        </p>
      )}
      <Form method="post">
        <input
          type="hidden"
          name="csrfmiddlewaretoken"
          value={data.csrfToken}
        />
        {formErrors.length > 0 && <ErrorMessage>{formErrors}</ErrorMessage>}
        <Label.Generic>
          {commonText('username')}
          <Input.Text
            required={true}
            name="username"
            defaultValue={''}
            forwardRef={validationRef}
          />
        </Label.Generic>
        <Label.Generic>
          {commonText('password')}
          <Input.Generic
            type="password"
            required={true}
            name="password"
            defaultValue={''}
            forwardRef={passwordRef}
          />
        </Label.Generic>
        <input type="hidden" name="next" value={nextUrl} />
        <input type="hidden" name="this_is_the_login_form" value="1" />
        <Submit.Fancy className="mt-1">{commonText('login')}</Submit.Fancy>
      </Form>
    </SplashScreen>
  );
}

const nextDestination = '/accounts/choose_collection/?next=';

entrypoint('login', () => {
  const nextUrl = parseDjangoDump<string>('next-url') ?? '/specify/';
  const providers = parseDjangoDump<RA<OicProvider>>('providers');
  return providers.length > 0 ? (
    <OicLogin
      data={{
        inviteToken: parseDjangoDump('invite-token'),
        providers,
        languages: parseDjangoDump('languages'),
        csrfToken: parseDjangoDump('csrf-token'),
      }}
      nextUrl={
        nextUrl.startsWith(nextDestination)
          ? nextUrl
          : `${nextDestination}${nextUrl}`
      }
    />
  ) : (
    <Login
      data={{
        formErrors: parseDjangoDump('form-errors'),
        inputErrors: parseDjangoDump('input-errors'),
        externalUser: parseDjangoDump('external-user'),
        passwordErrors: parseDjangoDump('password-errors'),
        languages: parseDjangoDump('languages'),
        csrfToken: parseDjangoDump('csrf-token'),
      }}
      nextUrl={
        nextUrl.startsWith(nextDestination)
          ? nextUrl
          : `${nextDestination}${nextUrl}`
      }
    />
  );
});
