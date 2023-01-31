/**
 * Relative dates as filters in query builder
 */

import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useTriggerState } from '../../hooks/useTriggerState';
import { queryText } from '../../localization/query';
import { databaseDateFormat } from '../../utils/dateFormat';
import { dayjs } from '../../utils/dayJs';
import { f } from '../../utils/functools';
import type { Parser } from '../../utils/parser/definitions';
import { parseRelativeDate, reParse } from '../../utils/relativeDate';
import { Button } from '../Atoms/Button';
import { Input, Select } from '../Atoms/Form';
import { QueryInputField } from './FieldFilter';

export function DateQueryInputField({
  currentValue,
  label,
  parser,
  onChange: handleChange,
  fieldName,
}: {
  readonly currentValue: string;
  readonly label?: string;
  readonly parser: Parser;
  readonly fieldName: string;
  readonly onChange: ((newValue: string) => void) | undefined;
}): JSX.Element | null {
  const [absolute, setAbsolute] = React.useState(() =>
    reParse.test(currentValue) ? undefined : currentValue
  );
  const [relative, setRelative] = React.useState(() =>
    reParse.test(currentValue) ? currentValue : undefined
  );

  const parsed = React.useMemo(() => {
    if (relative !== undefined) {
      const parsedValue = reParse.exec(relative.toLowerCase())?.slice(1);
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

  return (
    <div className="flex items-center">
      <Button.Icon
        icon="switch"
        title="switch"
        onClick={(): void => {
          toggleAbsolute();
          if (!isAbsolute) {
            if (reParse.test(currentValue)) {
              const parsedDate = dayjs(parseRelativeDate(currentValue)).format(
                databaseDateFormat
              );
              handleChange?.(parsedDate);
              setRelative(currentValue);
              setAbsolute((oldAbsolute) => oldAbsolute || parsedDate);
            }
          } else {
            setRelative((oldRelative) =>
              parsed === undefined ? 'today + 0 day' : oldRelative
            );
            setAbsolute(currentValue);
            if (parsed === undefined) {
              handleChange?.('today + 0 day');
            }
          }
        }}
      />
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

  return (
    <div className="flex flex-row gap-1">
      <Select
        value={direction}
        onBlur={({ target }): void => {
          setValues({ ...values, direction: target.value });
          handleChange?.(`today ${target.value} ${size} ${type}`);
        }}
        onValueChange={(newValue): void => {
          setValues({ ...values, direction: newValue });
          handleChanging?.();
        }}
      >
        <option value="+">{queryText.future()}</option>
        <option value="-">{queryText.past()}</option>
      </Select>
      <Input.Number
        min={0}
        value={size}
        onBlur={({ target }): void => {
          const newSize = f.parseInt(target.value);
          if (newSize === undefined) return;
          handleChange?.(`today ${direction} ${newSize} ${type}`);
        }}
        onValueChange={(value): void => {
          setValues({
            ...values,
            size: value,
          });
          handleChanging?.();
        }}
      />
      <Select
        value={type}
        onBlur={({ target }): void => {
          setValues({ ...values, type: target.value });
          handleChange?.(`today ${direction} ${size} ${target.value}`);
        }}
        onValueChange={(newValue) => {
          setValues({ ...values, type: newValue });
          handleChanging?.();
        }}
      >
        <option value="day">{queryText.day()}</option>
        <option value="week">{queryText.week()}</option>
        <option value="month">{queryText.month()}</option>
        <option value="year">{queryText.year()}</option>
      </Select>
    </div>
  );
}
