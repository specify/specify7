import React from 'react';

import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { dayjs, getDateInputValue } from '../../utils/dayJs';
import { f } from '../../utils/functools';
import { databaseDateFormat } from '../../utils/parser/dateConfig';
import { fullDateFormat, monthFormat } from '../../utils/parser/dateFormat';
import { parseDate } from '../../utils/parser/dayJsFixes';
import {
  getValidationAttributes,
  resolveParser,
} from '../../utils/parser/definitions';
import type { RR } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input, Select } from '../Atoms/Form';
import { dateParts } from '../Atoms/Internationalization';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import { userPreferences } from '../Preferences/userPreferences';
import { useSaveBlockers } from '../DataModel/saveBlockers';

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

/*
 * TESTS: this has been very buggy. add tests
 * REFACTOR: split this component into smaller
 */
export function PartialDateUi<SCHEMA extends AnySchema>({
  resource,
  dateFieldName,
  precisionField,
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

  const [precision, setPrecision] = React.useState<PartialDatePrecision>(
    () =>
      reversePrecision[resource?.get(precisionField ?? '') as 1 | 2 | 3] ??
      defaultPrecision
  );

  const table = resource?.specifyTable;
  const dateField = React.useMemo(
    () => table?.getField(dateFieldName),
    [table, dateFieldName]
  );
  const [blockers, setBlockers] = useSaveBlockers(resource, dateField);
  const { inputRef, validationRef } = useValidation(blockers);

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
  // Unparsed raw input
  const [inputValue, setInputValue] = React.useState('');

  const isInitialized = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (resource === undefined) return;
    if (
      typeof defaultValue === 'object' &&
      typeof resource === 'object' &&
      resource.isNew()
    )
      resource.set(dateFieldName, getDateInputValue(defaultValue) as never, {
        silent: true,
      });

    isInitialized.current = false;

    const destructor = resourceOn(
      resource,
      `change:${dateFieldName}`,
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
    dateFieldName,
    precisionField,
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
        precisionField !== undefined &&
        typeof resource.get(precisionField) !== 'number'
      )
        resource.set(precisionField, null as never, {
          silent: true,
        });
      setBlockers((blockers) => [...blockers, formsText.invalidDate()]);
      setInputValue('');
    } else if (moment.isValid()) {
      const value = moment.format(databaseDateFormat);

      if (
        precisionField !== undefined &&
        typeof resource.get(precisionField) !== 'number'
      )
        resource.set(precisionField, precisions[precision] as never, {
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
      setBlockers((blockers) =>
        blockers.filter((error) => error !== formsText.invalidDate())
      );

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
      resource.saveBlockers?.add(
        `invaliddate:${dateFieldName}`,
        dateFieldName,
        validationMessage
      );
    }
  }, [
    setBlockers,
    resource,
    moment,
    precision,
    dateFieldName,
    precisionField,
    inputFullFormat,
    inputMonthFormat,
  ]);

  function handleChange(initialValue?: string): void {
    const input = inputRef.current;
    if (isReadOnly || input === null) return;

    const value = initialValue ?? input.value.trim();

    setMoment(value.length > 0 ? parseDate(precision, value) : undefined);
  }

  const validationAttributes = React.useMemo(
    () =>
      precision === 'month-year'
        ? {}
        : getValidationAttributes(
            resolveParser(
              {},
              { type: precision === 'full' ? 'java.util.Date' : precision }
            )
          ),
    [precision]
  );

  return (
    <div className="flex w-full gap-1">
      {!isReadOnly && canChangePrecision ? (
        <label>
          <span className="sr-only">{formsText.datePrecision()}</span>
          <Select
            className="!w-auto !min-w-[unset] print:hidden"
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
                typeof precisionField === 'string'
              )
                resource.set(precisionField, precisionIndex as never);
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
        value={inputValue}
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
