import React from 'react';

import { serializeResource } from '../datamodelutils';
import commonText from '../localization/common';
import queryText from '../localization/query';
import { fetchPickList } from '../picklistmixins';
import type { QueryField } from '../querybuilderutils';
import type { RA, RR } from '../types';
import type { InvalidParseResult, Parser, ValidParseResult } from '../uiparse';
import { getValidationAttributes, parseValue } from '../uiparse';
import { hasNativeErrors } from '../validationmessages';
import { Input, Select } from './basic';
import type { PickListItemSimple } from './combobox';
import { useAsyncState, useValidation } from './hooks';
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
  const [value, setValue] = React.useState(currentValue);
  React.useEffect(() => setValue(currentValue), [currentValue]);

  const { validationRef, setValidation } = useValidation<
    HTMLInputElement | HTMLSelectElement
  >();
  const validationAttributes = getValidationAttributes(parser);
  const extractValues = (
    target: HTMLInputElement | HTMLSelectElement
  ): RA<string> =>
    listInput
      ? pickListItems
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

      const parseResults = extractValues(target).map((value) =>
        parseValue(parser, input, value)
      );
      const errorMessages = parseResults
        .filter((result): result is InvalidParseResult => !result.isValid)
        .map(({ reason }) => reason);
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
      handleChange(parsed);
    },
  };

  return Array.isArray(pickListItems) ? (
    <Select
      {...commonProps}
      required={Boolean(validationAttributes.required)}
      multiple={listInput}
      value={listInput ? value.split(',').map((value) => value.trim()) : value}
      size={listInput ? 4 : 1}
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
      <Input type="text" className="invisible w-0" />
      {/* TODO: handle paste for dateField fullDate */}
      <Input
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

function mutateParser(parser: Parser): Parser {
  if (typeof parser.pattern === 'object') {
    // If a pattern is set, modify it to allow for comma separators
    const pattern = parser.pattern
      .toString()
      .replaceAll(/^\/\^\(?|\)?\$\/$/g, '');
    // Pattern with whitespace
    const escaped = `\\s*(?:${pattern})\\s*`;
    return {
      ...parser,
      pattern: new RegExp(`|${escaped}(?:,${escaped})*`),
    };
  } else return parser;
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
  return (
    <QueryInputField
      currentValue={filter.startValue}
      parser={mutateParser(parser)}
      pickListItems={pickListItems}
      label={queryText('startValue')}
      fieldName={fieldName}
      listInput={true}
      onChange={handleChange}
    />
  );
}

/*
 * TODO: test all combination of data types and filters
 *       (including pick lists)
 * TODO: test "any" and find out use of don't care
 */
export const queryFieldFilters: RR<
  QueryFieldFilter,
  {
    id: number;
    label: string;
    renderPickList: boolean;
    types?: RA<QueryFieldType>;
    component?: typeof SingleField;
  }
> = {
  any: {
    id: 8,
    label: queryText('any'),
    renderPickList: false,
  },
  like: {
    id: 0,
    label: queryText('like'),
    renderPickList: false,
    types: ['text', 'number', 'date', 'id'],
    component: SingleField,
  },
  equal: {
    id: 1,
    label: queryText('equal'),
    renderPickList: true,
    component: SingleField,
  },
  greater: {
    id: 2,
    label: queryText('greaterThan'),
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
  },
  less: {
    id: 3,
    label: queryText('lessThan'),
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
  },
  greaterOrEqual: {
    id: 4,
    label: queryText('greaterOrEqualTo'),
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
  },
  lessOrEqual: {
    id: 5,
    label: queryText('lessOrEqualTo'),
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
  },
  true: {
    id: 6,
    label: queryText('true'),
    renderPickList: false,
    types: ['checkbox'],
  },
  false: {
    id: 7,
    label: queryText('false'),
    renderPickList: false,
    types: ['checkbox'],
  },
  between: {
    id: 9,
    label: queryText('between'),
    renderPickList: false,
    types: ['text', 'number', 'date', 'id'],
    component: Between,
  },
  in: {
    id: 10,
    label: queryText('in'),
    renderPickList: true,
    types: ['text', 'number', 'date', 'id'],
    component: In,
  },
  contains: {
    id: 11,
    label: queryText('contains'),
    renderPickList: false,
    component: SingleField,
    types: ['text', 'number', 'date', 'id'],
  },
  startsWith: {
    id: 15,
    label: queryText('startsWith'),
    renderPickList: false,
    component: SingleField,
    types: ['text', 'number', 'date', 'id'],
  },
  empty: {
    id: 12,
    label: queryText('empty'),
    renderPickList: false,
  },
  trueOrNull: {
    id: 13,
    label: queryText('trueOrNull'),
    renderPickList: false,
    types: ['checkbox'],
  },
  falseOrNull: {
    id: 14,
    label: queryText('falseOrNull'),
    renderPickList: false,
    types: ['checkbox'],
  },
};

export function QueryLineFilter({
  filter,
  fieldName,
  parser,
  pickListName,
  onChange: handleChange,
}: {
  readonly filter: QueryField['filters'][number];
  readonly fieldName: string;
  readonly parser: Parser;
  readonly pickListName?: string;
  readonly onChange: (newValue: string) => void;
}): JSX.Element | null {
  const [pickListItems] = useAsyncState(
    React.useCallback(
      () =>
        typeof pickListName === 'string'
          ? fetchPickList(pickListName).then((pickList) =>
              typeof pickList === 'object'
                ? serializeResource(pickList).pickListItems.map(
                    ({ title, value }) => ({
                      title: title ?? value,
                      value: value ?? title,
                    })
                  )
                : undefined
            )
          : undefined,
      [pickListName]
    )
  );

  const previousFilter = React.useRef<QueryFieldFilter>(filter.type);
  // When going from "in" to another filter type, throw away all but first value
  React.useEffect(() => {
    if (filter.type !== 'in' && previousFilter.current === 'in')
      handleChange(filter.startValue.split(',')[0]);
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
