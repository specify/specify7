import dayjs from 'dayjs';
import React from 'react';

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { Select } from '../Atoms/Form';
import { dateParts } from '../Atoms/Internationalization';
import { ReadOnlyContext } from '../Core/Contexts';
import type {
  PartialDatePrecision,
  useDatePrecision,
} from './useDatePrecision';

/** Render <label> and <select> for the precision selection */
export function DatePrecisionPicker({
  moment: [moment, setMoment],
  precision: [precision, setPrecision],
  precisionValidationRef,
}: ReturnType<typeof useDatePrecision> & {
  readonly moment: readonly [
    ReturnType<typeof dayjs> | undefined,
    (value: ReturnType<typeof dayjs>) => void,
  ];
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <label className="print:hidden">
      <span className="sr-only">{formsText.datePrecision()}</span>
      <Select
        disabled={isReadOnly}
        forwardRef={precisionValidationRef}
        value={precision}
        /*
         * Only update date when user finished changing the precision, to not
         * needlessly widen the date
         */
        onBlur={(): void =>
          typeof moment === 'object'
            ? setMoment(castMoment(precision, moment))
            : undefined
        }
        onChange={({ target }): void =>
          setPrecision(target.value as PartialDatePrecision)
        }
      >
        <option value="full">{commonText.fullDate()}</option>
        <option value="month-year">{formsText.monthYear()}</option>
        <option value="year">{dateParts.year}</option>
      </Select>
    </label>
  );
}

function castMoment(
  precision: PartialDatePrecision,
  moment: ReturnType<typeof dayjs>
): ReturnType<typeof dayjs> {
  if (precision === 'full') return moment;
  let newMoment = dayjs(moment);
  if (precision === 'year' || precision === 'month-year')
    newMoment = newMoment.date(1);
  return precision === 'year' ? newMoment.month(0) : newMoment;
}

export const exportsForTests = {
  castMoment,
};
