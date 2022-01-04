import React from 'react';

import ajax, { formData, Http } from '../../ajax';
import commonText from '../../localization/common';
import { useId, useTitle } from '../hooks';
import type { UserTool } from '../main';
import { closeDialog, LoadingScreen, ModalDialog } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';

function MasterKey({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('generateMasterKey'));

  const [password, setPassword] = React.useState<string>('');
  const [masterKey, setMasterKey] = React.useState<string | undefined>(
    undefined
  );
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const id = useId('master-key');

  // See https://medium.com/@teh_builder/ref-objects-inside-useeffect-hooks-eb7c15198780
  const inputRef = React.useCallback<(input: HTMLInputElement | null) => void>(
    (input) => {
      if (!input) return;
      if (typeof error === 'string') {
        input.setCustomValidity(error);
        input.reportValidity();
      } else input.setCustomValidity('');
    },
    [error]
  );

  return isLoading ? (
    <LoadingScreen />
  ) : typeof masterKey === 'undefined' ? (
    <ModalDialog
      properties={{
        title: commonText('generateMasterKeyDialogTitle'),
        close: handleClose,
        buttons: [
          {
            text: commonText('generate'),
            click: (): void => {
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
        className="grid"
        id={id('form')}
        onSubmit={(event): void => {
          event.preventDefault();
          setIsLoading(true);
          ajax(
            '/api/master_key/',
            {
              method: 'POST',
              body: formData({ password }),
              headers: {
                Accept: 'text/plain',
              },
            },
            {
              expectedResponseCodes: [Http.FORBIDDEN, Http.OK],
            }
          )
            .then(({ data, status }) =>
              status === Http.FORBIDDEN
                ? setError(commonText('incorrectPassword'))
                : setMasterKey(data)
            )
            // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
            .catch((error: Error) => setError(error.message))
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
            onChange={({ target }): void => {
              setPassword(target.value);
              target.setCustomValidity('');
            }}
            required
          />
        </label>
      </form>
    </ModalDialog>
  ) : (
    <ShowKey masterKey={masterKey} onClose={handleClose} />
  );
}

function ShowKey({
  onClose: handleClose,
  masterKey,
}: {
  readonly onClose: () => void;
  readonly masterKey: string;
}): JSX.Element {
  return (
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

const MasterKeyView = createBackboneView(MasterKey);

const toolBarItem: UserTool = {
  task: 'master-key',
  title: commonText('generateMasterKey'),
  view: ({ onClose }) => new MasterKeyView({ onClose }),
};

export default toolBarItem;
