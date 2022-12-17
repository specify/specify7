/**
 * Generate master key
 *
 */

import React from 'react';

import { ajax } from '../../utils/ajax';
import { formData } from '../../utils/ajax/helpers';
import { commonText } from '../../localization/common';
import { LoadingContext } from '../Core/Contexts';
import { Dialog } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { useId } from '../../hooks/useId';
import { useValidation } from '../../hooks/useValidation';
import { CopyButton } from '../Molecules/Copy';
import { Http } from '../../utils/ajax/definitions';
import { userText } from '../../localization/user';

export function MasterKeyOverlay(): JSX.Element | null {
  const [password, setPassword] = React.useState<string>('');
  const [masterKey, setMasterKey] = React.useState<string | undefined>(
    undefined
  );
  const loading = React.useContext(LoadingContext);
  const id = useId('master-key');
  const handleClose = React.useContext(OverlayContext);

  const { validationRef, setValidation } = useValidation();
  return typeof masterKey === 'string' ? (
    <ShowKey masterKey={masterKey} onClose={handleClose} />
  ) : (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText.generate()}</Submit.Blue>
        </>
      }
      header={userText.generateMasterKey()}
      onClose={handleClose}
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
                  ? setValidation(userText.incorrectPassword())
                  : setMasterKey(data)
              )
              // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
              .catch((error: Error) => setValidation(error.message))
          )
        }
      >
        <Label.Block>
          {userText.userPassword()}
          <Input.Generic
            forwardRef={validationRef}
            required
            type="password"
            value={password}
            onChange={({ target }): void => {
              setPassword(target.value);
              target.setCustomValidity('');
            }}
          />
        </Label.Block>
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
      buttons={commonText.close()}
      header={userText.masterKeyDialogHeader()}
      onClose={handleClose}
    >
      <div className="grid grid-cols-[auto_min-content] grid-rows-[min-content_auto] gap-2">
        <Label.Block className="contents">
          <span className="col-span-full">
            {userText.masterKeyFieldLabel()}
          </span>
          <Input.Text
            className="!cursor-pointer"
            isReadOnly
            value={masterKey}
          />
        </Label.Block>
        <CopyButton text={masterKey} />
      </div>
    </Dialog>
  );
}
