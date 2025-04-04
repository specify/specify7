import React from 'react';

import { useValidation } from '../../hooks/useValidation';
import { formsText } from '../../localization/forms';
import { dayjs } from '../../utils/dayJs';
import { fullDateFormat, monthFormat } from '../../utils/parser/dateFormat';
import { parseDate } from '../../utils/parser/dayJsFixes';
import type { Parser } from '../../utils/parser/definitions';
import { getValidationAttributes } from '../../utils/parser/definitions';
import type { GetSet } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { PartialDatePrecision } from './useDatePrecision';
import { useDatePreferences } from './useDatePreferences';

/** A date picker for a given precision (full, month-year, year) */
export function DateInput({
  moment: [moment, setMoment],
  precision,
  parser,
  id,
  isRequired,
}: {
  readonly moment: GetSet<ReturnType<typeof dayjs> | undefined>;
  readonly precision: PartialDatePrecision;
  readonly parser: Parser;
  readonly id?: string;
  readonly isRequired?: boolean;
}): JSX.Element {
  const {
    dateType,
    dateSupported,
    monthType,
    monthSupported,
    inputFullFormat,
    inputMonthFormat,
  } = useDatePreferences();

  const isReadOnly = React.useContext(ReadOnlyContext);
  const validationAttributes = React.useMemo(
    () => getValidationAttributes(parser),
    [parser]
  );

  const [inputValue, setInputValue] = React.useState('');
  const inputValueRef = React.useRef(inputValue);
  inputValueRef.current = inputValue;

  /*
   * This state allows for:
   * When precision changes, only render the input for the new precision once
   * the useEffect below got a chance to re-format the date to new precision.
   * Otherwise, input with new precision would be rendered once with old
   * formatted date, resulting in warnings in the console
   */
  const [localPrecision, setLocalPrecision] = React.useState(precision);

  React.useEffect(() => {
    const formattedValue =
      moment === undefined
        ? ''
        : moment.isValid()
          ? precision === 'full'
            ? moment.format(inputFullFormat)
            : precision === 'month-year'
              ? moment.format(inputMonthFormat)
              : moment.year().toString()
          : inputValueRef.current;
    if (inputValueRef.current !== formattedValue) {
      setInputValue(formattedValue);
      inputValueRef.current = formattedValue;
    }
    setLocalPrecision(precision);
  }, [moment, precision, inputFullFormat, inputMonthFormat]);

  const isValid = moment === undefined || moment.isValid();
  const { validationRef } = useValidation(
    isValid
      ? ''
      : precision === 'full'
        ? formsText.requiredFormat({ format: fullDateFormat() })
        : precision === 'month-year'
          ? formsText.requiredFormat({ format: monthFormat() })
          : formsText.invalidDate()
  );

  return (
    <>
      <Input.Generic
        forwardRef={validationRef}
        id={id}
        isReadOnly={isReadOnly}
        required={isRequired}
        value={inputValue ?? ''}
        onBlur={({ target }): void => {
          const input = target as HTMLInputElement;
          if (isReadOnly || input === null) return;
          const value = input.value.trim();
          const moment =
            value.length > 0 ? parseDate(precision, value) : undefined;
          setMoment(moment);
        }}
        onValueChange={setInputValue}
        {...(localPrecision === 'year'
          ? {
              ...validationAttributes,
              placeholder: formsText.yearPlaceholder(),
            }
          : {
              ...(localPrecision === 'month-year'
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
      {
        /**
         * Modern date and month picker has a "today" button. If using text
         * field instead of date picker, add the "today" button manually.
         */
        !isReadOnly &&
        ((precision === 'full' && !dateSupported) ||
          (precision === 'month-year' && !monthSupported)) ? (
          <Button.Icon
            aria-label={formsText.today()}
            className="print:hidden"
            icon="calendar"
            title={formsText.todayButtonDescription()}
            onClick={(): void => setMoment(dayjs())}
          />
        ) : undefined
      }
    </>
  );
}
