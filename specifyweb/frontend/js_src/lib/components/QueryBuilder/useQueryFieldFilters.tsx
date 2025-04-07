import React from 'react';

import { type RA, type RR, filterArray } from '../../utils/types';
import { userPreferences } from '../Preferences/userPreferences';
import type { QueryFieldFilter, QueryFieldType } from './FieldFilter';
import { queryFieldFilters } from './FieldFilter';

type ExpandedFieldFilter = (typeof queryFieldFilters)[QueryFieldFilter] & {
  readonly types: RA<QueryFieldType>;
};

export function useQueryFieldFilters(): RR<
  QueryFieldFilter,
  ExpandedFieldFilter
> {
  const [showComparisonOperatorsForString] = userPreferences.use(
    'queryBuilder',
    'behavior',
    'showComparisonOperatorsForString'
  );

  return React.useMemo(
    () => ({
      any: {
        ...queryFieldFilters.any,
        types: [
          'checkbox',
          'date',
          'id',
          'number',
          'text',
          'formatter',
          'aggregator',
          'age',
        ],
      },
      like: {
        ...queryFieldFilters.like,
        types: ['text', 'number', 'date', 'id'],
      },
      equal: {
        ...queryFieldFilters.equal,
        types: ['text', 'number', 'date', 'id'],
      },
      greater: {
        ...queryFieldFilters.greater,
        types: filterArray([
          showComparisonOperatorsForString ? 'text' : undefined,
          'number',
          'date',
          'id',
        ]),
      },
      less: {
        ...queryFieldFilters.less,
        types: filterArray([
          showComparisonOperatorsForString ? 'text' : undefined,
          'number',
          'date',
          'id',
        ]),
      },
      greaterOrEqual: {
        ...queryFieldFilters.greaterOrEqual,
        types: filterArray([
          showComparisonOperatorsForString ? 'text' : undefined,
          'number',
          'date',
          'id',
        ]),
      },
      lessOrEqual: {
        ...queryFieldFilters.lessOrEqual,
        types: filterArray([
          showComparisonOperatorsForString ? 'text' : undefined,
          'number',
          'date',
          'id',
        ]),
      },
      true: {
        ...queryFieldFilters.true,
        types: ['checkbox'],
      },
      false: {
        ...queryFieldFilters.false,
        types: ['checkbox'],
      },
      between: {
        ...queryFieldFilters.between,
        types: ['text', 'number', 'date', 'id'],
      },
      in: {
        ...queryFieldFilters.in,
        /*
         * Can't use "date" for IN because date picker does not allow separating
         * multiple values with a comma. Instead, OR filters should be used
         */
        types: ['text', 'number', 'id'],
      },
      contains: {
        ...queryFieldFilters.contains,
        types: ['text', 'number', 'date', 'id'],
      },
      startsWith: {
        ...queryFieldFilters.startsWith,
        types: ['text', 'number', 'date', 'id'],
      },
      empty: {
        ...queryFieldFilters.empty,
        types: ['checkbox', 'date', 'id', 'number', 'text'],
      },
      trueOrNull: {
        ...queryFieldFilters.trueOrNull,
        types: ['checkbox'],
      },
      falseOrNull: {
        ...queryFieldFilters.falseOrNull,
        types: ['checkbox'],
      },
      ageName: {
        ...queryFieldFilters.ageName,
        types: ['age'],
      },
      ageRange: {
        ...queryFieldFilters.ageRange,
        types: ['age'],
      },
    }),
    [showComparisonOperatorsForString]
  );
}
