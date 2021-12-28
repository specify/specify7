import React from 'react';

import ajax, { formData, Http } from '../ajax';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import UIPlugin from '../uiplugin';
import { useId } from './common';
import { closeDialog, LoadingScreen, ModalDialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';

const MIN_PASSWORD_LENGTH = 6;

function PasswordResetDialog({
  modelId,
  onClose: handleClose,
}: {
  readonly modelId: number;
  readonly onClose: () => void;
}): JSX.Element {
  const id = useId('password-reset-dialog');
  const [isLoading, setIsLoading] = React.useState(false);

  const passwordRef = React.useRef<HTMLInputElement | null>(null);
  const repeatPasswordRef = React.useRef<HTMLInputElement | null>(null);

  const [password, setPassword] = React.useState('');
  const [repeatPassword, setRepeatPassword] = React.useState('');

  return isLoading ? (
    <LoadingScreen />
  ) : (
    <ModalDialog
      properties={{
        title: adminText('setPassword'),
        close: closeDialog,
        buttons: [
          {
            text: commonText('apply'),
            click(): void {
              /* Submit form */
            },
            type: 'submit',
            form: id('form'),
          },
          {
            text: commonText('cancel'),
            click: closeDialog,
          },
        ],
      }}
    >
      <form
        className="grid"
        id={id('form')}
        onSubmit={(event): void => {
          event.preventDefault();
          if (password.length < MIN_PASSWORD_LENGTH)
            passwordRef.current?.setCustomValidity(
              adminText('passwordLengthError')
            );
          else if (password !== repeatPassword)
            repeatPasswordRef.current?.setCustomValidity(
              adminText('passwordsDoNotMatchError')
            );
          else {
            setIsLoading(true);
            void ajax(
              `/api/set_password/${modelId}/`,
              {
                method: 'POST',
                body: formData({ password }),
              },
              { expectedResponseCodes: [Http.NO_CONTENT] }
            ).then(() => {
              setIsLoading(false);
              handleClose();
            });
          }
        }}
      >
        <label>
          {adminText('password')}
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            minLength={6}
            ref={passwordRef}
            onChange={({ target }): void => {
              setPassword(target.value);
              target.setCustomValidity('');
            }}
          />
        </label>
        <label htmlFor="pass2">
          {adminText('confirmPassword')}
          <input
            type="password"
            required
            autoComplete="new-password"
            value={repeatPassword}
            minLength={6}
            ref={repeatPasswordRef}
            onChange={({ target }): void => {
              setRepeatPassword(target.value);
              target.setCustomValidity('');
            }}
            onBlur={({ target }): void => {
              if (password !== repeatPassword)
                target.setCustomValidity(adminText('passwordsDoNotMatchError'));
            }}
          />
        </label>
      </form>
    </ModalDialog>
  );
}

const Dialog = createBackboneView({
  moduleName: 'PasswordResetDialog',
  component: PasswordResetDialog,
});

export default UIPlugin.extend(
  {
    __name__: 'PasswordUIPlugin',
    events: {
      click: 'click',
    },
    render() {
      this.el.textContent = adminText('setPassword');
      if (this.model.isNew())
        this.$el
          .attr('title', adminText('saveUserBeforeSettingPasswordError'))
          .prop('disabled', true);
      return this;
    },
    click() {
      const onClose = () => dialog.remove();
      const dialog = new Dialog({
        modelId: this.model.id,
        onClose,
      }).render();
    },
  },
  { pluginsProvided: ['PasswordUI'] }
);
