import dayjs from 'dayjs';
import React from 'react';

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { GetSet, ValueOf } from '../../utils/types';
import { Select } from '../Atoms/Form';
import { dateParts } from '../Atoms/Internationalization';
import type {
  PartialDatePrecision,
  useDatePrecision,
} from './useDatePrecision';
import { datePrecisions } from './useDatePrecision';

/** Render <label> and <select> for the precision selection */
export function DatePrecisionPicker({
  moment: [moment, setMoment],
  precision: [precision, setPrecision],
  precisionValidationRef,
  onUpdatePrecision: handleUpdatePrecision,
}: ReturnType<typeof useDatePrecision> & {
  readonly moment: GetSet<ReturnType<typeof dayjs> | undefined>;
  readonly onUpdatePrecision:
    | ((precisionIndex: ValueOf<typeof datePrecisions>) => void)
    | undefined;
}): JSX.Element {
  return (
    <label>
      <span className="sr-only">{formsText.datePrecision()}</span>
      <Select
        className="!w-auto !min-w-[unset] print:hidden"
        disabled={handleUpdatePrecision === undefined}
        forwardRef={precisionValidationRef}
        value={precision}
        onBlur={(): void => {
          if (moment === undefined) return;
          let newMoment = dayjs(moment);
          if (precision === 'year' || precision === 'month-year')
            newMoment = newMoment.date(1);
          if (precision === 'year') newMoment = newMoment.month(0);

          setMoment(newMoment);
        }}
        onChange={
          handleUpdatePrecision
            ? undefined
            : ({ target }): void => {
                const precision = target.value as PartialDatePrecision;
                setPrecision(precision);
                const precisionIndex = datePrecisions[precision];
                if (typeof moment === 'object')
                  handleUpdatePrecision!(precisionIndex);
              }
        }
      >
        <option value="full">{commonText.fullDate()}</option>
        <option value="month-year">{formsText.monthYear()}</option>
        <option value="year">{dateParts.year}</option>
      </Select>
    </label>
  );
}
