import React from 'react';

import { dayjs } from '../../utils/dayJs';
import { databaseDateFormat } from '../../utils/parser/dateConfig';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { PartialDatePrecision } from './useDatePrecision';

/**
 * Get a resource's date field value as a moment.js object
 */
export function useMoment<SCHEMA extends AnySchema>({
  resource,
  dateFieldName,
  precisionFieldName,
  defaultPrecision,
}: {
  readonly resource: SpecifyResource<SCHEMA> | undefined;
  readonly dateFieldName: string & keyof SCHEMA['fields'];
  readonly precisionFieldName: (string & keyof SCHEMA['fields']) | undefined;
  readonly defaultPrecision: PartialDatePrecision;
}): readonly [
  ReturnType<typeof dayjs> | 'loading' | undefined,
  (value: ReturnType<typeof dayjs> | undefined) => void
] {
  const syncMoment = React.useCallback(
    (moment: ReturnType<typeof dayjs> | 'loading' | undefined) => {
      const value = resource?.get(dateFieldName) ?? undefined;
      const newMoment =
        value === undefined
          ? undefined
          : dayjs(value, databaseDateFormat, true) ?? undefined;

      // Only change the object instance if it is different
      return moment === undefined ||
        moment === 'loading' ||
        newMoment === undefined ||
        moment.toJSON() !== newMoment.toJSON()
        ? newMoment
        : moment;
    },
    [resource, dateFieldName]
  );

  // Parsed date object
  const [moment, setMoment] = React.useState<
    ReturnType<typeof dayjs> | 'loading' | undefined
    /*
     * Can't set initialState here because it won't be reEvaluated when
     * the "resource" changes
     *
     * // ME: test this part thoroughly:
     * If resource changes, a new moment is set, but its value won't get
     * propagated on the first call to this useEffect.
     * It is demonstrated here: https://codepen.io/maxpatiiuk/pen/oNqNqVN
     */
  >('loading');

  React.useEffect(
    () =>
      resource === undefined
        ? undefined
        : resourceOn(
            resource,
            `change:${dateFieldName}`,
            () => setMoment(syncMoment),
            true
          ),
    [resource, dateFieldName, precisionFieldName, defaultPrecision, syncMoment]
  );

  return [moment, setMoment];
}
