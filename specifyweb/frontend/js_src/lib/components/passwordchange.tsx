/**
 * Entry point for the password change view
 */

import '../../css/main.css';

import React from 'react';

import { csrfToken, parseDjangoDump } from '../csrftoken';
import { commonText } from '../localization/common';
import type { RA } from '../types';
import { ErrorMessage, Form, Input, Label, Submit } from './basic';
import { useTitle, useValidation } from './hooks';
import { MIN_PASSWORD_LENGTH } from './passwordplugin';
import { entrypoint, SplashScreen } from './splashscreen';

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
          <Input.Generic
            required={true}
            name="old_password"
            type="password"
            autoComplete="current-password"
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
            autoComplete="new-password"
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
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            forwardRef={repeatPasswordRef}
          />
        </Label.Generic>
        <Submit.Fancy>{commonText('changePassword')}</Submit.Fancy>
      </Form>
    </SplashScreen>
  );
}

entrypoint('passwordChange', () => (
  <ChangePassword
    data={{
      formErrors: parseDjangoDump('form-errors'),
      oldPasswordErrors: parseDjangoDump('old-password-errors'),
      newPasswordErrors: parseDjangoDump('new-password-errors'),
      repeatPasswordErrors: parseDjangoDump('repeat-password-errors'),
    }}
  />
));
