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
  const formattedValue =
    moment === undefined
      ? ''
      : moment.isValid()
      ? precision === 'full'
        ? moment.format(inputFullFormat)
        : precision === 'month-year'
        ? moment.format(inputMonthFormat)
        : moment.year().toString()
      : inputValue;

  React.useEffect(() => {
    if (inputValue !== formattedValue) setInputValue(formattedValue);
  }, [inputValue, formattedValue]);

  const isValid = moment?.isValid() !== false;
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
    </>
  );
}
