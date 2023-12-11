import React from 'react';

import { dayjs } from '../../utils/dayJs';
import { databaseDateFormat } from '../../utils/parser/dateConfig';
import type { GetSet } from '../../utils/types';
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
  ...GetSet<ReturnType<typeof dayjs> | undefined>,
  React.MutableRefObject<boolean>
] {
  const syncMoment = React.useCallback(
    (moment: ReturnType<typeof dayjs> | undefined) => {
      const value = resource?.get(dateFieldName) ?? undefined;
      const newMoment =
        value === undefined
          ? undefined
          : dayjs(value, databaseDateFormat, true) ?? undefined;

      return moment === undefined ||
        newMoment === undefined ||
        moment.toJSON() !== newMoment.toJSON()
        ? newMoment
        : moment;
    },
    [resource, dateFieldName]
  );

  // Parsed date object
  const [moment, setMoment] = React.useState<
    ReturnType<typeof dayjs> | undefined
    /*
     * Can't set initialState here because it won't be reEvaluated when
     * the "resource" changes
     */
  >(undefined);

  const isInitialized = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (resource === undefined) return undefined;
    isInitialized.current = false;

    return resourceOn(
      resource,
      `change:${dateFieldName}`,
      () => setMoment(syncMoment),
      true
    );
  }, [
    resource,
    dateFieldName,
    precisionFieldName,
    defaultPrecision,
    syncMoment,
  ]);

  return [moment, setMoment, isInitialized];
}
