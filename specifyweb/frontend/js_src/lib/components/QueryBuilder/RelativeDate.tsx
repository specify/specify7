/**
 * Relative dates as filters in query builder
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useTriggerState } from '../../hooks/useTriggerState';
import { queryText } from '../../localization/query';
import { StringToJsx } from '../../localization/utils';
import { dayjs } from '../../utils/dayJs';
import { databaseDateFormat } from '../../utils/parser/dateConfig';
import type { Parser } from '../../utils/parser/definitions';
import { parseAnyDate, reRelativeDate, today } from '../../utils/relativeDate';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Select } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { QueryInputField } from './FieldFilter';

export function DateQueryInputField({
  currentValue,
  label,
  parser,
  onChange: handleChange,
  fieldName,
}: {
  readonly currentValue: string;
  readonly label?: LocalizedString;
  readonly parser: Parser;
  readonly fieldName: string;
  readonly onChange: ((newValue: string) => void) | undefined;
}): JSX.Element | null {
  const [absolute, setAbsolute] = React.useState(() =>
    reRelativeDate.test(currentValue) ? undefined : currentValue
  );
  const [relative, setRelative] = React.useState(() =>
    reRelativeDate.test(currentValue) ? currentValue : undefined
  );

  const parsed = React.useMemo(() => {
    if (relative !== undefined) {
      const parsedValue = reRelativeDate.exec(relative.toLowerCase())?.slice(1);
      return typeof parsedValue === 'object'
        ? {
            direction: parsedValue[0],
            size: Number.parseInt(parsedValue[1]),
            type: parsedValue[2],
          }
        : undefined;
    }
    return undefined;
  }, [relative]);

  const [isAbsolute, _, __, toggleAbsolute] = useBooleanState(
    parsed === undefined
  );
  const title = isAbsolute
    ? queryText.switchToRelative()
    : queryText.switchToAbsolute();
  return (
    <div className="flex items-center gap-2">
      <Button.Small
        aria-label={title}
        aria-pressed={!isAbsolute}
        className="print:hidden"
        disabled={handleChange === undefined}
        title={title}
        variant={className.secondaryLightButton}
        onClick={(): void => {
          toggleAbsolute();
          if (isAbsolute) {
            setRelative((oldRelative) =>
              parsed === undefined ? `${today} + 0 day` : oldRelative
            );
            setAbsolute(currentValue);
            if (parsed === undefined) {
              handleChange?.(`${today} + 0 day`);
            }
          } else {
            if (reRelativeDate.test(currentValue)) {
              const parsedDate = dayjs(parseAnyDate(currentValue)).format(
                databaseDateFormat
              );
              handleChange?.(parsedDate);
              setRelative(currentValue);
              setAbsolute((oldAbsolute) => oldAbsolute ?? parsedDate);
            }
          }
        }}
      >
        {icons.history}
      </Button.Small>
      {isAbsolute ? (
        <QueryInputField
          currentValue={absolute ?? currentValue}
          fieldName={fieldName}
          label={label}
          parser={parser}
          pickListItems={undefined}
          onChange={handleChange}
        />
      ) : typeof parsed === 'object' ? (
        <DateSplit
          parsed={parsed}
          onChange={handleChange}
          onChanging={
            absolute === undefined
              ? undefined
              : (): void => setAbsolute(undefined)
          }
        />
      ) : undefined}
    </div>
  );
}

function DateSplit({
  onChange: handleChange,
  parsed,
  onChanging: handleChanging,
}: {
  readonly parsed: {
    readonly direction: string;
    readonly type: string;
    readonly size: number;
  };
  readonly onChange: ((newValue: string) => void) | undefined;
  readonly onChanging: (() => void) | undefined;
}): JSX.Element {
  const [values, setValues] = useTriggerState<{
    readonly direction: string;
    readonly type: string;
    readonly size: number;
  }>(parsed);
  const { direction, size, type } = values;
  const commitChange = () =>
    handleChange?.(`${today} ${direction} ${size} ${type}`);
  return (
    <div className="flex flex-row gap-1">
      <StringToJsx
        components={{
          count: (size) => (
            <Input.Integer
              disabled={handleChange === undefined}
              min={0}
              value={size}
              onBlur={commitChange}
              onValueChange={(value): void => {
                setValues({
                  ...values,
                  size: value,
                });
                handleChanging?.();
              }}
            />
          ),
          length: (type) => (
            <Select
              disabled={handleChange === undefined}
              value={type}
              onBlur={commitChange}
              onValueChange={(newValue) => {
                setValues({ ...values, type: newValue });
                handleChanging?.();
              }}
            >
              <option value="day">{queryText.days()}</option>
              <option value="week">{queryText.weeks()}</option>
              <option value="month">{queryText.months()}</option>
              <option value="year">{queryText.years()}</option>
            </Select>
          ),
          direction: (direction) => (
            <Select
              disabled={handleChange === undefined}
              value={direction}
              onBlur={commitChange}
              onValueChange={(newValue): void => {
                setValues({ ...values, direction: newValue });
                handleChanging?.();
              }}
            >
              <option value="-">{queryText.past()}</option>
              <option value="+">{queryText.future()}</option>
            </Select>
          ),
        }}
        string={queryText.relativeDate({
          size,
          type,
          direction,
        })}
      />
    </div>
  );
}
