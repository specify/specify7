/**
 * Generate master key
 *
 */

import React from 'react';

import { ajax, formData, Http } from '../../ajax';
import { commonText } from '../../localization/common';
import { Button, Form, Input, Label, Submit } from '../basic';
import { LoadingContext } from '../contexts';
import { CopyButton } from '../common';
import { useId, useTitle, useValidation } from '../hooks';
import type { UserTool } from '../main';
import { Dialog } from '../modaldialog';

function MasterKey({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element | null {
  useTitle(commonText('generateMasterKey'));

  const [password, setPassword] = React.useState<string>('');
  const [masterKey, setMasterKey] = React.useState<string | undefined>(
    undefined
  );
  const loading = React.useContext(LoadingContext);
  const id = useId('master-key');

  const { validationRef, setValidation } = useValidation();

  return typeof masterKey === 'string' ? (
    <ShowKey masterKey={masterKey} onClose={handleClose} />
  ) : (
    <Dialog
      header={commonText('generateMasterKeyDialogHeader')}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText('generate')}</Submit.Blue>
        </>
      }
    >
      <Form
        className="contents"
        id={id('form')}
        onSubmit={(): void =>
          loading(
            ajax(
              '/api/master_key/',
              {
                method: 'POST',
                body: formData({ password }),
                headers: {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  Accept: 'text/plain',
                },
              },
              {
                expectedResponseCodes: [Http.FORBIDDEN, Http.OK],
              }
            )
              .then(({ data, status }) =>
                status === Http.FORBIDDEN
                  ? setValidation(commonText('incorrectPassword'))
                  : setMasterKey(data)
              )
              // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
              .catch((error: Error) => setValidation(error.message))
          )
        }
      >
        <Label.Generic>
          {commonText('userPassword')}
          <Input.Generic
            forwardRef={validationRef}
            type="password"
            value={password}
            onChange={({ target }): void => {
              setPassword(target.value);
              target.setCustomValidity('');
            }}
            required
          />
        </Label.Generic>
      </Form>
    </Dialog>
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
    <Dialog
      header={commonText('masterKeyDialogHeader')}
      onClose={handleClose}
      buttons={commonText('close')}
    >
      <div className="grid gap-x-2 grid-cols-[auto_min-content] grid-rows-[min-content_auto]">
        <Label.Generic className="contents">
          <span className="col-span-full">
            {commonText('masterKeyFieldLabel')}
          </span>
          <Input.Text
            isReadOnly
            value={masterKey}
            className="!cursor-pointer"
          />
        </Label.Generic>
        <CopyButton text={masterKey} />
      </div>
    </Dialog>
  );
}

export const userTool: UserTool = {
  task: 'master-key',
  title: commonText('generateMasterKey'),
  isOverlay: true,
  view: ({ onClose: handleClose }) => <MasterKey onClose={handleClose} />,
  groupLabel: commonText('administration'),
};
