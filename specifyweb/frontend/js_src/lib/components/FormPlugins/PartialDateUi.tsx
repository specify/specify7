import React from 'react';

import { useResourceValue } from '../../hooks/useResourceValue';
import { formsText } from '../../localization/forms';
import { dayjs, getDateInputValue } from '../../utils/dayJs';
import { f } from '../../utils/functools';
import { databaseDateFormat } from '../../utils/parser/dateConfig';
import { fullDateFormat, monthFormat } from '../../utils/parser/dateFormat';
import { parseDate } from '../../utils/parser/dayJsFixes';
import type { Parser } from '../../utils/parser/definitions';
import {
  getValidationAttributes,
  resolveParser,
} from '../../utils/parser/definitions';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { DatePrecisionPicker } from './DatePrecisionPicker';
import type { PartialDatePrecision } from './useDatePrecision';
import { datePrecisions, useDatePrecision } from './useDatePrecision';
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

  const parser = React.useMemo<Parser>(
    () => ({
      value: f.maybe(defaultValue, getDateInputValue),
    }),
    [defaultValue]
  );

  const validationAttributes = React.useMemo(
    () =>
      precision === 'month-year'
        ? {}
        : getValidationAttributes({
            ...resolveParser(dateField ?? {}, {
              type: precision === 'full' ? 'java.util.Date' : precision,
            }),
            ...parser,
          }),
    [dateField, parser, precision]
  );
  const {
    value: inputValue = '',
    updateValue: setInputValue,
    inputRef,
    validationRef,
    setValidation,
  } = useResourceValue<string | null>(resource, dateField, parser);

  const [moment, setMoment, isInitialized] = useMoment({
    resource,
    dateFieldName,
    precisionFieldName,
    defaultPrecision,
  });

  const isReadOnly = React.useContext(ReadOnlyContext);
  React.useEffect(() => {
    if (resource === undefined) return;
    /*
     * If resource changes, a new moment is set, but its value won't get
     * propagated on the first call to this useEffect.
     * It is demonstrated here: https://codepen.io/maxpatiiuk/pen/oNqNqVN
     */
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }

    if (moment === undefined) {
      resource.set(dateFieldName, null as never);

      // Unset precision if set
      if (
        precisionFieldName !== undefined &&
        typeof resource.get(precisionFieldName) !== 'number'
      )
        resource.set(precisionFieldName, null as never, {
          silent: true,
        });

      setValidation(formsText.invalidDate());
      setInputValue('');
    } else if (moment.isValid()) {
      const value = moment.format(databaseDateFormat);

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
        const newDate = moment.toDate();
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

      if (precision === 'full') setInputValue(moment.format(inputFullFormat));
      else if (precision === 'month-year')
        setInputValue(moment.format(inputMonthFormat));
      else setInputValue(moment.year().toString());
    } else {
      const validationMessage =
        precision === 'full'
          ? formsText.requiredFormat({ format: fullDateFormat() })
          : precision === 'month-year'
          ? formsText.requiredFormat({ format: monthFormat() })
          : formsText.invalidDate();
      setValidation(validationMessage);
    }
  }, [
    isReadOnly,
    setValidation,
    setInputValue,
    resource,
    moment,
    precision,
    dateFieldName,
    precisionFieldName,
    inputFullFormat,
    inputMonthFormat,
  ]);

  function handleChange(initialValue?: string): void {
    const input = inputRef.current;
    if (isReadOnly || input === null) return;

    const value = initialValue ?? input.value.trim();

    setMoment(value.length > 0 ? parseDate(precision, value) : undefined);
  }

  return (
    <div className="flex w-full gap-1">
      {!isReadOnly && canChangePrecision ? (
        <DatePrecisionPicker
          moment={[
            moment,
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
        onBlur={f.zero(handleChange)}
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
                    title: moment?.format(monthFormat()),
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
                    title: moment?.format(fullDateFormat()),
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
