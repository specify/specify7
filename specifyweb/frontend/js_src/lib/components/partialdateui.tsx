import React from 'react';

import type { AnySchema } from '../datamodelutils';
import { databaseDateFormat, fullDateFormat, monthFormat } from '../dateformat';
import { dayjs, getDateInputValue } from '../dayjs';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { resourceOn } from '../resource';
import type { RR } from '../types';
import { getValidationAttributes, resolveParser } from '../uiparse';
import { Button, Input, Select } from './basic';
import { useValidation } from './hooks';
import { dateParts } from './internationalization';
import { usePref } from './preferenceshooks';
import { useSaveBlockers } from './resource';

export function isInputSupported(type: string): boolean {
  const input = document.createElement('input');
  const value = 'a';
  input.setAttribute('type', type);
  input.setAttribute('value', value);
  return input.value !== value;
}

const precisions = { full: 1, 'month-year': 2, year: 3 } as const;
const reversePrecision: RR<number, PartialDatePrecision> = {
  1: 'full',
  2: 'month-year',
  3: 'year',
};
export type PartialDatePrecision = keyof typeof precisions;

/**
 * An ugly workaround for a bug in day.js where any date in the MM/YYYY format is
 * parsed as an invalid date.
 */
function parseMonthYear(value: string): ReturnType<typeof dayjs> | undefined {
  const parsed = /(\d{2})\D(\d{4})/.exec(value)?.slice(1);
  if (typeof parsed === 'undefined') return undefined;
  const [month, year] = parsed.map(f.unary(Number.parseInt));
  return dayjs(new Date(year, month - 1));
}

