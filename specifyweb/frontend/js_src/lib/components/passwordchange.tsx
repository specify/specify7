import '../../css/main.css';

import React from 'react';
import ReactDOM from 'react-dom';

import { csrfToken } from '../csrftoken';
import commonText from '../localization/common';
import type { RA } from '../types';
import { className, ErrorMessage, Form, Input, Label, Submit } from './basic';
import { ErrorBoundary } from './errorboundary';
import { useTitle, useValidation } from './hooks';
import { MIN_PASSWORD_LENGTH } from './passwordplugin';
import { parseDjangoDump, SplashScreen } from './splashscreen';

function ChangePassword({
  data,
}: {
  readonly data: {
    readonly formErrors: RA<string>;
    readonly oldPasswordErrors: RA<string>;
    readonly newPasswordErrors: RA<string>;
    readonly repeatPasswordErrors: RA<string>;
  };
}): JSX.Element {
  useTitle(commonText('changePassword'));
  const [formErrors] = React.useState(data.formErrors);

  const { validationRef: oldPasswordRef } = useValidation(
    data.oldPasswordErrors
  );
  const { validationRef: newPasswordRef } = useValidation(
    data.newPasswordErrors
  );
  const { validationRef: repeatPasswordRef } = useValidation(
    data.repeatPasswordErrors
  );

  return (
    <SplashScreen>
      <Form method="post">
        <input
          type="hidden"
          name="csrfmiddlewaretoken"
          value={csrfToken ?? ''}
        />
        {formErrors.length > 0 && <ErrorMessage>{formErrors}</ErrorMessage>}
        <Label.Generic>
          {commonText('oldPassword')}
          <Input.Text
            required={true}
            name="old_password"
            defaultValue={''}
            forwardRef={oldPasswordRef}
          />
        </Label.Generic>
        <Label.Generic>
          {commonText('newPassword')}
          <Input.Generic
            type="password"
            required={true}
            name="new_password1"
            minLength={MIN_PASSWORD_LENGTH}
            defaultValue={''}
            forwardRef={newPasswordRef}
          />
        </Label.Generic>
        <Label.Generic>
          {commonText('repeatPassword')}
          <Input.Generic
            type="password"
            required={true}
            name="new_password2"
            defaultValue={''}
            minLength={MIN_PASSWORD_LENGTH}
            forwardRef={repeatPasswordRef}
          />
        </Label.Generic>
        <Submit.Fancy>{commonText('changePassword')}</Submit.Fancy>
      </Form>
    </SplashScreen>
  );
}

window.addEventListener('load', () => {
  const root = document.getElementById('root');
  if (root === null) throw new Error('Unable to find root element');
  root.setAttribute('class', className.root);
  ReactDOM.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ChangePassword
          data={{
            formErrors: parseDjangoDump('form-errors'),
            oldPasswordErrors: parseDjangoDump('old-password-errors'),
            newPasswordErrors: parseDjangoDump('nex-password-errors'),
            repeatPasswordErrors: parseDjangoDump('repeat-password-errors'),
          }}
        />
      </ErrorBoundary>
    </React.StrictMode>,
    root
  );
});
