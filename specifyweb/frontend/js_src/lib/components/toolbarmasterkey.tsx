import React from 'react';

import ajax, { formData } from '../ajax';
import commonText from '../localization/common';
import { useId } from './common';
import type { UserTool } from './main';
import { closeDialog, LoadingScreen, ModalDialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';

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
              /* Submit the form */
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
              headers: {
                Accept: 'text/plain',
              },
            },
            {
              expectedResponseCodes: [403, 200],
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

const MasterKeyView = createBackboneView<Props>({
  moduleName: 'MasterKeyView',
  className: 'master-key',
  title: commonText('generateMasterKey'),
  component: MasterKey,
});

const toolBarItem: UserTool = {
  task: 'master-key',
  title: commonText('generateMasterKey'),
  view: ({ onClose }) => new MasterKeyView({ onClose }),
};

export default toolBarItem;
