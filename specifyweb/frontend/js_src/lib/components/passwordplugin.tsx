import React from 'react';

import { formData, Http, ping } from '../ajax';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { UiPlugin } from '../uiplugin';
import { useId, useTitle } from './hooks';
import { Dialog, LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { Button, Form, Input, Label, Submit } from './basic';

export const MIN_PASSWORD_LENGTH = 6;

function PasswordResetDialog({
  modelId,
  onClose: handleClose,
}: {
  readonly modelId: number;
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(adminText('setPassword'));

  const id = useId('password-reset-dialog');
  const [isLoading, setIsLoading] = React.useState(false);

  const passwordRef = React.useRef<HTMLInputElement | null>(null);
  const repeatPasswordRef = React.useRef<HTMLInputElement | null>(null);

  const [password, setPassword] = React.useState('');
  const [repeatPassword, setRepeatPassword] = React.useState('');

  return isLoading ? (
    <LoadingScreen />
  ) : (
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
        onSubmit={(event): void => {
          event.preventDefault();
          if (password.length < MIN_PASSWORD_LENGTH)
            passwordRef.current?.setCustomValidity(
              adminText('passwordLengthError')
            );
          else if (password === repeatPassword) {
            setIsLoading(true);
            void ping(
              `/api/set_password/${modelId}/`,
              {
                method: 'POST',
                body: formData({ password }),
              },
              { expectedResponseCodes: [Http.NO_CONTENT] }
            ).then(() => {
              setIsLoading(false);
              handleClose();
              return undefined;
            });
          } else
            repeatPasswordRef.current?.setCustomValidity(
              adminText('passwordsDoNotMatchError')
            );
        }}
      >
        <Label>
          {adminText('password')}
          <Input
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
        </Label>
        <Label>
          {adminText('confirmPassword')}
          <Input
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
        </Label>
      </Form>
    </Dialog>
  );
}

const DialogView = createBackboneView(PasswordResetDialog);

export default UiPlugin.extend(
  {
    __name__: 'PasswordUIPlugin',
    events: {
      click: 'click',
    },
    render() {
      this.el.value = adminText('setPassword');
      if (this.model.isNew())
        this.$el
          .attr('title', adminText('saveUserBeforeSettingPasswordError'))
          .prop('disabled', true);
      return this;
    },
    click() {
      const onClose = () => this.dialog?.remove();
      this.dialog = new DialogView({
        modelId: this.model.id,
        onClose,
      }).render();
    },
    remove() {
      this.dialog?.remove();
      UiPlugin.prototype.remove.call(this);
    },
  },
  { pluginsProvided: ['PasswordUI'] }
);
