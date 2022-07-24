/**
 * Generate master key
 *
 */

import React from 'react';

import { ajax, formData, Http } from '../../ajax';
import { commonText } from '../../localization/common';
import { Button, Form, Input, Label, Submit } from '../basic';
import { CopyButton } from '../common';
import { LoadingContext } from '../contexts';
import { useId, useValidation } from '../hooks';
import { Dialog } from '../modaldialog';
import {OverlayContext} from '../router';

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
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText('generate')}</Submit.Blue>
        </>
      }
      header={commonText('generateMasterKeyDialogHeader')}
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
            required
            type="password"
            value={password}
            onChange={({ target }): void => {
              setPassword(target.value);
              target.setCustomValidity('');
            }}
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
      buttons={commonText('close')}
      header={commonText('masterKeyDialogHeader')}
      onClose={handleClose}
    >
      <div className="grid grid-cols-[auto_min-content] grid-rows-[min-content_auto] gap-2">
        <Label.Generic className="contents">
          <span className="col-span-full">
            {commonText('masterKeyFieldLabel')}
          </span>
          <Input.Text
            className="!cursor-pointer"
            isReadOnly
            value={masterKey}
          />
        </Label.Generic>
        <CopyButton text={masterKey} />
      </div>
    </Dialog>
  );
}

