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
       * present the date in a more human readable format
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

  // Parsed date object
  const [moment, setMoment] = React.useState<
    ReturnType<typeof dayjs> | undefined
  >(undefined);
  const validDate = moment?.isValid() === true ? moment : undefined;
  // Unparsed raw input
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    // This is needed in case `resource` changes
    setInputValue('');

    // Not sure if this should be disabled if isReadOnly
    if (typeof defaultValue === 'object' && resource.isNew())
      resource.set(dateField, getDateInputValue(defaultValue) as never, {
        silent: true,
      });

    const destructor = resourceOn(
      resource,
      `change:${dateField}`,
      (): void => {
        const value = resource.get(dateField);
        setInputValue(value ?? '');
        setMoment(
          typeof value === 'undefined' || value === null
            ? undefined
            : dayjs(value, databaseDateFormat, true)
        );
      },
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
  }, [resource, dateField, precisionField, defaultPrecision, defaultValue]);

  const renderCount = React.useRef(0);
  React.useEffect(() => {
    renderCount.current = 0;
  }, [resource]);
  React.useEffect(() => {
    renderCount.current += 1;
    /*
     * Don't update the value in the resource on the initial useEffect execution
     * since "moment" is still undefined
     */
    if (renderCount.current === 1) return;

    // Don't trigger unload protect when setting default value
    const options = { silent: renderCount.current === 2 };

    if (typeof moment === 'undefined') {
      resource.set(dateField, null as never, options);
      resource.saveBlockers?.remove(`invaliddate:${dateField}`);
    } else if (moment.isValid()) {
      const value = moment.format(databaseDateFormat);
      resource.set(dateField, value as never, options);
      resource.saveBlockers?.remove(`invaliddate:${dateField}`);
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
  }, [resource, moment, precision, dateField, precisionField]);

  function handleChange() {
    if (isReadOnly) return;

    const input = inputRef.current;
    if (input === null || precision === 'year') return;

    const value = inputValue.trim();

    if (value === '') {
      setMoment(undefined);
      return;
    }
    /*
     * The date would be in this format if browser supports
     * input[type="date"] or input[type="month"]
     */
    const newMoment = dayjs(
      value,
      precision === 'full' ? 'YYYY-MM-DD' : 'YYYY-MM',
      true
    );
    /*
     * As a fallback, and on manual paste, default to preferred
     * date format
     */
    if (newMoment.isValid()) setMoment(newMoment);
    else
      setMoment(
        dayjs(
          value,
          precision === 'full' ? fullDateFormat() : monthFormat(),
          true
        )
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
                newMoment = newMoment.month(0);
              if (precision === 'month-year') newMoment = newMoment.date(1);

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
        {...(precision === 'year'
          ? {
              ...getValidationAttributes(resolveParser({}, { type: 'year' })),
              placeholder: formsText('yearPlaceholder'),
              // Format parsed date if valid. Else, use raw input
              value: validDate?.format('YYYY') ?? inputValue,
              onValueChange: (value): void => {
                setInputValue(value);
                const year = f.parseInt(value);
                if (typeof year === 'number')
                  setMoment(dayjs(moment).year(year));
              },
            }
          : {
              onBlur: handleChange,
              onValueChange(value): void {
                setInputValue(value);
                setMoment(undefined);
              },
              ...(precision === 'month-year'
                ? {
                    type: monthType,
                    placeholder: monthFormat(),
                    // Format parsed date if valid. Else, use raw input
                    value: validDate?.format(inputMonthFormat) ?? inputValue,
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
                    // Format parsed date if valid. Else, use raw input
                    value: validDate?.format(inputFullFormat) ?? inputValue,
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
