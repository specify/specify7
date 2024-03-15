import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
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
      : userText.passwordsDoNotMatchError()
  );

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Submit.Info form={id('form')}>{commonText.apply()}</Submit.Info>
        </>
      }
      header={userText.setPassword()}
      onClose={handleClose}
    >
      <Form
        className="contents"
        id={id('form')}
        onSubmit={(): void => {
          if (password === repeatPassword) {
            handleSet(password);
            handleClose();
          } else setValidation(userText.passwordsDoNotMatchError());
        }}
      >
        <Label.Block>
          {userText.password()}
          <Input.Generic
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            type="password"
            value={password}
            onValueChange={setPassword}
          />
        </Label.Block>
        <Label.Block>
          {userText.confirmPassword()}
          <Input.Generic
            autoComplete="new-password"
            forwardRef={validationRef}
            minLength={MIN_PASSWORD_LENGTH}
            required
            type="password"
            value={repeatPassword}
            onValueChange={setRepeatPassword}
          />
        </Label.Block>
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
        {isNew ? userText.setPassword() : userText.changePassword()}
      </Button.Small>
      {isOpen && (
        <PasswordResetDialog onClose={handleClose} onSet={handleSet} />
      )}
    </>
  );
}
