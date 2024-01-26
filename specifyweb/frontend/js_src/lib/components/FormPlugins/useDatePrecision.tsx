import React from 'react';

import { useResourceValue } from '../../hooks/useResourceValue';
import type { GetSet, RR } from '../../utils/types';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';

export const datePrecisions = { full: 1, 'month-year': 2, year: 3 } as const;
const reverseDatePrecisions: RR<number, PartialDatePrecision> = {
  1: 'full',
  2: 'month-year',
  3: 'year',
};
export type PartialDatePrecision = keyof typeof datePrecisions;

/** Fetch precision from the resource, and facilitate updating it */
export function useDatePrecision(
  resource: SpecifyResource<AnySchema> | undefined,
  precisionFieldName: string | undefined,
  defaultPrecision: PartialDatePrecision
): {
  readonly precision: GetSet<PartialDatePrecision>;
  readonly precisionValidationRef: React.RefCallback<HTMLSelectElement>;
} {
  const precisionField = React.useMemo(
    () =>
      precisionFieldName === undefined
        ? undefined
        : resource?.specifyTable.getField(precisionFieldName),
    [resource, precisionFieldName]
  );
  const numericDefaultPrecision = datePrecisions[defaultPrecision];
  const precisionParser = React.useMemo(
    () => ({ value: numericDefaultPrecision }),
    [numericDefaultPrecision]
  );
  const {
    value: numericPrecision,
    updateValue: setNumericPrecision,
    validationRef: precisionValidationRef,
  } = useResourceValue<keyof typeof reverseDatePrecisions>(
    resource,
    precisionField,
    precisionParser
  );
  const databasePrecision =
    numericPrecision === undefined
      ? undefined
      : reverseDatePrecisions[numericPrecision];
  const precision = databasePrecision ?? defaultPrecision;

  const setPrecision = React.useCallback(
    (precision: PartialDatePrecision) =>
      setNumericPrecision(datePrecisions[precision] ?? numericDefaultPrecision),
    [setNumericPrecision, numericDefaultPrecision]
  );

  return { precision: [precision, setPrecision], precisionValidationRef };
}
