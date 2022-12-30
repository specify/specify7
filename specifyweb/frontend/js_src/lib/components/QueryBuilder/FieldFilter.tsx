import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useTriggerState } from '../../hooks/useTriggerState';
import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { Parser } from '../../utils/parser/definitions';
import {
  getValidationAttributes,
  pluralizeParser,
} from '../../utils/parser/definitions';
import type {
  InvalidParseResult,
  ValidParseResult,
} from '../../utils/parser/parse';
import { parseValue } from '../../utils/parser/parse';
import { reParse, parseRelativeDate } from '../../utils/relativeDate';
import type { RA, RR } from '../../utils/types';
import { removeKey } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Input, Select, selectMultipleSize } from '../Atoms/Form';
import { schema } from '../DataModel/schema';
import type { PickListItemSimple } from '../FormFields/ComboBox';
import { hasNativeErrors } from '../Forms/validationHelpers';
import { AutoComplete } from '../Molecules/AutoComplete';
import { fetchPickList, getPickListItems } from '../PickLists/fetch';
import { mappingElementDivider } from '../WbPlanView/LineComponents';
import type { QueryField } from './helpers';
import { LiteralField, Relationship } from '../DataModel/specifyField';
import { dayjs } from '../../utils/dayJs';
import { databaseDateFormat } from '../../utils/dateFormat';

/**
 * Formatters and aggregators don't yet support any filtering options.
 * See https://github.com/specify/specify7/issues/318
 */
export type QueryFieldType =
  | 'checkbox'
  | 'date'
  | 'formatter'
  | 'id'
  | 'number'
  | 'text';
export type QueryFieldFilter =
  | 'any'
  | 'between'
  | 'contains'
  | 'empty'
  | 'equal'
  | 'false'
  | 'falseOrNull'
  | 'greater'
  | 'greaterOrEqual'
  | 'in'
  | 'less'
  | 'lessOrEqual'
  | 'like'
  | 'startsWith'
  | 'true'
  | 'trueOrNull';
export const filtersWithDefaultValue = new Set<QueryFieldFilter>([
  'equal',
  'in',
]);

const relativeDateItems = {
  direction: [
    { value: '+', title: queryText('future') },
    {
      value: '-',
      title: queryText('past'),
    },
  ],
  type: [
    {
      value: 'day',
      title: queryText('day'),
    },
    { value: 'week', title: queryText('week') },
    {
      value: 'month',
      title: queryText('month'),
    },
    {
      value: 'year',
      title: queryText('year'),
    },
  ],
};

function PickListSimple({
  pickListItems,
  value,
  onBlur: handleBlur,
  onChange: handleChange,
}: {
  readonly pickListItems: RA<PickListItemSimple>;
  readonly value: string;
  readonly onBlur: ({ target }: React.ChangeEvent<HTMLSelectElement>) => void;
  readonly onChange: ({ target }: React.ChangeEvent<HTMLSelectElement>) => void;
}): JSX.Element {
  return (
    <Select value={value} onBlur={handleBlur} onChange={handleChange}>
      {pickListItems.map(({ title, value }) => (
        <option key={value} value={value}>
          {title}
        </option>
      ))}
    </Select>
  );
}

function extractValuesSimple<TYPE>(
  target: HTMLInputElement | HTMLSelectElement
): TYPE {
  return target.value as unknown as TYPE;
}

