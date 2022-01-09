import '../../css/main.css';

import React from 'react';
import ReactDOM from 'react-dom';

import commonText from '../localization/common';
import type { Language } from '../localization/utils';
import type { RA } from '../types';
import { className, ErrorMessage, Submit, Form, Input, Label } from './basic';
import ErrorBoundary from './errorboundary';
import { useTitle, useValidation } from './hooks';
import { LanguageSelection } from './toolbar/language';
import { parseDjangoDump, SplashScreen } from './splashscreen';

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

  const { inputRef } = useValidation(data.inputErrors);
  const { inputRef: passwordRef } = useValidation(data.passwordErrors);

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
            ref={inputRef}
          />
        </Label>
        <Label>
          {commonText('password')}
          <Input
            type="password"
            required={true}
            name="password"
            defaultValue={''}
            ref={passwordRef}
          />
        </Label>
        <input type="hidden" name="next" value={nextUrl} />
        <input type="hidden" name="this_is_the_login_form" value="1" />
        <Submit.Fancy value={commonText('login')} />
      </Form>
    </SplashScreen>
  );
}

// TODO: test nextUrl parameter here and on the choosecollection page
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
