import '../../css/main.css';

import React from 'react';
import ReactDOM from 'react-dom';

import commonText from '../localization/common';
import type { Language } from '../localization/utils';
import type { RA } from '../types';
import { className, ErrorMessage, Form, Input, Label, Submit } from './basic';
import { ErrorBoundary } from './errorboundary';
import { useTitle, useValidation } from './hooks';
import { parseDjangoDump, SplashScreen } from './splashscreen';
import { LanguageSelection } from './toolbar/language';

function Login({
  data,
  nextUrl,
}: {
  readonly data: {
    readonly formErrors: RA<string>;
    readonly inputErrors: RA<string>;
    readonly passwordErrors: RA<string>;
    readonly languages: RA<Readonly<[coode: Language, name: string]>>;
    readonly csrfToken: string;
  };
  readonly nextUrl: string;
}): JSX.Element {
  useTitle(commonText('login'));
  const [formErrors] = React.useState(data.formErrors);

  const { validationRef } = useValidation(data.inputErrors);
  const { validationRef: passwordRef } = useValidation(data.passwordErrors);

  return (
    <SplashScreen>
      <LanguageSelection languages={Object.fromEntries(data.languages)} />
      <Form method="post">
        <input
          type="hidden"
          name="csrfmiddlewaretoken"
          value={data.csrfToken}
        />
        {formErrors.length > 0 && <ErrorMessage>{formErrors}</ErrorMessage>}
        <Label>
          {commonText('username')}
          <Input
            type="text"
            required={true}
            name="username"
            defaultValue={''}
            forwardRef={validationRef}
          />
        </Label>
        <Label>
          {commonText('password')}
          <Input
            type="password"
            required={true}
            name="password"
            defaultValue={''}
            forwardRef={passwordRef}
          />
        </Label>
        <input type="hidden" name="next" value={nextUrl} />
        <input type="hidden" name="this_is_the_login_form" value="1" />
        <Submit.Fancy>{commonText('login')}</Submit.Fancy>
      </Form>
    </SplashScreen>
  );
}

const nextDestination = '/accounts/choose_collection/?next=';

window.addEventListener('load', () => {
  const root = document.getElementById('root');
  if (root === null) throw new Error('Unable to find root element');
  root.setAttribute('class', className.root);

  const nextUrl = parseDjangoDump<string>('next-url') ?? '/specify/';
  ReactDOM.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Login
          data={{
            formErrors: parseDjangoDump('form-errors'),
            inputErrors: parseDjangoDump('input-errors'),
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
      </ErrorBoundary>
    </React.StrictMode>,
    root
  );
});