function DateSplit({
  onChange: handleChange,
  parsed,
  onLiveChange: handleLiveChange,
}: {
  readonly parsed: {
    readonly direction: string;
    readonly type: string;
    readonly size: number;
  };
  readonly onChange: ((newValue: string) => void) | undefined;
  readonly onLiveChange: (() => void) | undefined;
}): JSX.Element {
  const [values, setValues] = useTriggerState<{
    readonly direction: string;
    readonly type: string;
    readonly size: number;
  }>(parsed);
  const direction = values.direction;
  const size = values.size;
  const type = values.type;

  return (
    <div className="flex flex-row gap-1">
      <PickListSimple
        pickListItems={relativeDateItems.direction}
        value={resolveItem(relativeDateItems.direction, direction)}
        onBlur={({ target }) => {
          const newValue = extractValuesSimple<string>(target);
          setValues({ ...values, direction: newValue });
          handleChange?.(`today ${newValue} ${size} ${type}`);
        }}
        onChange={({ target }) => {
          const newValue = extractValuesSimple<string>(target);
          setValues({ ...values, direction: newValue });
          handleLiveChange?.();
        }}
      />
      <Input.Number
        value={size}
        onBlur={({ target }) => {
          const newSize = Number.parseInt(extractValuesSimple<string>(target));
          if (!Number.isNaN(newSize) && newSize >= 0) {
            setValues({ ...values, size: newSize });
            handleChange?.(`today ${direction} ${newSize} ${type}`);
          }
        }}
        min={0}
        onChange={({ target }) => {
          const newValue = extractValuesSimple<number>(target);
          setValues({
            ...values,
            size: newValue,
          });
          handleLiveChange?.();
        }}
      />
      <PickListSimple
        pickListItems={relativeDateItems.type}
        value={resolveItem(relativeDateItems.type, type)}
        onBlur={({ target }) => {
          const newValue = extractValuesSimple<string>(target);
          setValues({ ...values, type: newValue });
          handleChange?.(`today ${direction} ${size} ${newValue}`);
        }}
        onChange={({ target }) => {
          const newValue = extractValuesSimple<string>(target);
          setValues({ ...values, type: newValue });
          handleLiveChange?.();
        }}
      />
    </div>
  );
}

