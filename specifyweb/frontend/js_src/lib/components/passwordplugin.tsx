import React from 'react';

import { formData, Http, ping } from '../ajax';
import type { SpecifyUser } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { Button, Form, Input, Label, Submit } from './basic';
import { useBooleanState, useId, useTitle } from './hooks';
import { Dialog } from './modaldialog';
import { LoadingContext } from './contexts';

export const MIN_PASSWORD_LENGTH = 6;

function PasswordResetDialog({
  userId,
  onClose: handleClose,
}: {
  readonly userId: number;
  readonly onClose: () => void;
}): JSX.Element | null {
  useTitle(adminText('setPassword'));

  const id = useId('password-reset-dialog');

  const passwordRef = React.useRef<HTMLInputElement | null>(null);
  const repeatPasswordRef = React.useRef<HTMLInputElement | null>(null);

  const [password, setPassword] = React.useState('');
  const [repeatPassword, setRepeatPassword] = React.useState('');
  const loading = React.useContext(LoadingContext);

  return (
    <Dialog
      header={adminText('setPassword')}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText('apply')}</Submit.Blue>
        </>
      }
    >
      <Form
        className="contents"
        id={id('form')}
        onSubmit={(): void =>
          password.length < MIN_PASSWORD_LENGTH
            ? passwordRef.current?.setCustomValidity(
                adminText('passwordLengthError')
              )
            : password === repeatPassword
            ? loading(
                ping(
                  `/api/set_password/${userId}/`,
                  {
                    method: 'POST',
                    body: formData({ password }),
                  },
                  { expectedResponseCodes: [Http.NO_CONTENT] }
                ).then(handleClose)
              )
            : repeatPasswordRef.current?.setCustomValidity(
                adminText('passwordsDoNotMatchError')
              )
        }
      >
        <Label.Generic>
          {adminText('password')}
          <Input.Generic
            type="password"
            required
            autoComplete="new-password"
            value={password}
            minLength={6}
            forwardRef={passwordRef}
            onChange={({ target }): void => {
              setPassword(target.value);
              target.setCustomValidity('');
            }}
          />
        </Label.Generic>
        <Label.Generic>
          {adminText('confirmPassword')}
          <Input.Generic
            type="password"
            required
            autoComplete="new-password"
            value={repeatPassword}
            minLength={6}
            forwardRef={repeatPasswordRef}
            onChange={({ target }): void => {
              setRepeatPassword(target.value);
              target.setCustomValidity('');
            }}
            onBlur={({ target }): void => {
              if (password !== repeatPassword)
                target.setCustomValidity(adminText('passwordsDoNotMatchError'));
            }}
          />
        </Label.Generic>
      </Form>
    </Dialog>
  );
}

export function PasswordPlugin({
  user,
}: {
  readonly user: SpecifyResource<SpecifyUser>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Simple
        className="w-fit"
        disabled={user.isNew()}
        title={
          user.isNew()
            ? adminText('saveUserBeforeSettingPasswordError')
            : undefined
        }
        onClick={handleOpen}
      >
        {adminText('setPassword')}
      </Button.Simple>
      {isOpen && <PasswordResetDialog userId={user.id} onClose={handleClose} />}
    </>
  );
}
