import React from 'react';

import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import { Button, Form, Input, Label, Submit } from '../Atoms/Basic';
import { useBooleanState, useId, useValidation } from '../../hooks/hooks';
import { Dialog } from '../Molecules/Dialog';

export const MIN_PASSWORD_LENGTH = 8;

export function PasswordResetDialog({
  onSet: handleSet,
  onClose: handleClose,
}: {
  readonly onSet: (password: string) => void;
  readonly onClose: () => void;
}): JSX.Element | null {
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
      buttons={
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText('apply')}</Submit.Blue>
        </>
      }
      header={adminText('setPassword')}
      onClose={handleClose}
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
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            type="password"
            value={password}
            onValueChange={setPassword}
          />
        </Label.Generic>
        <Label.Generic>
          {adminText('confirmPassword')}
          <Input.Generic
            autoComplete="new-password"
            forwardRef={validationRef}
            minLength={MIN_PASSWORD_LENGTH}
            required
            type="password"
            value={repeatPassword}
            onValueChange={setRepeatPassword}
          />
        </Label.Generic>
      </Form>
    </Dialog>
  );
}

export function SetPassword({
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
        <PasswordResetDialog onClose={handleClose} onSet={handleSet} />
      )}
    </>
  );
}
