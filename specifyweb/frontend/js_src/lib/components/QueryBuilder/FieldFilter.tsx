import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useTriggerState } from '../../hooks/useTriggerState';
import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
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
import type { RA, RR } from '../../utils/types';
import { removeKey } from '../../utils/utils';
import { Input, Select, selectMultipleSize } from '../Atoms/Form';
import { getField } from '../DataModel/helpers';
import { schema } from '../DataModel/schema';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { PickListItemSimple } from '../FormFields/ComboBox';
import { hasNativeErrors } from '../Forms/validationHelpers';
import { fetchPickList, getPickListItems } from '../PickLists/fetch';
import { mappingElementDivider } from '../WbPlanView/LineComponents';
import type { QueryField } from './helpers';
import { DateQueryInputField } from './RelativeDate';
import { SpecifyUserAutoComplete } from './SpecifyUserAutoComplete';

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

export function QueryInputField({
  currentValue,
  // Used only to help browsers with autocomplet
  fieldName,
  parser,
  label = commonText.searchQuery(),
  pickListItems,
  listInput = false,
  onChange: handleChange,
}: {
  readonly currentValue: string;
  readonly fieldName: string;
  readonly parser: Parser;
  readonly label?: LocalizedString;
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
        queryText.tooLongErrorMessage({
          maxLength: Number.parseInt(validationAttributes.maxLength),
        })
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
                .map((value) => resolvePickListItem(pickListItems, value))
            : resolvePickListItem(pickListItems, value)
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
        // This is the actual input that is visible to user
        {...commonProps}
        {...validationAttributes}
        className={`!absolute inset-0 ${commonProps.className}`}
        type={listInput ? 'text' : validationAttributes.type}
        value={value}
      />
    </span>
  );
}

const resolvePickListItem = (
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
  terminatingField,
  label = commonText.searchQuery(),
  onChange: handleChange,
  listInput = false,
}: {
  readonly currentValue: string;
  readonly parser: Parser;
  readonly pickListItems: RA<PickListItemSimple> | undefined;
  readonly label?: LocalizedString;
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
  if (parser.type === 'date')
    return (
      <DateQueryInputField
        currentValue={currentValue}
        fieldName={fieldName}
        label={label}
        parser={parser}
        onChange={handleChange}
      />
    );
  else if (
    terminatingField?.isRelationship === false &&
    terminatingField.name === 'name' &&
    terminatingField.model.name === 'SpecifyUser'
  )
    return (
      <SpecifyUserAutoComplete
        startValue={currentValue}
        onChange={handleChange}
      />
    );
  else
    return (
      <QueryInputField
        currentValue={currentValue}
        fieldName={fieldName}
        label={label}
        listInput={listInput}
        parser={parser}
        pickListItems={pickListItems}
        onChange={handleChange}
      />
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
        enforceLengthLimit={enforceLengthLimit}
        fieldName={fieldName}
        label={queryText.startValue()}
        parser={parser}
        pickListItems={pickListItems}
        terminatingField={terminatingField}
        onChange={updateValues?.bind(undefined, 0)}
      />
      <span className="flex items-center">{queryText.and()}</span>
      <SingleField
        currentValue={values[1] ?? ''}
        enforceLengthLimit={enforceLengthLimit}
        fieldName={fieldName}
        label={queryText.endValue()}
        parser={parser}
        pickListItems={pickListItems}
        terminatingField={terminatingField}
        onChange={updateValues?.bind(undefined, 1)}
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
        ? getField(schema.models.SpQueryField, 'startValue').length
        : undefined,
    }),
    [parser, enforceLengthLimit]
  );
  return (
    <SingleField
      currentValue={currentValue}
      enforceLengthLimit={enforceLengthLimit}
      fieldName={fieldName}
      label={queryText.startValue()}
      listInput
      parser={pluralizedParser}
      pickListItems={pickListItems}
      terminatingField={undefined}
      onChange={handleChange}
    />
  );
}

export const queryFieldFilters: RR<
  QueryFieldFilter,
  {
    readonly id: number;
    readonly label: LocalizedString;
    readonly description: LocalizedString | undefined;
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
    label: queryText.any(),
    description: undefined,
    renderPickList: false,
    hasParser: false,
  },
  like: {
    id: 0,
    label: queryText.like(),
    description: queryText.likeDescription(),
    renderPickList: false,
    types: ['text', 'number', 'date', 'id'],
    component: SingleField,
    hasParser: false,
  },
  equal: {
    id: 1,
    label: queryText.equal(),
    description: undefined,
    renderPickList: true,
    component: SingleField,
    hasParser: true,
    types: ['text', 'number', 'date', 'id'],
  },
  greater: {
    id: 2,
    label: queryText.greaterThan(),
    description: undefined,
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
    hasParser: true,
  },
  less: {
    id: 3,
    label: queryText.lessThan(),
    description: undefined,
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
    hasParser: true,
  },
  greaterOrEqual: {
    id: 4,
    label: queryText.greaterOrEqualTo(),
    description: undefined,
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
    hasParser: true,
  },
  lessOrEqual: {
    id: 5,
    label: queryText.lessOrEqualTo(),
    description: undefined,
    renderPickList: false,
    types: ['number', 'date', 'id'],
    component: SingleField,
    hasParser: true,
  },
  true: {
    id: 6,
    label: queryText.true(),
    description: undefined,
    renderPickList: false,
    types: ['checkbox'],
    hasParser: true,
  },
  false: {
    id: 7,
    label: queryText.false(),
    description: undefined,
    renderPickList: false,
    types: ['checkbox'],
    hasParser: true,
  },
  between: {
    id: 9,
    label: queryText.between(),
    description: undefined,
    renderPickList: false,
    types: ['text', 'number', 'date', 'id'],
    component: Between,
    hasParser: true,
  },
  in: {
    id: 10,
    label: queryText.in(),
    description: queryText.inDescription(),
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
    label: queryText.contains(),
    description: undefined,
    renderPickList: false,
    component: SingleField,
    types: ['text', 'number', 'date', 'id'],
    hasParser: false,
  },
  startsWith: {
    id: 15,
    label: queryText.startsWith(),
    description: undefined,
    renderPickList: false,
    component: SingleField,
    types: ['text', 'number', 'date', 'id'],
    hasParser: false,
  },
  empty: {
    id: 12,
    label: queryText.empty(),
    description: undefined,
    renderPickList: false,
    hasParser: false,
  },
  trueOrNull: {
    id: 13,
    label: queryText.trueOrNull(),
    description: undefined,
    renderPickList: false,
    types: ['checkbox'],
    hasParser: true,
  },
  falseOrNull: {
    id: 14,
    label: queryText.falseOrNull(),
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
      .map((value) => resolvePickListItem(pickListItems, value))
      .join(',');
    if (newStartValue !== filter.startValue) handleChange?.(newStartValue);
  }, [pickListItems, filter]);

  const Component = queryFieldFilters[filter.type].component;
  return Component === undefined ? null : pickListItems === undefined ? (
    <>{commonText.loading()}</>
  ) : (
    <>
      {mappingElementDivider}
      <Component
        currentValue={filter.startValue}
        enforceLengthLimit={enforceLengthLimit}
        fieldName={fieldName}
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