function DateQueryInputField({
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
  const [date, setDate] = React.useState<{
    readonly absolute: string | undefined;
    readonly relative: string | undefined;
  }>({
    absolute: reParse.test(currentValue) ? undefined : currentValue,
    relative: reParse.test(currentValue) ? currentValue : undefined,
  });

  const parsed = React.useMemo(() => {
    if (date.relative !== undefined) {
      const parsedValue = reParse.exec(date.relative.toLowerCase())?.slice(1);
      return parsedValue !== undefined
        ? {
            direction: parsedValue[0],
            size: Number.parseInt(parsedValue[1]),
            type: parsedValue[2],
          }
        : undefined;
    }
    return undefined;
  }, [date.relative]);

  const [isAbsolute, _, __, toggleAbsolute] = useBooleanState(
    parsed === undefined
  );

  return (
    <div className="flex items-center">
      <Button.Icon
        icon="switch"
        title="switch"
        onClick={() => {
          toggleAbsolute();
          if (!isAbsolute) {
            if (reParse.test(currentValue)) {
              const parsedDate = dayjs(parseRelativeDate(currentValue));
              handleChange?.(parsedDate.format(databaseDateFormat));
              setDate((oldState) => ({
                ...oldState,
                relative: currentValue,
              }));
            }
          } else {
            setDate((oldState) => ({
              relative:
                parsed === undefined ? 'today + 0 day' : oldState.relative,
              absolute: currentValue,
            }));
            if (parsed === undefined) {
              handleChange?.('today + 0 day');
            }
          }
        }}
      />
      {isAbsolute ? (
        <QueryInputField
          currentValue={date.absolute ?? currentValue}
          fieldName={fieldName}
          label={label}
          parser={parser}
          pickListItems={undefined}
          onChange={handleChange}
        />
      ) : !isAbsolute && parsed !== undefined ? (
        <DateSplit
          parsed={parsed}
          onChange={handleChange}
          onLiveChange={
            date.absolute === undefined
              ? undefined
              : (): void =>
                  setDate((oldValue) => ({
                    ...oldValue,
                    absolute: undefined,
                  }))
          }
        />
      ) : undefined}
    </div>
  );
}

function QueryInputField({
  currentValue,
  // Used only to help browsers with autocomplet
  fieldName,
  parser,
  label = commonText('searchQuery'),
  pickListItems,
  listInput = false,
  onChange: handleChange,
}: {
  readonly currentValue: string;
  readonly fieldName: string;
  readonly parser: Parser;
  readonly label?: string;
  readonly pickListItems: RA<PickListItemSimple> | undefined;
  readonly listInput?: boolean;
  readonly onChange: ((newValue: string) => void) | undefined;
}): JSX.Element {
  const [value, setValue] = useTriggerState(currentValue);

  const { inputRef, validationRef, setValidation } = useValidation<
    HTMLInputElement | HTMLSelectElement
  >();
  const validationAttributes = getValidationAttributes(parser);
  const extractValues = (
    target: HTMLInputElement | HTMLSelectElement
  ): RA<string> =>
    listInput
      ? Array.isArray(pickListItems)
        ? Array.from(target.querySelectorAll('option'))
            .filter(({ selected }) => selected)
            .map(({ value }) => value)
        : target.value.split(',')
      : [target.value];

  /*
   * The length of the value may change as a result of formatter being applied.
   * If new value is longer than the limit, the browser doesn't trigger the
   * maxLength validation error since at that point the value would be last
   * modified by React, not the user.
   * Thus, have to trigger the error manually
   */
  React.useEffect(() => {
    if (
      validationAttributes.maxLength !== undefined &&
      value.length > Number.parseInt(validationAttributes.maxLength) &&
      inputRef.current?.checkValidity() === true
    )
      setValidation(
        formsText(
          'tooLongErrorMessage',
          Number.parseInt(validationAttributes.maxLength)
        )
      );
  }, [value, validationAttributes.maxLength, inputRef, setValidation]);

  const commonProps = {
    forwardRef: validationRef,
    autoComplete: 'on',
    name: fieldName,
    className: 'dark:ring dark:ring-neutral-600',
    title: label,
    'aria-label': label,
    disabled: handleChange === undefined,
    onChange: ({
      target,
    }: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void =>
      setValue(extractValues(target).join(',')),
    onBlur: ({
      target,
    }: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
      const input = target as HTMLInputElement;

      if (hasNativeErrors(input)) return;

      const parseResults = extractValues(target)
        .map(f.trim)
        .filter(Boolean)
        .map((value) => parseValue(parser, input, value));
      const errorMessages = parseResults
        .filter((result): result is InvalidParseResult => !result.isValid)
        .map(({ reason, value }) => `${reason} (${value})`);
      if (errorMessages.length > 0) {
        setValidation(errorMessages);
        return;
      }

      const validResults = parseResults as RA<ValidParseResult>;
      const parsed = validResults.some(
        ({ parsed }) => typeof parsed === 'object'
      )
        ? input.value
        : validResults
            .filter(({ parsed }) => parsed !== null)
            .map(({ parsed }) => (parsed as number | string).toString())
            .join(', ');

      handleChange?.(parsed);
      /*
       * HandleChange() would update "value" only if that value has changed
       * since last call, which does not happen if previous value was invalid.
       * Thus, need to also call setValue()
       */
      setValue(parsed);
    },
  };

  return Array.isArray(pickListItems) ? (
    <div>
      <Select
        {...commonProps}
        multiple={listInput}
        size={listInput ? selectMultipleSize : undefined}
        value={
          listInput
            ? value
                .split(',')
                .map(f.trim)
                .map((value) => resolveItem(pickListItems, value))
            : resolveItem(pickListItems, value)
        }
      >
        <option value="" />
        {pickListItems.map(({ title, value }) => (
          <option key={value} value={value}>
            {title}
          </option>
        ))}
      </Select>
    </div>
  ) : (
    // This allows <input> to grow in size as needed
    <span
      className={`
        relative min-w-[theme(spacing.40)] after:invisible
        after:block after:px-2 after:leading-[0px] after:content-[attr(data-value)]
      `}
      // The :after pseudo element sets the width
      data-value={value}
    >
      {/* This invisible input is used to set the height */}
      <Input.Text aria-hidden className="invisible w-0" />
      <Input.Generic
        {...commonProps}
        {...validationAttributes}
        className={`!absolute inset-0 ${commonProps.className}`}
        type={listInput ? 'text' : validationAttributes.type}
        // This is the actual input that is visible to user
        value={value}
      />
    </span>
  );
}

const resolveItem = (
  items: RA<PickListItemSimple>,
  currentValue: string
): string =>
  items.find(({ value }) => value === currentValue)?.value ??
  items.find(({ title }) => title === currentValue)?.value ??
  currentValue;

function SingleField({
  currentValue,
  parser,
  pickListItems,
  fieldName,
  label = commonText('searchQuery'),
  terminatingField,
  onChange: handleChange,
  listInput = false,
}: {
  readonly currentValue: string;
  readonly parser: Parser;
  readonly pickListItems: RA<PickListItemSimple> | undefined;
  readonly label?: string;
  readonly fieldName: string;
  readonly terminatingField: LiteralField | Relationship | undefined;
  readonly listInput?: boolean;
  readonly onChange: ((newValue: string) => void) | undefined;
  /*
   * This prop is not used here, but defined here because of "typeof SingleField"
   * in queryFieldFilters
   */

  readonly enforceLengthLimit: boolean;
}): JSX.Element {
  if (parser.type === 'date') {
    return (
      <DateQueryInputField
        currentValue={currentValue}
        fieldName={fieldName}
        label={label}
        parser={parser}
        onChange={handleChange}
      />
    );
  }
  if (
    terminatingField?.isRelationship === false &&
    terminatingField.name === 'name' &&
    terminatingField.model.name === 'SpecifyUser'
  ) {
    return (
      <SpecifyUserAutoComplete
        startValue={currentValue}
        onChange={handleChange}
      />
    );
  }
  return (
    <QueryInputField
      currentValue={currentValue}
      fieldName={fieldName}
      label={label}
      parser={parser}
      pickListItems={pickListItems}
      listInput={listInput}
      onChange={handleChange}
    />
  );
}

function SpecifyUserAutoComplete({
  startValue,
  onChange: handleChange,
}: {
  readonly startValue: string;
  readonly onChange: ((newValue: string) => void) | undefined;
}): JSX.Element {
  const valueRef = React.useRef<string>(startValue);
  const items = [
    {
      label: 'Current Specify User Name',
      searchValue: 'Current Specify User Name',
      data: 'currentSpecifyUserName',
    },
  ];
  const label =
    items.find((item) => item.data === startValue)?.label ?? startValue;
  return (
    <div className="flex items-center">
      <AutoComplete<string>
        aria-label={undefined}
        delay={0}
        filterItems
        inputProps={{
          onBlur: () => {
            const data =
              items.find(
                (item) =>
                  item.label === valueRef.current ||
                  item.searchValue === valueRef.current
              )?.data ?? valueRef.current;
            handleChange?.(data);
          },
        }}
        minLength={0}
        pendingValueRef={valueRef}
        onChange={({ data }): void => handleChange?.(data)}
        onNewValue={(data) => {
          handleChange?.(data);
        }}
        source={items}
        // OnCleared={}
        value={label}
      />
    </div>
  );
}

function Between({
  currentValue,
  fieldName,
  parser: originalParser,
  pickListItems,
  onChange: handleChange,
  terminatingField,
  enforceLengthLimit,
}: {
  readonly currentValue: string;
  readonly fieldName: string;
  readonly parser: Parser;
  readonly pickListItems: RA<PickListItemSimple> | undefined;
  readonly terminatingField: LiteralField | Relationship | undefined;
  readonly enforceLengthLimit: boolean;

  readonly onChange: ((newValue: string) => void) | undefined;
}): JSX.Element {
  const splitValue = React.useMemo(
    () => currentValue.split(','),
    [currentValue]
  );
  const [values, setValues] = useTriggerState(splitValue);
  const updateValues =
    typeof handleChange === 'function'
      ? (index: 0 | 1, newValue: string): void => {
          const newValues = [
            index === 0 ? newValue : values[0],
            index === 1 ? newValue : values[1],
          ];
          handleChange(newValues.join(','));
          setValues(newValues);
        }
      : undefined;
  const hasFilters = values.join('').length > 0;
  const parser = React.useMemo(
    () => ({
      ...originalParser,
      isRequired: hasFilters,
    }),
    [originalParser, hasFilters]
  );
  return (
    <>
      <SingleField
        currentValue={values[0] ?? ''}
        parser={parser}
        pickListItems={pickListItems}
        fieldName={fieldName}
        terminatingField={terminatingField}
        onChange={updateValues?.bind(undefined, 0)}
        enforceLengthLimit={enforceLengthLimit}
        label={queryText('startValue')}
      />
      <span className="flex items-center">{queryText('and')}</span>
      <SingleField
        currentValue={values[1] ?? ''}
        parser={parser}
        pickListItems={pickListItems}
        label={queryText('endValue')}
        fieldName={fieldName}
        terminatingField={terminatingField}
        onChange={updateValues?.bind(undefined, 1)}
        enforceLengthLimit={enforceLengthLimit}
      />
    </>
  );
}

function In({
  currentValue,
  fieldName,
  parser,
  pickListItems,
  onChange: handleChange,
  enforceLengthLimit,
}: {
  readonly currentValue: string;
  readonly fieldName: string;
  readonly parser: Parser;
  readonly pickListItems: RA<PickListItemSimple> | undefined;
  readonly onChange: ((newValue: string) => void) | undefined;
  readonly enforceLengthLimit: boolean;
}): JSX.Element {
  const pluralizedParser = React.useMemo(
    () => ({
      ...pluralizeParser(parser),
      maxLength: enforceLengthLimit
        ? schema.models.SpQueryField.strictGetLiteralField('startValue').length
        : undefined,
    }),
    [parser, enforceLengthLimit]
  );
  return (
    <SingleField
      currentValue={currentValue}
      parser={pluralizedParser}
      pickListItems={pickListItems}
      label={queryText('startValue')}
      fieldName={fieldName}
      listInput
      terminatingField={undefined}
      onChange={handleChange}
      enforceLengthLimit={enforceLengthLimit}
    />
  );
}

export const queryFieldFilters: RR<
  QueryFieldFilter,
  {
    readonly id: number;
    readonly label: string;
    readonly description: string | undefined;
    // If true, show pick list item titles. Else, show free input
    readonly renderPickList: boolean;
    readonly types?: RA<QueryFieldType>;
    readonly component?: typeof SingleField;
    // Whether to do front-end validation
    readonly hasParser: boolean;
  }
> = {
  any: {
    id: 8,
    label: queryText('any'),
    description: undefined,
    renderPickList: false,
    hasParser: false,
  },
  like: {
    id: 0,
    label: queryText('like'),
    description: queryText('likeDescription'),
    renderPickList: false,
    types: ['text', 'number', 'date', 'id'],
    component: SingleField,
    hasParser: false,
  },
  equal: {
    id: 1,
    label: queryText('equal'),
    description: undefined,
    renderPickList: true,
    component: SingleField,
    hasParser: true,
    types: ['text', 'number', 'date', 'id'],
  },
  greater: {
    id: 2,
    label: queryText('greaterThan'),
    description: undefined,
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
    hasParser: true,
  },
  less: {
    id: 3,
    label: queryText('lessThan'),
    description: undefined,
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
    hasParser: true,
  },
  greaterOrEqual: {
    id: 4,
    label: queryText('greaterOrEqualTo'),
    description: undefined,
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
    hasParser: true,
  },
  lessOrEqual: {
    id: 5,
    label: queryText('lessOrEqualTo'),
    description: undefined,
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
    hasParser: true,
  },
  true: {
    id: 6,
    label: queryText('true'),
    description: undefined,
    renderPickList: false,
    types: ['checkbox'],
    hasParser: true,
  },
  false: {
    id: 7,
    label: queryText('false'),
    description: undefined,
    renderPickList: false,
    types: ['checkbox'],
    hasParser: true,
  },
  between: {
    id: 9,
    label: queryText('between'),
    description: undefined,
    renderPickList: false,
    types: ['text', 'number', 'date', 'id'],
    component: Between,
    hasParser: true,
  },
  in: {
    id: 10,
    label: queryText('in'),
    description: queryText('inDescription'),
    renderPickList: true,
    /*
     * Can't use "date" for IN because date picker does not allow separating
     * multiple values with a comma. Instead, OR filters should be used
     */
    types: ['text', 'number', 'id'],
    component: In,
    hasParser: true,
  },
  contains: {
    id: 11,
    label: queryText('contains'),
    description: undefined,
    renderPickList: false,
    component: SingleField,
    types: ['text', 'number', 'date', 'id'],
    hasParser: false,
  },
  startsWith: {
    id: 15,
    label: queryText('startsWith'),
    description: undefined,
    renderPickList: false,
    component: SingleField,
    types: ['text', 'number', 'date', 'id'],
    hasParser: false,
  },
  empty: {
    id: 12,
    label: queryText('empty'),
    description: undefined,
    renderPickList: false,
    hasParser: false,
  },
  trueOrNull: {
    id: 13,
    label: queryText('trueOrNull'),
    description: undefined,
    renderPickList: false,
    types: ['checkbox'],
    hasParser: true,
  },
  falseOrNull: {
    id: 14,
    label: queryText('falseOrNull'),
    description: undefined,
    renderPickList: false,
    types: ['checkbox'],
    hasParser: true,
  },
};

export function QueryLineFilter({
  filter,
  fieldName,
  terminatingField,
  parser: originalParser,
  enforceLengthLimit,
  onChange: handleChange,
}: {
  readonly filter: QueryField['filters'][number];
  readonly fieldName: string;
  readonly terminatingField: LiteralField | Relationship | undefined;
  readonly parser: Parser;
  readonly enforceLengthLimit: boolean;
  readonly onChange: ((newValue: string) => void) | undefined;
}): JSX.Element | null {
  const parser = queryFieldFilters[filter.type].hasParser
    ? originalParser
    : ({
        ...removeKey(
          originalParser,
          'pattern',
          'min',
          'step',
          'formatters',
          'parser',
          'validators'
        ),
        type: 'text',
      } as const);

  const [pickListItems] = useAsyncState(
    React.useCallback(
      () =>
        typeof parser.pickListName === 'string'
          ? fetchPickList(parser.pickListName).then((pickList) =>
              typeof pickList === 'object' ? getPickListItems(pickList) : false
            )
          : false,
      [parser.pickListName]
    ),
    false
  );

  // Fix for https://github.com/specify/specify7/issues/2296
  React.useEffect(() => {
    if (pickListItems === undefined || pickListItems === false) return;
    const newStartValue = filter.startValue
      .split(',')
      .map((value) => resolveItem(pickListItems, value))
      .join(',');
    if (newStartValue !== filter.startValue) handleChange?.(newStartValue);
  }, [pickListItems, filter]);

  const Component = queryFieldFilters[filter.type].component;
  return Component === undefined ? null : pickListItems === undefined ? (
    <>{commonText('loading')}</>
  ) : (
    <>
      {mappingElementDivider}
      <Component
        enforceLengthLimit={enforceLengthLimit}
        fieldName={fieldName}
        currentValue={filter.startValue}
        parser={parser}
        pickListItems={
          queryFieldFilters[filter.type].renderPickList
            ? pickListItems === false
              ? undefined
              : pickListItems
            : undefined
        }
        terminatingField={terminatingField}
        onChange={handleChange}
      />
    </>
  );
}
