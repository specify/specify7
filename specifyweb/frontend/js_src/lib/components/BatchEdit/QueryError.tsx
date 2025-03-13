import React from 'react';

import { batchEditText } from '../../localization/batchEdit';
import { commonText } from '../../localization/common';
import { RA } from '../../utils/types';
import { H2, H3 } from '../Atoms';
import { dialogIcons } from '../Atoms/Icons';
import { Dialog } from '../Molecules/Dialog';

export type QueryError = {
  readonly invalidFields: RA<string>;
};

export function ErrorsDialog({
  errors,
  onClose: handleClose,
}: {
  readonly errors: QueryError;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={commonText.close()}
      header={batchEditText.errorInQuery()}
      icon={dialogIcons.error}
      onClose={handleClose}
    >
      <ShowInvalidFields error={errors.invalidFields} />
    </Dialog>
  );
}

function ShowInvalidFields({
  error,
}: {
  readonly error: QueryError['invalidFields'];
}) {
  const hasErrors = error.length > 0;
  return hasErrors ? (
    <div>
      <div>
        <H2>{batchEditText.removeField()}</H2>
      </div>
      {error.map((singleError) => (
        <H3>{singleError}</H3>
      ))}
    </div>
  ) : null;
}