export function PartialDateUi<SCHEMA extends AnySchema>({
  resource,
  dateField,
  precisionField,
  defaultPrecision,
  defaultValue,
  isReadOnly,
  id,
  canChangePrecision = true,
}: {
  readonly resource: SpecifyResource<SCHEMA>;
  readonly dateField: keyof SCHEMA['fields'] & string;
  readonly precisionField: (keyof SCHEMA['fields'] & string) | undefined;
  readonly defaultPrecision: PartialDatePrecision;
  readonly defaultValue: Date | undefined;
  readonly isReadOnly: boolean;
  readonly id: string | undefined;
  readonly canChangePrecision?: boolean;
}): JSX.Element {
  const [useDatePicker] = usePref('form', 'ui', 'useAccessibleFullDatePicker');
  const [useMonthPicker] = usePref('form', 'ui', 'useAccessibleMonthPicker');
  const {
    dateType,
    dateSupported,
    monthType,
    monthSupported,
    inputFullFormat,
    inputMonthFormat,
  } = React.useMemo(() => {
    const dateType = useDatePicker ? 'date' : 'text';
    const monthType = useMonthPicker ? 'month' : 'text';
    const dateSupported = useDatePicker && isInputSupported('date');
    const monthSupported = useMonthPicker && isInputSupported('month');

    return {
      dateType,
      dateSupported,
      monthType,
      monthSupported,
      /*
       * If input[type="date"] or input[type="month"] is not supported,
       * present the date in a more human-readable format
       */
      inputFullFormat: dateSupported ? databaseDateFormat : fullDateFormat(),
      inputMonthFormat: monthSupported ? 'YYYY-MM' : monthFormat(),
    };
  }, [useDatePicker, useMonthPicker]);

  const [precision, setPrecision] = React.useState<PartialDatePrecision>(
    () =>
      reversePrecision[resource.get(precisionField ?? '') as 1 | 2 | 3] ??
      defaultPrecision
  );

  const errors = useSaveBlockers({
    resource,
    fieldName: dateField as string,
  });
  const { inputRef, validationRef } = useValidation(errors);

  const syncMoment = React.useCallback(
    (moment: ReturnType<typeof dayjs> | undefined) => {
      const value = resource.get(dateField) ?? undefined;
      const newMoment =
        typeof value === 'undefined'
          ? undefined
          : dayjs(value, databaseDateFormat, true);

      return typeof moment === 'undefined' ||
        typeof newMoment === 'undefined' ||
        moment.toJSON() !== newMoment.toJSON()
        ? newMoment
        : moment;
    },
    [resource, dateField]
  );

  // Parsed date object
  const [moment, setMoment] = React.useState<
    ReturnType<typeof dayjs> | undefined
  >(() => syncMoment(undefined));
  // Unparsed raw input
  const [inputValue, setInputValue] = React.useState('');

  const isSettingInitialMoment = React.useRef<boolean>(true);

  React.useEffect(() => {
    if (typeof defaultValue === 'object' && resource.isNew())
      resource.set(dateField, getDateInputValue(defaultValue) as never, {
        silent: true,
      });

    isSettingInitialMoment.current = true;

    const destructor = resourceOn(
      resource,
      `change:${dateField}`,
      () => setMoment(syncMoment),
      true
    );
    const precisionDestructor =
      typeof precisionField === 'string'
        ? resourceOn(
            resource,
            `change:${precisionField}`,
            (): void =>
              setPrecision(
                reversePrecision[resource.get(precisionField) as 1 | 2 | 3] ??
                  defaultPrecision
              ),
            true
          )
        : undefined;

    return (): void => {
      destructor();
      precisionDestructor?.();
    };
  }, [
    resource,
    dateField,
    precisionField,
    defaultPrecision,
    defaultValue,
    syncMoment,
  ]);

  React.useEffect(() => {
    if (typeof moment === 'undefined') {
      resource.set(dateField, null as never);
      resource.saveBlockers?.remove(`invaliddate:${dateField}`);
    } else if (moment.isValid()) {
      const value = moment.format(databaseDateFormat);

      if (isSettingInitialMoment.current)
        /*
         * Don't set the value on the first run
         * If this isn't done, unload protect would be needlessly triggered if
         * current value in the date field does not exactly match the formatted
         * value (i.e, happens for timestampModified fields since those include
         * time, whereas formatted date doesn't)
         */
        isSettingInitialMoment.current = false;
      else resource.set(dateField, value as never);
      resource.saveBlockers?.remove(`invaliddate:${dateField}`);

      if (precision === 'full') setInputValue(moment.format(inputFullFormat));
      else if (precision === 'month-year')
        setInputValue(moment.format(inputMonthFormat));
      else setInputValue(moment.year().toString());
    } else {
      const validationMessage =
        precision === 'full'
          ? formsText('requiredFormat', fullDateFormat())
          : precision === 'month-year'
          ? formsText('requiredFormat', monthFormat())
          : formsText('invalidDate');
      resource.saveBlockers?.add(
        `invaliddate:${dateField}`,
        dateField,
        validationMessage
      );
    }
  }, [
    resource,
    moment,
    precision,
    dateField,
    precisionField,
    inputFullFormat,
    inputMonthFormat,
  ]);

  function handleChange(initialValue?: string): void {
    const input = inputRef.current;
    if (isReadOnly || input === null) return;

    const value = initialValue ?? inputValue.trim();

    setMoment(
      value.length > 0
        ? (precision === 'month-year' ? parseMonthYear(value) : undefined) ??
            dayjs(
              value,
              /*
               * The date would be in the first format if browser supports
               * input[type="date"] or input[type="month"]
               * The date would be in the second format if browser does not support
               * those inputs, or on date paste
               */
              precision === 'full'
                ? ['YYYY-MM-DD', fullDateFormat()]
                : [
                    ...(precision === 'year' ? ['YYYY'] : []),
                    'YYYY-MM',
                    monthFormat(),
                    fullDateFormat(),
                  ],
              true
            )
        : undefined
    );
  }

  return (
    <div className="gap-x-1 flex">
      {!isReadOnly && canChangePrecision ? (
        <label>
          <span className="sr-only">{formsText('datePrecision')}</span>
          <Select
            className="print:hidden !w-auto"
            title={formsText('datePrecision')}
            value={precision}
            onChange={({ target }): void => {
              const precision = target.value as PartialDatePrecision;
              setPrecision(precision);
              const precisionIndex = precisions[precision];
              if (typeof precisionField === 'string')
                resource.set(precisionField, precisionIndex as never);
              resource.saveBlockers?.remove(`invaliddate:${dateField}`);
            }}
            onBlur={(): void => {
              if (typeof moment === 'undefined') return;
              let newMoment = dayjs(moment);
              if (precision === 'year' || precision === 'month-year')
                newMoment = newMoment.date(1);
              if (precision === 'year') newMoment = newMoment.month(0);

              /*
               * This avoids the following value in the console:
               * "The specified value does not conform to the required format"
               */
              setInputValue('');

              setMoment(newMoment);
            }}
          >
            <option value="full">{commonText('fullDate')}</option>
            <option value="month-year">{formsText('monthYear')}</option>
            <option value="year">{dateParts.year}</option>
          </Select>
        </label>
      ) : undefined}
      <Input.Generic
        id={id}
        isReadOnly={isReadOnly}
        forwardRef={validationRef}
        onValueChange={setInputValue}
        onDatePaste={handleChange}
        onBlur={f.zero(handleChange)}
        value={inputValue}
        {...(precision === 'year'
          ? {
              ...getValidationAttributes(resolveParser({}, { type: 'year' })),
              placeholder: formsText('yearPlaceholder'),
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
                    ...(dateSupported
                      ? {}
                      : {
                          minLength: fullDateFormat().length,
                          maxLength: fullDateFormat().length,
                        }),
                  }),
            })}
      />
      {!isReadOnly &&
      ((precision === 'full' && !dateSupported) ||
        (precision === 'month-year' && !monthSupported)) ? (
        <Button.Icon
          icon="calendar"
          title={formsText('todayButtonDescription')}
          aria-label={formsText('today')}
          onClick={(): void => setMoment(dayjs())}
        />
      ) : undefined}
    </div>
  );
}
