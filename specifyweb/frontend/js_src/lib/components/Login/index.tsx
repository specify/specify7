/**
 * The entrypoint for the login endpoint
 */

import React from 'react';

import { parseDjangoDump } from '../../utils/ajax/csrftoken';
import { commonText } from '../../localization/common';
import type { Language } from '../../localization/utils';
import { enabledLanguages, LANGUAGE } from '../../localization/utils';
import type { RA } from '../../utils/types';
import { ErrorMessage } from '../Atoms';
import { Form, Input, Label } from '../Atoms/Form';
import { LoadingContext } from '../Core/Contexts';
import { useValidation } from '../../hooks/hooks';
import type { OicProvider } from './OicLogin';
import { OicLogin } from './OicLogin';
import { SplashScreen } from '../Core/Entrypoint';
import { handleLanguageChange, LanguageSelection } from '../Toolbar/Language';
import { Submit } from '../Atoms/Submit';

export function Login(): JSX.Element {
  return React.useMemo(() => {
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
          // REFACTOR: use parseUrl() and formatUrl() instead
          nextUrl.startsWith(nextDestination)
            ? nextUrl
            : `${nextDestination}${nextUrl}`
        }
      />
    ) : (
      <LegacyLogin
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
  }, []);
}

const nextDestination = '/accounts/choose_collection/?next=';

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
          readonly provider_title: string;
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
          name="csrfmiddlewaretoken"
          type="hidden"
          value={data.csrfToken}
        />
        {formErrors.length > 0 && <ErrorMessage>{formErrors}</ErrorMessage>}
        <Label.Generic>
          {commonText('username')}
          <Input.Text
            defaultValue=""
            forwardRef={validationRef}
            name="username"
            required
          />
        </Label.Generic>
        <Label.Generic>
          {commonText('password')}
          <Input.Generic
            defaultValue=""
            forwardRef={passwordRef}
            name="password"
            required
            type="password"
          />
        </Label.Generic>
        <input name="next" type="hidden" value={nextUrl} />
        <input name="this_is_the_login_form" type="hidden" value="1" />
        <Submit.Fancy className="mt-1">{commonText('login')}</Submit.Fancy>
      </Form>
    </SplashScreen>
  );
}
