import React from 'react';

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { LiteralField } from '../DataModel/specifyField';
import { Dialog } from '../Molecules/Dialog';

export function BulkCarryRangeBlockedDialog({
  invalidNumbers,
  numberField,
  onClose: handleClose,
}: {
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
      {invalidNumbers === undefined ? (
        formsText.bulkCarryForwardRangeErrorDescription({
          field: numberField.label,
        })
      ) : (
        <>
          {formsText.bulkCarryForwardRangeExistingRecords({
            field: numberField.label,
          })}
          {invalidNumbers.map((number, index) => (
            <p key={index}>{number}</p>
          ))}
        </>
      )}
    </Dialog>
  );
}

export const SeriesFormContext = React.createContext<{
  seriesEnd: string;
  setSeriesEnd: (v: string) => void;
  usingSeries: boolean;
  setUsingSeries: (v: boolean) => void;
}>({
  seriesEnd: '',
  setSeriesEnd: () => {},
  usingSeries: false,
  setUsingSeries: () => {},
});