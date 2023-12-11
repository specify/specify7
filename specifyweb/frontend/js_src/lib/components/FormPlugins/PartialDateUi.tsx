import React from 'react';

import { useResourceValue } from '../../hooks/useResourceValue';
import { formsText } from '../../localization/forms';
import { dayjs, getDateInputValue } from '../../utils/dayJs';
import { f } from '../../utils/functools';
import { databaseDateFormat } from '../../utils/parser/dateConfig';
import { fullDateFormat, monthFormat } from '../../utils/parser/dateFormat';
import { parseDate } from '../../utils/parser/dayJsFixes';
import { getValidationAttributes } from '../../utils/parser/definitions';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { DatePrecisionPicker } from './DatePrecisionPicker';
import { getDateParser } from './dateUtils';
import type { PartialDatePrecision } from './useDatePrecision';
import {
  datePrecisions,
  useDatePrecision,
  useUnsetDanglingDatePrecision,
} from './useDatePrecision';
import { useDatePreferences } from './useDatePreferences';
import { useMoment } from './useMoment';

/** A date picker with precision selection (full, month-year, year) */
export function PartialDateUi<SCHEMA extends AnySchema>({
  resource,
  dateFieldName,
  precisionField: precisionFieldName,
  defaultPrecision,
  defaultValue,
  id,
  isRequired,
  canChangePrecision = true,
}: {
  readonly resource: SpecifyResource<SCHEMA> | undefined;
  readonly dateFieldName: string & keyof SCHEMA['fields'];
  readonly precisionField: (string & keyof SCHEMA['fields']) | undefined;
  readonly defaultPrecision: PartialDatePrecision;
  readonly defaultValue: Date | undefined;
  readonly isRequired: boolean;
  readonly id: string | undefined;
  readonly canChangePrecision?: boolean;
}): JSX.Element {
  const {
    dateType,
    dateSupported,
    monthType,
    monthSupported,
    inputFullFormat,
    inputMonthFormat,
  } = useDatePreferences();

  const precisionProps = useDatePrecision(
    resource,
    precisionFieldName,
    defaultPrecision
  );
  const precision = precisionProps.precision[0];

  // Value field
  const dateField = React.useMemo(
    () =>
      dateFieldName === undefined
        ? undefined
        : resource?.specifyTable.getField(dateFieldName),
    [resource, dateFieldName]
  );

  const parser = React.useMemo(
    () => getDateParser(dateField, precision, defaultValue),
    [dateField, precision, defaultValue]
  );
  const validationAttributes = React.useMemo(
    () => getValidationAttributes(parser),
    [parser]
  );
  const {
    value: inputValue = '',
    updateValue: setInputValue,
    inputRef,
    validationRef,
    setValidation,
  } = useResourceValue<string | null>(resource, dateField, parser);

  const [moment, setMoment] = useMoment({
    resource,
    dateFieldName,
    precisionFieldName,
    defaultPrecision,
  });

  // ME: test unsetting the date
  useUnsetDanglingDatePrecision(
    resource,
    precisionFieldName,
    moment === undefined
  );

  /*
   * ME: can we simplify this or convert it to a callback function?
   *   or at least turn it into a hook?
   */
  const isReadOnly = React.useContext(ReadOnlyContext);
  const resolvedMoment = typeof moment === 'object' ? moment : undefined;
  React.useEffect(() => {
    if (resource === undefined || resolvedMoment?.isValid() !== true) return;

    const value = resolvedMoment.format(databaseDateFormat);

    if (
      precisionFieldName !== undefined &&
      typeof resource.get(precisionFieldName) !== 'number'
    )
      resource.set(precisionFieldName, datePrecisions[precision] as never, {
        silent: true,
      });

    if (!isReadOnly) {
      const oldRawDate = resource.get(dateFieldName);
      const oldDate =
        typeof oldRawDate === 'string' ? new Date(oldRawDate) : undefined;
      const newDate = resolvedMoment.toDate();
      /*
       * Back-end may return a date in a date-time format, which when converted
       * to date format causes front-end to trigger a needless unload protect
       * See https://github.com/specify/specify7/issues/2578. This fixes that
       */
      const isChanged =
        f.maybe(oldDate, getDateInputValue) !== getDateInputValue(newDate);
      resource.set(dateFieldName, value as never, { silent: !isChanged });
    }

    setValidation('');
    setInputValue(
      precision === 'full'
        ? resolvedMoment.format(inputFullFormat)
        : precision === 'month-year'
        ? resolvedMoment.format(inputMonthFormat)
        : resolvedMoment.year().toString()
    );
  }, [
    isReadOnly,
    setValidation,
    setInputValue,
    resource,
    resolvedMoment,
    precision,
    dateFieldName,
    precisionFieldName,
    inputFullFormat,
    inputMonthFormat,
  ]);

  const isValid = resolvedMoment?.isValid() !== false;
  React.useEffect(() => {
    if (isValid) return;
    setValidation(
      precision === 'full'
        ? formsText.requiredFormat({ format: fullDateFormat() })
        : precision === 'month-year'
        ? formsText.requiredFormat({ format: monthFormat() })
        : formsText.invalidDate()
    );
  }, [isValid, precision, setValidation]);

  return (
    <div className="flex w-full gap-1">
      {!isReadOnly && canChangePrecision ? (
        <DatePrecisionPicker
          moment={[
            resolvedMoment,
            (newMoment): void => {
              /*
               * This avoids the following message in the console:
               * "The specified value does not conform to the required format"
               */
              setInputValue('');

              setMoment(newMoment);
            },
          ]}
          onUpdatePrecision={
            resource === undefined
              ? undefined
              : (precisionIndex): void => {
                  if (typeof precisionFieldName === 'string')
                    resource?.bulkSet({ [precisionFieldName]: precisionIndex });
                }
          }
          {...precisionProps}
        />
      ) : undefined}
      <Input.Generic
        forwardRef={validationRef}
        id={id}
        isReadOnly={isReadOnly}
        required={isRequired}
        value={inputValue ?? ''}
        onBlur={(): void => {
          const input = inputRef.current;
          if (isReadOnly || input === null) return;
          const value = input.value.trim();
          const moment =
            value.length > 0 ? parseDate(precision, value) : undefined;
          setMoment(moment);
          if (moment === undefined) resource?.set(dateFieldName, null as never);
        }}
        onValueChange={setInputValue}
        {...(precision === 'year'
          ? {
              ...validationAttributes,
              placeholder: formsText.yearPlaceholder(),
            }
          : {
              ...(precision === 'month-year'
                ? {
                    type: monthType,
                    placeholder: monthFormat(),
                    title: resolvedMoment?.format(monthFormat()),
                    ...(monthSupported
                      ? {}
                      : {
                          minLength: monthFormat().length,
                          maxLength: monthFormat().length,
                        }),
                  }
                : {
                    type: dateType,
                    placeholder: fullDateFormat(),
                    title: resolvedMoment?.format(fullDateFormat()),
                    min: validationAttributes.min,
                    max: validationAttributes.max,
                  }),
            })}
      />
      {!isReadOnly &&
      ((precision === 'full' && !dateSupported) ||
        (precision === 'month-year' && !monthSupported)) ? (
        <Button.Icon
          aria-label={formsText.today()}
          icon="calendar"
          title={formsText.todayButtonDescription()}
          onClick={(): void => setMoment(dayjs())}
        />
      ) : undefined}
    </div>
  );
}
