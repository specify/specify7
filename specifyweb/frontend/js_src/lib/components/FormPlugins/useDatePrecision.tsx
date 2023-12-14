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
export function useDatePrecision<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA> | undefined,
  precisionFieldName: (string & keyof SCHEMA['fields']) | undefined,
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
  const precision =
    (numericPrecision === undefined
      ? undefined
      : reverseDatePrecisions[numericPrecision]) ?? defaultPrecision;
  const setPrecision = React.useCallback(
    (precision: PartialDatePrecision) =>
      setNumericPrecision(datePrecisions[precision] ?? numericDefaultPrecision),
    [setNumericPrecision, numericDefaultPrecision]
  );

  return { precision: [precision, setPrecision], precisionValidationRef };
}

/**
 * Unset date precision if it is set, but date is not set.
 * Set date precision if it is not set, but date is set.
 *
 * @remarks
 * Precision may be out of sync in the database, or get out of sync when
 * date is set/cleared.
 */
export function useSyncDatePrecision(
  resource: SpecifyResource<AnySchema> | undefined,
  precisionFieldName: string | undefined,
  precision: PartialDatePrecision,
  hasDate: boolean | 'loading'
): void {
  const hasPrecision =
    typeof precisionFieldName === 'string' &&
    typeof resource?.get(precisionFieldName) === 'number';
  const hasDanglingPrecision = hasDate === false && hasPrecision;
  const needsPrecision =
    hasDate === true && typeof precisionFieldName === 'string' && !hasPrecision;
  const precisionToSet = hasDanglingPrecision
    ? null
    : needsPrecision
    ? datePrecisions[precision]
    : undefined;

  React.useEffect(
    () =>
      precisionToSet !== undefined && typeof precisionFieldName === 'string'
        ? void resource?.set(precisionFieldName, precisionToSet as never, {
            /*
             * Date precision may be in inconsistent state in the database. This
             * hook may fix it automatically on form load. That should not
             * trigger the save button
             */
            silent: true,
          })
        : undefined,
    [resource, precisionToSet, precisionFieldName]
  );
}
