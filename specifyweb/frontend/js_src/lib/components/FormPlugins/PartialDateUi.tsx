import React from 'react';

import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { LiteralField } from '../DataModel/specifyField';
import { DateInput } from './DateInput';
import { DatePrecisionPicker } from './DatePrecisionPicker';
import { getDateParser } from './dateUtils';
import type { PartialDatePrecision } from './useDatePrecision';
import { useDatePrecision } from './useDatePrecision';
import { useMoment } from './useMoment';

/** A date picker with precision selection (full, month-year, year) */
export function PartialDateUi({
  resource,
  dateField,
  precisionField: precisionFieldName,
  defaultPrecision,
  defaultValue,
  id,
  isRequired,
  canChangePrecision = true,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly dateField: LiteralField;
  readonly precisionField: string | undefined;
  readonly defaultPrecision: PartialDatePrecision;
  readonly defaultValue: Date | undefined;
  readonly isRequired: boolean;
  readonly id: string | undefined;
  readonly canChangePrecision?: boolean;
}): JSX.Element {
  const [moment, setMoment] = useMoment(resource, dateField.name);

  const precisionProps = useDatePrecision(
    resource,
    precisionFieldName,
    defaultPrecision
  );

  const [precision, setPrecision] = precisionProps.precision;
  const parser = React.useMemo(
    () => getDateParser(dateField, precision, defaultValue),
    [dateField, precision, defaultValue]
  );

  const isReadOnly =
    React.useContext(ReadOnlyContext) || resource === undefined;

  /*
   * ME: check if back-end returned date-time format date is handled correctly
   * ME: test read-only date fields
   * ME: jason - know a better place for precision standardization? if partial request, may not work
   */

  return (
    <div className="flex w-full gap-1">
      {!isReadOnly && canChangePrecision ? (
        <DatePrecisionPicker moment={[moment, setMoment]} {...precisionProps} />
      ) : undefined}
      <ReadOnlyContext.Provider value={isReadOnly || resource === undefined}>
        <DateInput
          id={id}
          isRequired={isRequired}
          moment={[
            moment,
            (moment): void => {
              if (moment?.isValid() === true) setPrecision(precision);
              setMoment(moment);
            },
          ]}
          parser={parser}
          precision={precision}
        />
      </ReadOnlyContext.Provider>
    </div>
  );
}
