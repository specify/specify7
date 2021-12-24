import React from 'react';

import commonText from '../localization/common';
import createBackboneView from './reactbackboneextend';
import app from '../specifyapp';
import navigation from '../navigation';
import { closeDialog, LoadingScreen, ModalDialog } from './modaldialog';
import ajax, { formData } from '../ajax';
import { useId } from './common';

type Props = {
  onClose: () => void;
};

function MasterKey({ onClose: handleClose }: Readonly<Props>): JSX.Element {
  const [password, setPassword] = React.useState<string>('');
  const [masterKey, setMasterKey] = React.useState<string | undefined>(
    undefined
  );
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const id = useId('master-key');
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (!inputRef.current) return;
    if (typeof error === 'string') inputRef.current.setCustomValidity(error);
    else inputRef.current.setCustomValidity('');
  }, [error, inputRef]);

  return isLoading ? (
    <LoadingScreen />
  ) : typeof masterKey === 'undefined' || typeof error !== 'undefined' ? (
    <ModalDialog
      properties={{
        title: commonText('generateMasterKeyDialogTitle'),
        close: handleClose,
        buttons: [
          {
            text: commonText('generate'),
            click: () => {
              /* submit the form */
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
      {commonText('generateMasterKeyDialogHeader')}
      <form
        id={id('form')}
        onSubmit={(event): void => {
          event.preventDefault();
          setIsLoading(true);
          ajax<string>(
            '/api/master_key/',
            {
              method: 'POST',
              body: formData({ password }),
            },
            {
              expectedResponseCodes: [403, 200],
              expectsJson: false,
            }
          )
            .then(({ data, status }) =>
              status === 403
                ? setError(commonText('incorrectPassword'))
                : setMasterKey(data)
            )
            .catch((error) => setError(error.toString()))
            .finally(() => {
              setIsLoading(false);
            });
        }}
      >
        <label>
          {commonText('userPassword')}
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={({ target }): void => setPassword(target.value)}
            required
          />
        </label>
      </form>
    </ModalDialog>
  ) : (
    <ModalDialog
      properties={{
        close: handleClose,
        title: commonText('masterKeyDialogTitle'),
        width: 'auto',
      }}
    >
      {commonText('masterKeyDialogHeader')}
      <label>
        {commonText('masterKeyFieldLabel')}
        <input type="text" readOnly value={masterKey} />
      </label>
    </ModalDialog>
  );
}

const MasterKeyView = createBackboneView<
  Record<never, unknown>,
  Props,
  Readonly<Props>
>({
  moduleName: 'MasterKeyView',
  className: 'master-key',
  title: commonText('generateMasterKey'),
  Component: MasterKey,
  getComponentProps: () => ({
    onClose: () => {
      navigation.go('/specify/');
    },
  }),
});

export default {
  task: 'master-key',
  title: commonText('generateMasterKey'),
  icon: null,
  execute() {
    app.setCurrentView(new MasterKeyView());
  },
};
