import React from 'react';

import { dayjs } from '../../utils/dayJs';
import { databaseDateFormat } from '../../utils/parser/dateConfig';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';

/**
 * Get a resource's date field value as a moment.js object
 */
export function useMoment(
  resource: SpecifyResource<AnySchema> | undefined,
  dateFieldName: string
): readonly [
  ReturnType<typeof dayjs> | undefined,
  (value: ReturnType<typeof dayjs> | undefined) => void
] {
  const syncMoment = React.useCallback(
    (moment: ReturnType<typeof dayjs> | undefined) => {
      const value = resource?.get(dateFieldName) ?? undefined;
      const newMoment =
        value === undefined
          ? undefined
          : dayjs(value, databaseDateFormat, true) ?? undefined;

      // Only change the object instance if it is different
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
  >(() => syncMoment(undefined));

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
    [resource, dateFieldName, syncMoment]
  );

  return [
    moment,
    React.useCallback(
      (moment) => {
        if (moment?.isValid() !== false)
          resource?.bulkSet({
            [dateFieldName]: moment?.format(databaseDateFormat) ?? null,
          });
        setMoment(moment);
      },
      [dateFieldName, resource]
    ),
  ];
}
