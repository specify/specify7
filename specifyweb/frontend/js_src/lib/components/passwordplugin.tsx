import React from 'react';

import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { Button, Form, Input, Label, Submit } from './basic';
import { useBooleanState, useId, useTitle, useValidation } from './hooks';
import { Dialog } from './modaldialog';

export const MIN_PASSWORD_LENGTH = 6;

export function PasswordResetDialog({
  onSet: handleSet,
  onClose: handleClose,
}: {
  readonly onSet: (password: string) => void;
  readonly onClose: () => void;
}): JSX.Element | null {
  useTitle(adminText('setPassword'));

  const id = useId('password-reset-dialog');

  const [password, setPassword] = React.useState('');
  const [repeatPassword, setRepeatPassword] = React.useState('');
  const { validationRef, setValidation } = useValidation();

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
        onSubmit={(): void => {
          if (password === repeatPassword) {
            handleSet(password);
            handleClose();
          } else setValidation(adminText('passwordsDoNotMatchError'));
        }}
      >
        <Label.Generic>
          {commonText('password')}
          <Input.Generic
            type="password"
            required
            autoComplete="new-password"
            value={password}
            minLength={MIN_PASSWORD_LENGTH}
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
            minLength={MIN_PASSWORD_LENGTH}
            forwardRef={validationRef}
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
  onSet: handleSet,
}: {
  readonly onSet: (password: string) => void;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Simple onClick={handleOpen}>
        {adminText('setPassword')}
      </Button.Simple>
      {isOpen && (
        <PasswordResetDialog onSet={handleSet} onClose={handleClose} />
      )}
    </>
  );
}
