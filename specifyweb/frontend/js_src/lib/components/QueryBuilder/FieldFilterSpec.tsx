import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useTriggerState } from '../../hooks/useTriggerState';
import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { resourcesText } from '../../localization/resources';
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
import { Input, Select, selectMultipleSize } from '../Atoms/Form';
import { getField } from '../DataModel/helpers';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import { tables } from '../DataModel/tables';
import type { PickListItemSimple } from '../FormFields/ComboBox';
import { hasNativeErrors } from '../Forms/validationHelpers';
import { IsQueryBasicContext } from './Context';
import { DateQueryInputField } from './RelativeDate';
import { SpecifyUserAutoComplete } from './SpecifyUserAutoComplete';

/**
 * This function enables users to specify ranges like "33043-33049" or abbreviated ranges 
 * like "352000-26" (meaning 352000-352026) in query filters for any numeric field.
 */
function expandNumericRanges(valueStr: string): string {
  if (typeof valueStr !== 'string') return valueStr;
  
  function expandRange(rangeStr: string): string[] {
    const trimmed = rangeStr.trim();
    
    if (!trimmed.includes('-')) return [trimmed];
    
    const parts = trimmed.split('-', 2);
    if (parts.length !== 2) return [trimmed];
    
    const [startStr, endStr] = parts.map(s => s.trim());
    
    if (!/^\d+$/.test(startStr) || !/^\d+$/.test(endStr)) return [trimmed];
    
    let startNum = parseInt(startStr, 10);
    let endNum = parseInt(endStr, 10);
    
    // Handle abbreviated ranges like "352000-26" -> "352000-352026"
    if (endStr.length < startStr.length) {
      const prefix = startStr.slice(0, startStr.length - endStr.length);
      const fullEndStr = prefix + endStr;
      const reconstructedEnd = parseInt(fullEndStr, 10);
      
      if (reconstructedEnd >= startNum) {
        endNum = reconstructedEnd;
      } else {
        return [trimmed]; // Invalid range
      }
    }
    
    if (startNum > endNum) return [trimmed]; // Invalid range
    
    const expanded: string[] = [];
    for (let num = startNum; num <= endNum; num++) {
      // Format with leading zeros to match original start format
      const formatted = num.toString().padStart(startStr.length, '0');
      expanded.push(formatted);
    }
    
    return expanded;
  }
  
  const parts = valueStr.split(',');
  const allExpanded: string[] = [];
  
  for (const part of parts) {
    allExpanded.push(...expandRange(part));
  }

  return allExpanded.join(',');
}

/**
 * Formatters and aggregators don't yet support any filtering options.
 * See https://github.com/specify/specify7/issues/318
 */
export type QueryFieldType =
  | 'age'
  | 'aggregator'
  | 'checkbox'
  | 'date'
  | 'formatter'
  | 'id'
  | 'number'
  | 'text';
export type QueryFieldFilter =
  | 'ageName'
  | 'ageRange'
  | 'any'
  | 'between'
  | 'contains'
  | 'empty'
  | 'endsWith'
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
  // Used only to help browsers with autocomplete
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
  
  // Get validation attributes, but disable pattern validation for "In" operator with ranges
  const baseValidationAttributes = getValidationAttributes(parser);
  const shouldSkipPattern = listInput && value.includes('-');
  const validationAttributes = shouldSkipPattern
    ? Object.fromEntries(
        Object.entries(baseValidationAttributes).filter(([key]) => key !== 'pattern')
      )
    : baseValidationAttributes;
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

      // For "In" operator, expand numeric ranges before parsing
      let values = extractValues(target)
        .map(f.trim)
        .filter(Boolean);
      
      if (listInput) {
        // Apply range expansion to each value for the "In" operator
        values = values.map(value => expandNumericRanges(value))
          .join(',')
          .split(',')
          .map(f.trim)
          .filter(Boolean);
      }

      const parseResults = values.map((value) => parseValue(parser, input, value));
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

  const isBasic = React.useContext(IsQueryBasicContext);

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
        ${isBasic ? 'flex-1' : ''}
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

export const resolvePickListItem = (
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
    terminatingField.table.name === 'SpecifyUser'
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
        ? getField(tables.SpQueryField, 'startValue').length
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

type FieldFilter = {
  readonly id: number;
  readonly label: LocalizedString;
  readonly description: LocalizedString | undefined;
  // If true, show pick list item titles. Else, show free input
  readonly renderPickList: boolean;
  readonly component?: typeof SingleField;
  // Whether to do front-end validation
  readonly hasParser: boolean;
};

/**
 * Basic QueryFieldFilter spec for non-React components and general use.
 * React components should use the useQueryFieldFilters hook as some
 * user preferences can modify/expand the spec, and the hook can listen to
 * preference changes and update the object accordingly
 *
 * REFACTOR: Include attributes of the full field filters of
 * useQueryFieldFilters with this object?
 * So that they can still be easily accessed if needed by helper functions, but
 * in a potentially stale state.
 */
export const queryFieldFilterSpecs: RR<QueryFieldFilter, FieldFilter> = {
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
  },
  greater: {
    id: 2,
    label: queryText.greaterThan(),
    description: undefined,
    renderPickList: false,
    component: SingleField,
    hasParser: true,
  },
  less: {
    id: 3,
    label: queryText.lessThan(),
    description: undefined,
    renderPickList: false,
    component: SingleField,
    hasParser: true,
  },
  greaterOrEqual: {
    id: 4,
    label: queryText.greaterOrEqualTo(),
    description: undefined,
    renderPickList: false,
    component: SingleField,
    hasParser: true,
  },
  lessOrEqual: {
    id: 5,
    label: queryText.lessOrEqualTo(),
    description: undefined,
    renderPickList: false,
    component: SingleField,
    hasParser: true,
  },
  true: {
    id: 6,
    label: queryText.true(),
    description: undefined,
    renderPickList: false,
    hasParser: true,
  },
  false: {
    id: 7,
    label: queryText.false(),
    description: undefined,
    renderPickList: false,
    hasParser: true,
  },
  between: {
    id: 9,
    label: queryText.between(),
    description: undefined,
    renderPickList: false,
    component: Between,
    hasParser: true,
  },
  in: {
    id: 10,
    label: queryText.in(),
    description: queryText.inDescription(),
    renderPickList: true,
    component: In,
    hasParser: true,
  },
  contains: {
    id: 11,
    label: queryText.contains(),
    description: undefined,
    renderPickList: false,
    component: SingleField,
    hasParser: false,
  },
  startsWith: {
    id: 15,
    label: queryText.startsWith(),
    description: undefined,
    renderPickList: false,
    component: SingleField,
    hasParser: false,
  },
  endsWith: {
    id: 18,
    label: queryText.endsWith(),
    description: undefined,
    renderPickList: false,
    component: SingleField,
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
    hasParser: true,
  },
  falseOrNull: {
    id: 14,
    label: queryText.falseOrNull(),
    description: undefined,
    renderPickList: false,
    hasParser: true,
  },
  ageName: {
    id: 17,
    label: resourcesText.name(),
    description: undefined,
    renderPickList: true,
    hasParser: true,
    component: In,
  },
  ageRange: {
    id: 16,
    label: queryText.range(),
    description: undefined,
    renderPickList: false,
    hasParser: true,
    component: Between,
  },
};
