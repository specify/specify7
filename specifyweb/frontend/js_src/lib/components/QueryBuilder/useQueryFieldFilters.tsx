import React from 'react';

import type { RR } from '../../utils/types';
import { userPreferences } from '../Preferences/userPreferences';
import type { QueryFieldFilter, QueryFieldType } from './FieldFilter';
import { queryFieldFilters } from './FieldFilter';

type ExpandedFieldFilter = (typeof queryFieldFilters)[QueryFieldFilter] & {
  readonly types: Partial<
    RR<
      QueryFieldType,
      /**
       * A type can be supported by the front/backend, but not be visible to
       * users (e.g., showing comparison operators for text fields if the
       * corresponding preference is set)
       */
      { readonly visible: boolean }
    >
  >;
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
        types: {
          checkbox: { visible: true },
          date: { visible: true },
          id: { visible: true },
          number: { visible: true },
          text: { visible: true },
          formatter: { visible: true },
          aggregator: { visible: true },
          age: { visible: true },
        },
      },
      like: {
        ...queryFieldFilters.like,
        types: {
          text: { visible: true },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      equal: {
        ...queryFieldFilters.equal,
        types: {
          text: { visible: true },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      greater: {
        ...queryFieldFilters.greater,
        types: {
          text: { visible: showComparisonOperatorsForString },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      less: {
        ...queryFieldFilters.less,
        types: {
          text: { visible: showComparisonOperatorsForString },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      greaterOrEqual: {
        ...queryFieldFilters.greaterOrEqual,
        types: {
          text: { visible: showComparisonOperatorsForString },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      lessOrEqual: {
        ...queryFieldFilters.lessOrEqual,
        types: {
          text: { visible: showComparisonOperatorsForString },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      true: {
        ...queryFieldFilters.true,
        types: { checkbox: { visible: true } },
      },
      false: {
        ...queryFieldFilters.false,
        types: { checkbox: { visible: true } },
      },
      between: {
        ...queryFieldFilters.between,
        types: {
          text: { visible: true },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      in: {
        ...queryFieldFilters.in,
        /*
         * Can't use "date" for IN because date picker does not allow separating
         * multiple values with a comma. Instead, OR filters should be used
         */
        types: {
          text: { visible: true },
          number: { visible: true },
          id: { visible: true },
        },
      },
      contains: {
        ...queryFieldFilters.contains,
        types: {
          text: { visible: true },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      startsWith: {
        ...queryFieldFilters.startsWith,
        types: {
          text: { visible: true },
          number: { visible: true },
          date: { visible: false },
          id: { visible: true },
        },
      },
      endsWith: {
        ...queryFieldFilters.endsWith,
        types: {
          text: { visible: true },
          number: { visible: true },
          date: { visible: false },  
          id: { visible: true },
        },
      },
      empty: {
        ...queryFieldFilters.empty,
        types: {
          checkbox: { visible: true },
          date: { visible: true },
          id: { visible: true },
          number: { visible: true },
          text: { visible: true },
        },
      },
      trueOrNull: {
        ...queryFieldFilters.trueOrNull,
        types: { checkbox: { visible: true } },
      },
      falseOrNull: {
        ...queryFieldFilters.falseOrNull,
        types: { checkbox: { visible: true } },
      },
      ageName: {
        ...queryFieldFilters.ageName,
        types: { age: { visible: true } },
      },
      ageRange: {
        ...queryFieldFilters.ageRange,
        types: { age: { visible: true } },
      },
    }),
    [showComparisonOperatorsForString]
  );
}
