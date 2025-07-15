/**
 * Generate master key
 *
 */

import React from 'react';

import { useId } from '../../hooks/useId';
import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { formData } from '../../utils/ajax/helpers';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { CopyButton } from '../Molecules/Copy';
import { Dialog } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';

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
          <Submit.Info form={id('form')}>{userText.generate()}</Submit.Info>
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
            ajax('/api/master_key/', {
              method: 'POST',
              body: formData({ password }),
              headers: {
                Accept: 'text/plain',
              },
              errorMode: 'dismissible',
              expectedErrors: [Http.FORBIDDEN],
            })
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
      header={userText.masterKeyGenerated()}
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
