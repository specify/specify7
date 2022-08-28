/**
 * Entry point for the password change view
 */

import React from 'react';

import { csrfToken, parseDjangoDump } from '../../utils/ajax/csrftoken';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { useValidation } from '../../hooks/hooks';
import { MIN_PASSWORD_LENGTH } from '../Security/SetPassword';
import { SplashScreen } from '../Core/Entrypoint';
import { Form, Input, Label } from '../Atoms/Form';
import { ErrorMessage } from '../Atoms';
import { Submit } from '../Atoms/Submit';

export function PasswordChange(): JSX.Element {
  return React.useMemo(
    () => (
      <ChangePassword
        data={{
          formErrors: parseDjangoDump('form-errors'),
          oldPasswordErrors: parseDjangoDump('old-password-errors'),
          newPasswordErrors: parseDjangoDump('new-password-errors'),
          repeatPasswordErrors: parseDjangoDump('repeat-password-errors'),
        }}
      />
    ),
    []
  );
}

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
          name="csrfmiddlewaretoken"
          type="hidden"
          value={csrfToken ?? ''}
        />
        {formErrors.length > 0 && <ErrorMessage>{formErrors}</ErrorMessage>}
        <Label.Block>
          {commonText('oldPassword')}
          <Input.Generic
            autoComplete="current-password"
            defaultValue=""
            forwardRef={oldPasswordRef}
            name="old_password"
            required
            type="password"
          />
        </Label.Block>
        <Label.Block>
          {commonText('newPassword')}
          <Input.Generic
            autoComplete="new-password"
            defaultValue=""
            forwardRef={newPasswordRef}
            minLength={MIN_PASSWORD_LENGTH}
            name="new_password1"
            required
            type="password"
          />
        </Label.Block>
        <Label.Block>
          {commonText('repeatPassword')}
          <Input.Generic
            autoComplete="new-password"
            defaultValue=""
            forwardRef={repeatPasswordRef}
            minLength={MIN_PASSWORD_LENGTH}
            name="new_password2"
            required
            type="password"
          />
        </Label.Block>
        <Submit.Fancy>{commonText('changePassword')}</Submit.Fancy>
      </Form>
    </SplashScreen>
  );
}
