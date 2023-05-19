import React from 'react';

import { useResourceValue } from '../../hooks/useResourceValue';
import { commonText } from '../../localization/common';
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
import type { GetSet, RR } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input, Select } from '../Atoms/Form';
import { dateParts } from '../Atoms/Internationalization';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import { userPreferences } from '../Preferences/userPreferences';

export function isInputSupported(type: string): boolean {
  const input = document.createElement('input');
  const value = 'a';
  input.setAttribute('type', type);
  input.setAttribute('value', value);
  return input.value !== value;
}

const precisions = { full: 1, 'month-year': 2, year: 3 } as const;
const reversePrecisions: RR<number, PartialDatePrecision> = {
  1: 'full',
  2: 'month-year',
  3: 'year',
};
export type PartialDatePrecision = keyof typeof precisions;

/*
 * TESTS: this has been very buggy. add tests
 * REFACTOR: split this component into smaller
 */
export function PartialDateUi<SCHEMA extends AnySchema>({
  resource,
  dateFieldName,
  precisionField: precisionFieldName,
  defaultPrecision,
  defaultValue,
  id,
  canChangePrecision = true,
}: {
  readonly resource: SpecifyResource<SCHEMA> | undefined;
  readonly dateFieldName: string & keyof SCHEMA['fields'];
  readonly precisionField: (string & keyof SCHEMA['fields']) | undefined;
  readonly defaultPrecision: PartialDatePrecision;
  readonly defaultValue: Date | undefined;
  readonly id: string | undefined;
  readonly canChangePrecision?: boolean;
}): JSX.Element {
  // Preferences
  const [useDatePicker] = userPreferences.use(
    'form',
    'ui',
    'useAccessibleFullDatePicker'
  );
  const [useMonthPicker] = userPreferences.use(
    'form',
    'ui',
    'useAccessibleMonthPicker'
  );
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

  const {
    precision: [precision, setPrecision],
    precisionValidationRef,
  } = useDatePrecision(resource, precisionFieldName, defaultPrecision);

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
    [defaultValue, precision]
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

  const syncMoment = React.useCallback(
    (moment: ReturnType<typeof dayjs> | undefined) => {
      const value = resource?.get(dateFieldName) ?? undefined;
      const newMoment =
        value === undefined
          ? undefined
          : dayjs(value, databaseDateFormat, true);

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
    if (resource === undefined) return;
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
    defaultValue,
    syncMoment,
  ]);

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
        resource.set(precisionFieldName, precisions[precision] as never, {
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
        <label>
          <span className="sr-only">{formsText.datePrecision()}</span>
          <Select
            className="!w-auto !min-w-[unset] print:hidden"
            forwardRef={precisionValidationRef}
            value={precision}
            onBlur={(): void => {
              if (moment === undefined) return;
              let newMoment = dayjs(moment);
              if (precision === 'year' || precision === 'month-year')
                newMoment = newMoment.date(1);
              if (precision === 'year') newMoment = newMoment.month(0);

              /*
               * This avoids the following message in the console:
               * "The specified value does not conform to the required format"
               */
              setInputValue('');

              setMoment(newMoment);
            }}
            onChange={({ target }): void => {
              if (resource === undefined) return;
              const precision = target.value as PartialDatePrecision;
              setPrecision(precision);
              const precisionIndex = precisions[precision];
              if (
                typeof moment === 'object' &&
                typeof precisionFieldName === 'string'
              )
                resource.set(precisionFieldName, precisionIndex as never);
            }}
          >
            <option value="full">{commonText.fullDate()}</option>
            <option value="month-year">{formsText.monthYear()}</option>
            <option value="year">{dateParts.year}</option>
          </Select>
        </label>
      ) : undefined}
      <Input.Generic
        forwardRef={validationRef}
        id={id}
        isReadOnly={isReadOnly}
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

function useDatePrecision<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA> | undefined,
  precisionFieldName: (string & keyof SCHEMA['fields']) | undefined,
  defaultPrecision: PartialDatePrecision
): {
  readonly precision: GetSet<PartialDatePrecision>;
  readonly precisionValidationRef: React.RefCallback<HTMLSelectElement>;
} {
  const precisionField = React.useMemo(
    () =>
      precisionFieldName === undefined
        ? undefined
        : resource?.specifyTable.getField(precisionFieldName),
    [resource, precisionFieldName]
  );
  const precisionParser = React.useMemo(
    () => ({ value: defaultPrecision }),
    [defaultPrecision]
  );
  const {
    value: numericPrecision,
    updateValue: setNumericPrecision,
    validationRef: precisionValidationRef,
  } = useResourceValue<keyof typeof reversePrecisions>(
    resource,
    precisionField,
    precisionParser
  );
  const precision =
    (numericPrecision === undefined
      ? undefined
      : reversePrecisions[numericPrecision]) ?? defaultPrecision;
  const setPrecision = React.useCallback(
    (precision: PartialDatePrecision) =>
      setNumericPrecision(precisions[precision] ?? defaultPrecision),
    [setNumericPrecision, defaultPrecision]
  );
  return { precision: [precision, setPrecision], precisionValidationRef };
}
