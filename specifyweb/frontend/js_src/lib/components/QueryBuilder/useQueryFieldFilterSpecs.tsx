import React from 'react';

import type { RR } from '../../utils/types';
import { userPreferences } from '../Preferences/userPreferences';
import type { QueryFieldFilter, QueryFieldType } from './FieldFilterSpec';
import { queryFieldFilterSpecs } from './FieldFilterSpec';

export type ExpandedFieldFilter =
  (typeof queryFieldFilterSpecs)[QueryFieldFilter] & {
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

export function useQueryFieldFilterSpecs(): RR<
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
        ...queryFieldFilterSpecs.any,
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
        ...queryFieldFilterSpecs.like,
        types: {
          text: { visible: true },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      equal: {
        ...queryFieldFilterSpecs.equal,
        types: {
          text: { visible: true },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      greater: {
        ...queryFieldFilterSpecs.greater,
        types: {
          text: { visible: showComparisonOperatorsForString },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      less: {
        ...queryFieldFilterSpecs.less,
        types: {
          text: { visible: showComparisonOperatorsForString },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      greaterOrEqual: {
        ...queryFieldFilterSpecs.greaterOrEqual,
        types: {
          text: { visible: showComparisonOperatorsForString },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      lessOrEqual: {
        ...queryFieldFilterSpecs.lessOrEqual,
        types: {
          text: { visible: showComparisonOperatorsForString },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      true: {
        ...queryFieldFilterSpecs.true,
        types: { checkbox: { visible: true } },
      },
      false: {
        ...queryFieldFilterSpecs.false,
        types: { checkbox: { visible: true } },
      },
      between: {
        ...queryFieldFilterSpecs.between,
        types: {
          text: { visible: true },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      in: {
        ...queryFieldFilterSpecs.in,
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
        ...queryFieldFilterSpecs.contains,
        types: {
          text: { visible: true },
          number: { visible: true },
          date: { visible: true },
          id: { visible: true },
        },
      },
      startsWith: {
        ...queryFieldFilterSpecs.startsWith,
        types: {
          text: { visible: true },
          number: { visible: true },
          date: { visible: false },
          id: { visible: true },
        },
      },
      endsWith: {
        ...queryFieldFilterSpecs.endsWith,
        types: {
          text: { visible: true },
          number: { visible: true },
          date: { visible: false },
          id: { visible: true },
        },
      },
      empty: {
        ...queryFieldFilterSpecs.empty,
        types: {
          checkbox: { visible: true },
          date: { visible: true },
          id: { visible: true },
          number: { visible: true },
          text: { visible: true },
        },
      },
      trueOrNull: {
        ...queryFieldFilterSpecs.trueOrNull,
        types: { checkbox: { visible: true } },
      },
      falseOrNull: {
        ...queryFieldFilterSpecs.falseOrNull,
        types: { checkbox: { visible: true } },
      },
      ageName: {
        ...queryFieldFilterSpecs.ageName,
        types: { age: { visible: true } },
      },
      ageRange: {
        ...queryFieldFilterSpecs.ageRange,
        types: { age: { visible: true } },
      },
    }),
    [showComparisonOperatorsForString]
  );
}
