import React from 'react';

import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { Button, Form, Input, Label, Submit } from './basic';
import { useBooleanState, useId, useTitle, useValidation } from './hooks';
import { Dialog } from './modaldialog';

export const MIN_PASSWORD_LENGTH = 8;

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
  const { validationRef, setValidation } = useValidation(
    password === repeatPassword
      ? undefined
      : adminText('passwordsDoNotMatchError')
  );

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
            onValueChange={setPassword}
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
            onValueChange={setRepeatPassword}
          />
        </Label.Generic>
      </Form>
    </Dialog>
  );
}

export function PasswordPlugin({
  isNew,
  onSet: handleSet,
}: {
  readonly isNew: boolean;
  readonly onSet: (password: string) => void;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Small onClick={handleOpen}>
        {isNew ? adminText('setPassword') : commonText('changePassword')}
      </Button.Small>
      {isOpen && (
        <PasswordResetDialog onSet={handleSet} onClose={handleClose} />
      )}
    </>
  );
}
