import React from 'react';

import { dayjs, getDateInputValue } from '../../utils/dayJs';
import { databaseDateFormat } from '../../utils/parser/dateConfig';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';

/**
 * Get a resource's date field value as a moment.js object
 */
export function useMoment(
  resource: SpecifyResource<AnySchema> | undefined,
  dateFieldName: string,
  defaultValue: Date | undefined
): readonly [
  ReturnType<typeof dayjs> | undefined,
  (value: ReturnType<typeof dayjs> | undefined) => void,
] {
  const syncMoment = React.useCallback(
    (moment: ReturnType<typeof dayjs> | undefined) => {
      const value = resource?.get(dateFieldName) ?? undefined;
      const newMoment =
        value === undefined
          ? undefined
          : (dayjs(value, databaseDateFormat, true) ?? undefined);

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

  React.useEffect(() => {
    if (resource === undefined) return undefined;
    if (
      typeof defaultValue === 'object' &&
      typeof resource === 'object' &&
      resource.isNew() &&
      typeof resource?.get(dateFieldName) !== 'string'
    )
      resource.set(dateFieldName, getDateInputValue(defaultValue) as never, {
        silent: true,
      });

    return resourceOn(
      resource,
      `change:${dateFieldName}`,
      () => setMoment(syncMoment),
      true
    );
  }, [resource, dateFieldName, syncMoment, defaultValue]);

  return [
    moment,
    React.useCallback(
      (moment) => {
        if (moment === undefined || moment.isValid())
          resource?.bulkSet({
            [dateFieldName]: moment?.format(databaseDateFormat) ?? null,
          });
        setMoment(moment);
      },
      [dateFieldName, resource]
    ),
  ];
}
