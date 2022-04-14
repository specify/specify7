import React from 'react';

import commonText from '../localization/common';
import queryText from '../localization/query';
import { fetchPickList, getPickListItems } from '../picklistmixins';
import type { QueryField } from '../querybuilderutils';
import type { RA, RR } from '../types';
import type { InvalidParseResult, Parser, ValidParseResult } from '../uiparse';
import {
  getValidationAttributes,
  parseValue,
  pluralizeParser,
} from '../uiparse';
import { hasNativeErrors } from '../validationmessages';
import { omit } from '../helpers';
import { f } from '../functools';
import { Input, Select, selectMultipleSize } from './basic';
import type { PickListItemSimple } from './combobox';
import { useAsyncState, useTriggerState, useValidation } from './hooks';
import { mappingElementDivider } from './wbplanviewcomponents';

export type QueryFieldType = 'text' | 'number' | 'date' | 'id' | 'checkbox';
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
  readonly onChange: (newValue: string) => void;
}): JSX.Element {
  const [value, setValue] = useTriggerState(currentValue);

  const { validationRef, setValidation } = useValidation<
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

  const commonProps = {
    forwardRef: validationRef,
    autoComplete: 'on',
    name: fieldName,
    title: label,
    'aria-label': label,
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
      /*
       * HandleChange() would update "value" only if that value has changed
       * since last call, which does not happen if previous value was invalid.
       * Thus, need to also call setValue()
       */
      setValue(parsed);
      handleChange(parsed);
    },
  };

  return Array.isArray(pickListItems) ? (
    <Select
      {...commonProps}
      required={Boolean(validationAttributes.required)}
      multiple={listInput}
      value={listInput ? value.split(',').map(f.trim) : value}
      size={listInput ? selectMultipleSize : 1}
    >
      {pickListItems.map(({ title, value }) => (
        <option key={value} value={value}>
          {title}
        </option>
      ))}
    </Select>
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
        className="absolute inset-0"
      />
    </span>
  );
}

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
  readonly onChange: (newValue: string) => void;
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
  parser,
  pickListItems,
  onChange: handleChange,
}: {
  readonly filter: QueryField['filters'][number];
  readonly fieldName: string;
  readonly parser: Parser;
  readonly pickListItems: RA<PickListItemSimple> | undefined;
  readonly onChange: (newValue: string) => void;
}): JSX.Element {
  const [values, setValues] = React.useState(filter.startValue.split(','));
  const updateValues = (index: 0 | 1, newValue: string) => {
    const newValues = [
      index === 0 ? newValue : values[0],
      index === 1 ? newValue : values[1],
    ];
    handleChange(newValues.join(','));
    setValues(newValues);
  };
  return (
    <>
      <QueryInputField
        currentValue={values[0] ?? ''}
        parser={parser}
        pickListItems={pickListItems}
        label={queryText('startValue')}
        fieldName={fieldName}
        onChange={updateValues.bind(undefined, 0)}
      />
      {queryText('and')}
      <QueryInputField
        currentValue={values[1] ?? ''}
        parser={parser}
        pickListItems={pickListItems}
        label={queryText('endValue')}
        fieldName={fieldName}
        onChange={updateValues.bind(undefined, 1)}
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
}: {
  readonly filter: QueryField['filters'][number];
  readonly fieldName: string;
  readonly parser: Parser;
  readonly pickListItems: RA<PickListItemSimple> | undefined;
  readonly onChange: (newValue: string) => void;
}): JSX.Element {
  const pluralizedParser = React.useMemo(
    () => pluralizeParser(parser),
    [parser]
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

/*
 * FIXME: test all combination of data types and filters
 *       (including pick lists)
 * FIXME: test "any"
 */
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
    // Whether empty "startValue" is equivalent to "(any)"
    resetToAny: boolean;
    // Whether to do front-end validation
    hasParser: boolean;
  }
> = {
  any: {
    id: 8,
    label: queryText('any'),
    description: undefined,
    renderPickList: false,
    resetToAny: false,
    hasParser: false,
  },
  like: {
    id: 0,
    label: queryText('like'),
    description: queryText('likeDescription'),
    renderPickList: false,
    types: ['text', 'number', 'date', 'id'],
    component: SingleField,
    resetToAny: true,
    hasParser: false,
  },
  equal: {
    id: 1,
    label: queryText('equal'),
    description: undefined,
    renderPickList: true,
    component: SingleField,
    resetToAny: true,
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
    resetToAny: true,
    hasParser: true,
  },
  less: {
    id: 3,
    label: queryText('lessThan'),
    description: undefined,
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
    resetToAny: true,
    hasParser: true,
  },
  greaterOrEqual: {
    id: 4,
    label: queryText('greaterOrEqualTo'),
    description: undefined,
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
    resetToAny: true,
    hasParser: true,
  },
  lessOrEqual: {
    id: 5,
    label: queryText('lessOrEqualTo'),
    description: undefined,
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
    resetToAny: true,
    hasParser: true,
  },
  true: {
    id: 6,
    label: queryText('true'),
    description: undefined,
    renderPickList: false,
    types: ['checkbox'],
    resetToAny: false,
    hasParser: true,
  },
  false: {
    id: 7,
    label: queryText('false'),
    description: undefined,
    renderPickList: false,
    types: ['checkbox'],
    resetToAny: false,
    hasParser: true,
  },
  between: {
    id: 9,
    label: queryText('between'),
    description: undefined,
    renderPickList: false,
    types: ['text', 'number', 'date', 'id'],
    component: Between,
    resetToAny: true,
    hasParser: true,
  },
  in: {
    id: 10,
    label: queryText('in'),
    description: queryText('inDescription'),
    renderPickList: true,
    types: ['text', 'number', 'date', 'id'],
    component: In,
    resetToAny: true,
    hasParser: true,
  },
  contains: {
    id: 11,
    label: queryText('contains'),
    description: undefined,
    renderPickList: false,
    component: SingleField,
    types: ['text', 'number', 'date', 'id'],
    resetToAny: true,
    hasParser: false,
  },
  startsWith: {
    id: 15,
    label: queryText('startsWith'),
    description: undefined,
    renderPickList: false,
    component: SingleField,
    types: ['text', 'number', 'date', 'id'],
    resetToAny: true,
    hasParser: false,
  },
  empty: {
    id: 12,
    label: queryText('empty'),
    description: undefined,
    renderPickList: false,
    resetToAny: false,
    hasParser: false,
  },
  trueOrNull: {
    id: 13,
    label: queryText('trueOrNull'),
    description: undefined,
    renderPickList: false,
    types: ['checkbox'],
    resetToAny: false,
    hasParser: true,
  },
  falseOrNull: {
    id: 14,
    label: queryText('falseOrNull'),
    description: undefined,
    renderPickList: false,
    types: ['checkbox'],
    resetToAny: false,
    hasParser: true,
  },
};

export function QueryLineFilter({
  filter,
  fieldName,
  parser: originalParser,
  onChange: handleChange,
}: {
  readonly filter: QueryField['filters'][number];
  readonly fieldName: string;
  readonly parser: Parser;
  readonly onChange: (newValue: string) => void;
}): JSX.Element | null {
  const parser = queryFieldFilters[filter.type].hasParser
    ? originalParser
    : ({
        ...omit(originalParser, [
          'pattern',
          'min',
          'step',
          'formatters',
          'parser',
          'validators',
        ]),
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

  const previousFilter = React.useRef<QueryFieldFilter>(filter.type);
  /*
   * When going from "in" to another filter type, throw away all but first one
   * or two values
   */
  React.useEffect(() => {
    const valueLength = filter.type === 'between' ? 2 : 1;
    if (filter.type !== 'in' && previousFilter.current === 'in')
      handleChange(
        filter.startValue.split(',').slice(0, valueLength).join(', ')
      );
    previousFilter.current = filter.type;
  }, [handleChange, filter]);

  const Component = queryFieldFilters[filter.type].component;
  return typeof Component === 'undefined' ? null : (
    <React.Fragment>
      {mappingElementDivider}
      <Component
        filter={filter}
        onChange={handleChange}
        parser={parser}
        fieldName={fieldName}
        pickListItems={
          queryFieldFilters[filter.type].renderPickList
            ? pickListItems
            : undefined
        }
      />
    </React.Fragment>
  );
}
