import React from 'react';

import { f } from '../functools';
import { removeKey } from '../helpers';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { queryText } from '../localization/query';
import { fetchPickList, getPickListItems } from '../picklistmixins';
import type { QueryField } from '../querybuilderutils';
import { schema } from '../schema';
import type { RA, RR } from '../types';
import { defined } from '../types';
import type { InvalidParseResult, Parser, ValidParseResult } from '../uiparse';
import {
  getValidationAttributes,
  parseValue,
  pluralizeParser,
} from '../uiparse';
import { hasNativeErrors } from '../validationmessages';
import { Input, Select, selectMultipleSize } from './basic';
import type { PickListItemSimple } from './combobox';
import { useAsyncState, useTriggerState, useValidation } from './hooks';
import { mappingElementDivider } from './wbplanviewcomponents';

/**
 * Formatters and aggregators don't yet support any filtering options.
 * See https://github.com/specify/specify7/issues/318
 */
export type QueryFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'id'
  | 'checkbox'
  | 'formatter';
export type QueryFieldFilter =
  | 'any'
  | 'like'
  | 'equal'
  | 'greater'
  | 'less'
  | 'greaterOrEqual'
  | 'lessOrEqual'
  | 'true'
  | 'false'
  | 'between'
  | 'in'
  | 'contains'
  | 'startsWith'
  | 'empty'
  | 'trueOrNull'
  | 'falseOrNull';
export const filtersWithDefaultValue: Set<QueryFieldFilter> = new Set([
  'equal',
  'in',
]);

function QueryInputField({
  currentValue,
  // Used only to help browsers with autocomplete
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
      typeof validationAttributes.maxLength !== 'undefined' &&
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
    title: label,
    'aria-label': label,
    disabled: typeof handleChange === 'undefined',
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
        required={Boolean(validationAttributes.required)}
        multiple={listInput}
        value={
          listInput
            ? value
                .split(',')
                .map(f.trim)
                .map((value) => resolveItem(pickListItems, value))
            : resolveItem(pickListItems, value)
        }
        size={listInput ? selectMultipleSize : 1}
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
      data-value={value}
      /* The :after pseudo element sets the width */
      className={`relative after:invisible after:content-[attr(data-value)]
        after:leading-[0px] min-w-[theme(spacing.40)] after:block after:px-2`}
    >
      {/* This invisible input is used to set the height */}
      <Input.Text className="invisible w-0" />
      <Input.Generic
        {...commonProps}
        {...validationAttributes}
        value={value}
        // This is the actual input that is visible to user
        className="!absolute inset-0"
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
  value;

function SingleField({
  filter,
  parser,
  pickListItems,
  fieldName,
  label = commonText('searchQuery'),
  onChange: handleChange,
}: {
  readonly filter: QueryField['filters'][number];
  readonly parser: Parser;
  readonly pickListItems: RA<PickListItemSimple> | undefined;
  readonly label?: string;
  readonly fieldName: string;
  readonly onChange: ((newValue: string) => void) | undefined;
  /*
   * This prop is not used here, but defined here because of "typeof SingleField"
   * in queryFieldFilters
   */
  // eslint-disable-next-line react/no-unused-prop-types
  readonly enforceLengthLimit: boolean;
}): JSX.Element {
  return (
    <QueryInputField
      currentValue={filter.startValue}
      parser={parser}
      label={label}
      pickListItems={pickListItems}
      fieldName={fieldName}
      onChange={handleChange}
    />
  );
}

function Between({
  filter,
  fieldName,
  parser: originalParser,
  pickListItems,
  onChange: handleChange,
}: {
  readonly filter: QueryField['filters'][number];
  readonly fieldName: string;
  readonly parser: Parser;
  readonly pickListItems: RA<PickListItemSimple> | undefined;
  readonly onChange: ((newValue: string) => void) | undefined;
}): JSX.Element {
  const [values, setValues] = React.useState(filter.startValue.split(','));
  const updateValues =
    typeof handleChange === 'function'
      ? (index: 0 | 1, newValue: string) => {
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
      <QueryInputField
        currentValue={values[0] ?? ''}
        parser={parser}
        pickListItems={pickListItems}
        label={queryText('startValue')}
        fieldName={fieldName}
        onChange={updateValues?.bind(undefined, 0)}
      />
      <span className="flex items-center">{queryText('and')}</span>
      <QueryInputField
        currentValue={values[1] ?? ''}
        parser={parser}
        pickListItems={pickListItems}
        label={queryText('endValue')}
        fieldName={fieldName}
        onChange={updateValues?.bind(undefined, 1)}
      />
    </>
  );
}

function In({
  filter,
  fieldName,
  parser,
  pickListItems,
  onChange: handleChange,
  enforceLengthLimit,
}: {
  readonly filter: QueryField['filters'][number];
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
        ? defined(schema.models.SpQueryField.getLiteralField('startValue'))
            .length
        : undefined,
    }),
    [parser, enforceLengthLimit]
  );
  return (
    <QueryInputField
      currentValue={filter.startValue}
      parser={pluralizedParser}
      pickListItems={pickListItems}
      label={queryText('startValue')}
      fieldName={fieldName}
      listInput={true}
      onChange={handleChange}
    />
  );
}

export const queryFieldFilters: RR<
  QueryFieldFilter,
  {
    id: number;
    label: string;
    description: string | undefined;
    // If true, show pick list item titles. Else, show free input
    renderPickList: boolean;
    types?: RA<QueryFieldType>;
    component?: typeof SingleField;
    // Whether to do front-end validation
    hasParser: boolean;
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
  parser: originalParser,
  enforceLengthLimit,
  onChange: handleChange,
}: {
  readonly filter: QueryField['filters'][number];
  readonly fieldName: string;
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
              typeof pickList === 'object'
                ? getPickListItems(pickList)
                : undefined
            )
          : undefined,
      [parser.pickListName]
    ),
    false
  );

  const Component = queryFieldFilters[filter.type].component;
  return typeof Component === 'undefined' ? null : (
    <React.Fragment>
      {mappingElementDivider}
      <Component
        filter={filter}
        onChange={handleChange}
        parser={parser}
        fieldName={fieldName}
        enforceLengthLimit={enforceLengthLimit}
        pickListItems={
          queryFieldFilters[filter.type].renderPickList
            ? pickListItems
            : undefined
        }
      />
    </React.Fragment>
  );
}
