import React from 'react';

import type { AnySchema } from '../datamodelutils';
import {
  accessibleDatePickerEnabled,
  accessibleMonthPickerEnabled,
  databaseDateFormat,
  fullDateFormat,
  monthFormat,
} from '../dateformat';
import { dayjs, getDateInputValue } from '../dayjs';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { RR } from '../types';
import { defined } from '../types';
import { getValidationAttributes, resolveParser } from '../uiparse';
import { Button, Input, Select } from './basic';
import { useValidation } from './hooks';
import { dateParts } from './internationalization';
import { useSaveBlockers } from './resource';

export function isInputSupported(type: string): boolean {
  const input = document.createElement('input');
  const value = 'a';
  input.setAttribute('type', type);
  input.setAttribute('value', value);
  return input.value !== value;
}

/*
 * If input[type="date"] or input[type="month"] is not supported,
 * present the date in a more human readable format
 */

const inputTypeYearAttributes = getValidationAttributes(
  defined(resolveParser({}, { type: 'year' }))
);

const precisions = { full: 1, 'month-year': 2, year: 3 } as const;
const reversePrecision: RR<number, PartialDatePrecision> = {
  1: 'full',
  2: 'month-year',
  3: 'year',
};
export type PartialDatePrecision = keyof typeof precisions;

// These may be reassigned after remotePrefs are loaded:
let dateType = 'date';
let monthType = 'month';
let dateSupported = isInputSupported('date');
let monthSupported = isInputSupported('month');
let inputFullFormat = databaseDateFormat;
let inputMonthFormat = 'YYYY-MM';

function checkBrowserSupport(): void {
  if (!accessibleDatePickerEnabled()) {
    dateType = 'text';
    dateSupported = false;
  }
  if (!dateSupported) inputFullFormat = fullDateFormat();

  if (!accessibleMonthPickerEnabled()) {
    monthType = 'text';
    monthSupported = false;
  }
  if (!monthSupported) inputMonthFormat = monthFormat();
}

export function PartialDateUi<SCHEMA extends AnySchema>({
  resource,
  dateField,
  precisionField,
  defaultPrecision,
  defaultValue,
  isReadOnly,
  id,
}: {
  readonly resource: SpecifyResource<SCHEMA>;
  readonly dateField: keyof SCHEMA['fields'] & string;
  readonly precisionField: (keyof SCHEMA['fields'] & string) | undefined;
  readonly defaultPrecision: PartialDatePrecision;
  readonly defaultValue: 'today' | undefined;
  readonly isReadOnly: boolean;
  readonly id: string | undefined;
}): JSX.Element {
  React.useEffect(checkBrowserSupport, []);

  const [precision, setPrecision] = React.useState<PartialDatePrecision>(
    () =>
      reversePrecision[resource.get(precisionField ?? '') as 1 | 2 | 3] ??
      defaultPrecision
  );

  const errors = useSaveBlockers({
    model: resource,
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
    resource.settingDefaultValues(() =>
      defaultValue === 'today' && resource.isNew()
        ? resource.set(dateField, getDateInputValue(new Date()) as never)
        : undefined
    );

    function setInput(): void {
      const value = resource.get(dateField);
      setMoment(
        value === null ? undefined : dayjs(value, databaseDateFormat, true)
      );
    }

    const changePrecision = (): void =>
      setPrecision(
        reversePrecision[resource.get(precisionField ?? '') as 1 | 2 | 3] ??
          defaultPrecision
      );

    resource.on(`change:${dateField}`, setInput);
    if (typeof precisionField === 'string')
      resource.on(`change:${precisionField}`, changePrecision);

    setInput();
    changePrecision();

    return (): void => {
      resource.off(`change:${dateField}`, setInput);
      if (typeof precisionField === 'string')
        resource.off(`change:${precisionField}`, changePrecision);
    };
  }, [resource, dateField, precisionField, defaultPrecision, defaultValue]);

  const renderCount = React.useRef(0);
  React.useEffect(() => {
    renderCount.current += 1;
    /*
     * Don't update the value in the resource on the initial useEffect execution
     * since "moment" is still undefined
     */
    if (renderCount.current === 1) return;

    // Don't trigger unload protect when setting default value
    if (renderCount.current === 2) resource.settingDefaultValues(process);
    else process();

    function process(): void {
      if (typeof moment === 'undefined') {
        resource.set(dateField, null as never);
        if (typeof precisionField === 'string')
          resource.set(precisionField, null as never);
        resource.saveBlockers.remove(`invaliddate:${dateField}`);
      } else if (moment.isValid()) {
        const value = moment.format(databaseDateFormat);
        resource.set(dateField, value as never);
        if (typeof precisionField === 'string')
          resource.set(precisionField, precisions[precision] as never);
        resource.saveBlockers.remove(`invaliddate:${dateField}`);
      } else {
        const validationMessage =
          precision === 'full'
            ? formsText('requiredFormat')(fullDateFormat())
            : precision === 'month-year'
            ? formsText('requiredFormat')(monthFormat())
            : formsText('invalidDate');
        resource.saveBlockers.add(
          `invaliddate:${dateField}`,
          dateField,
          validationMessage
        );
      }
    }
  }, [resource, moment, precision, dateField, precisionField]);

  function handleChange() {
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
      {!isReadOnly && (
        <label>
          <span className="sr-only">{formsText('datePrecision')}</span>
          <Select
            className="print:hidden"
            title={formsText('datePrecision')}
            value={precision}
            onChange={({ target }): void => {
              const precision = target.value as PartialDatePrecision;
              setPrecision(precision);
              const precisionIndex = precisions[precision];
              if (typeof precisionField === 'string')
                // @ts-expect-error Typing for dynamic references is not great
                resource.set(precisionField, precisionIndex);
              resource.saveBlockers.remove(`invaliddate:${dateField}`);
            }}
            onBlur={(): void => {
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
      )}
      <label>
        <span className="sr-only">
          {precision === 'year'
            ? dateParts.year
            : precision === 'month-year'
            ? formsText('monthYear')
            : commonText('fullDate')}
        </span>
        <Input.Generic
          id={id}
          isReadOnly={isReadOnly}
          forwardRef={validationRef}
          {...(precision === 'year'
            ? {
                ...inputTypeYearAttributes,
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
      </label>
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
