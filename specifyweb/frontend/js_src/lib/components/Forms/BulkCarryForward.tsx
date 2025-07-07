import React from 'react';

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { LiteralField } from '../DataModel/specifyField';
import { Dialog } from '../Molecules/Dialog';

export type BulkCarryRangeError =
  boolean | 'ExistingNumbers' | 'InvalidRange' | 'LimitExceeded';

const bulkCarryLimit = 500;

export function BulkCarryRangeBlockedDialog({
  error,
  invalidNumbers,
  numberField,
  onClose: handleClose,
}: {
  readonly error: BulkCarryRangeError;
  readonly invalidNumbers: RA<string> | undefined;
  readonly numberField: LiteralField;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={
        <Button.Warning onClick={handleClose}>
          {commonText.close()}
        </Button.Warning>
      }
      header={formsText.carryForward()}
      onClose={undefined}
    >
      {error == 'ExistingNumbers' ? (
        <>
          {formsText.bulkCarryForwardRangeExistingRecords({
            field: numberField.label,
          })}
          {invalidNumbers &&
            invalidNumbers.map((number, index) => <p key={index}>{number}</p>)}
        </>
      ) : error === 'LimitExceeded' ? (
        <>
          {formsText.bulkCarryForwardRangeLimitExceeded({
            limit: bulkCarryLimit,
          })}
        </>
      ) : (
        <>
          {formsText.bulkCarryForwardRangeErrorDescription({
            field: numberField.label,
          })}
        </>
      )}
    </Dialog>
  );
}
