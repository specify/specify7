import React from 'react';

import queryText from '../localization/query';
import type { QueryField } from '../querybuilderutils';
import type { RA, RR } from '../types';
import { getValidationAttributes, Parser } from '../uiparse';
import { Input } from './basic';

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
  | 'empty'
  | 'trueOrNull'
  | 'falseOrNull';

function QueryInputField({
  field,
  parser,
  fieldName = 'startValue',
  onChange: handleChange,
}: {
  readonly field: QueryField;
  readonly parser: Parser;
  readonly fieldName?: 'startValue' | 'endValue';
  readonly onChange: (newField: QueryField) => void;
}): JSX.Element {
  // TODO: handle paste for dateField fullDate
  return (
    <Input
      {...getValidationAttributes(parser)}
      value={fieldName}
      onChange={({ target }): void =>
        handleChange({
          ...field,
          [fieldName]: target.value,
        })
      }
    />
  );
}

function Between({
  field,
  parser,
  onChange: handleChange,
}: {
  readonly field: QueryField;
  readonly parser: Parser;
  readonly onChange: (newField: QueryField) => void;
}): JSX.Element {
  return (
    <>
      <QueryInputField
        field={field}
        parser={parser}
        fieldName="startValue"
        onChange={handleChange}
      />
      <QueryInputField
        field={field}
        parser={parser}
        fieldName="endValue"
        onChange={handleChange}
      />
    </>
  );
}

// The order of elements here matters
export const queryFieldFilters: RR<
  QueryFieldFilter,
  {
    label: string;
    types?: RA<QueryFieldType>;
    component?: typeof QueryInputField;

    negation?: string;
    format: boolean;
  }
> = {
  any: {
    label: queryText('any'),
    format: false,
  },
  like: {
    label: queryText('like'),
    types: ['text', 'number', 'date', 'id'],
    format: false,
  },
  equal: {
    label: queryText('equal'),
    component: QueryInputField,
    negation: '≠',
    format: true,
  },
  greater: {
    label: queryText('greaterThan'),
    component: QueryInputField,
    negation: '≯',
    types: ['number', 'date', 'id'],
    format: true,
  },
  less: {
    label: queryText('lessThan'),
    component: QueryInputField,
    negation: '≮',
    types: ['number', 'date', 'id'],
    format: true,
  },
  greaterOrEqual: {
    label: queryText('greaterOrEqualTo'),
    component: QueryInputField,
    negation: '≱',
    types: ['number', 'date', 'id'],
    format: true,
  },
  lessOrEqual: {
    label: queryText('lessOrEqualTo'),
    component: QueryInputField,
    negation: '≰',
    types: ['number', 'date', 'id'],
    format: true,
  },
  true: {
    label: queryText('true'),
    negation: 'Not True',
    types: ['checkbox'],
    format: false,
  },
  false: {
    label: queryText('false'),
    negation: 'Not False',
    types: ['checkbox'],
    format: false,
  },
  between: {
    label: queryText('between'),
    types: ['text', 'number', 'date', 'id'],
    format: false,
    component: Between,
  },
  in: {
    label: queryText('in'),
    types: ['text', 'number', 'date', 'id'],
    format: false,
  },
  contains: {
    label: queryText('contains'),
    component: QueryInputField,
    types: ['text', 'number', 'date', 'id'],
    format: false,
  },
  empty: {
    label: queryText('empty'),
    negation: 'Not Empty',
    format: false,
  },
  trueOrNull: {
    label: queryText('trueOrNull'),
    negation: 'False',
    types: ['checkbox'],
    format: false,
  },
  falseOrNull: {
    label: queryText('falseOrNull'),
    negation: 'True',
    types: ['checkbox'],
    format: false,
  },
};

export function QueryLineFilter({
  field,
  parser,
  onChange: handleChange,
}: {
  readonly field: QueryField;
  readonly parser: Parser;
  readonly onChange: (newField: QueryField) => void;
}): JSX.Element | null {
  const Component = queryFieldFilters[field.filter].component;
  return typeof Component === 'undefined' ? null : (
    <Component field={field} onChange={handleChange} parser={parser} />
  );
}
