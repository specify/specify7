import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { formsText } from '../../localization/forms';
import { dayjs } from '../../utils/dayJs';
import { f } from '../../utils/functools';
import { fullDateFormat } from '../../utils/parser/dateFormat';
import { parseAnyDate } from '../../utils/relativeDate';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { serializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { genericTables } from '../DataModel/tables';
import type { SpQueryField, Tables } from '../DataModel/types';
import { createQuery } from '../QueryBuilder';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { flippedSortTypes } from '../QueryBuilder/helpers';
import { runQuery } from '../QueryBuilder/ResultsWrapper';

export function DateRange({
  table,
  filterQueryField,
}: {
  readonly filterQueryField: SpecifyResource<SpQueryField>;
  readonly table: SpecifyTable;
  readonly ids: RA<number>;
}): JSX.Element | null {
  const dateFields = rangeDateFields()[table.name];
  return dateFields === undefined ? null : (
    <DateRangeComponent
      dateFields={dateFields}
      filterQueryField={filterQueryField}
      table={table}
    />
  );
}

function DateRangeComponent({
  table,
  dateFields,
  filterQueryField,
}: {
  readonly table: SpecifyTable;
  readonly dateFields: RA<string>;
  readonly filterQueryField: SpecifyResource<SpQueryField>;
}): JSX.Element | null {
  const range = useRange(filterQueryField, table, dateFields);
  return range === undefined ? null : (
    <>
      {formsText.dateRange({
        from: range.from,
        to: range.to,
      })}
    </>
  );
}

function useRange(
  filterQueryField: SpecifyResource<SpQueryField>,
  table: SpecifyTable,
  dateFields: RA<string>
): { readonly from: string; readonly to: string } | undefined {
  return useAsyncState(
    React.useCallback(
      async () =>
        Promise.all(
          dateFields.flatMap((dateField) =>
            [flippedSortTypes.ascending, flippedSortTypes.descending].map(
              async (sortType) =>
                runQuery<readonly [number, string | null]>(
                  serializeResource(
                    createQuery('Date field range query', table).set('fields', [
                      QueryFieldSpec.fromPath(table.name, [dateField])
                        .toSpQueryField()
                        .set('sortType', sortType)
                        .set('isNot', true)
                        .set('operStart', queryFieldFilters.empty.id),
                      filterQueryField,
                    ])
                  ),
                  {
                    limit: 1,
                  }
                ).then((rows) => (rows.length === 0 ? null : rows[0][1]))
            )
          )
        ).then((rawDates) => {
          const dates = Array.from(
            filterArray(
              rawDates.map((date) => {
                if (date === null) return undefined;
                return parseAnyDate(date);
              })
            )
          ).sort(sortFunction((date) => date.getTime()));
          return dates.length === 0
            ? undefined
            : {
                from: dayjs(dates[0]).format(fullDateFormat()),
                to: dayjs(dates.at(-1)).format(fullDateFormat()),
              };
        }),
      [table, filterQueryField, dateFields]
    ),
    false
  )[0];
}

const rangeDates = new Set(['startDate', 'endDate']);

const rangeDateFields = f.store(() => ({
  /*
   * Include all startDate, endDate fields and fields like <tableName>Date where
   * tableName is the name of the table the field is from
   *
   * Note: this doesn't include all date fields. It only includes date fields
   * that are applicable for use in date ranges.
   */
  ...Object.fromEntries(
    Object.values(genericTables)
      .map((table) => [
        table.name,
        table.literalFields
          .filter(
            (field) =>
              (rangeDates.has(field.name) ||
                `${table.name}Date`.toLowerCase() ===
                  field.name.toLowerCase()) &&
              field.isTemporal()
          )
          .map(({ name }) => name),
      ])
      .filter(([_tableName, fields]) => fields.length > 0)
  ),
  ...customDateFields,
}));

const customDateFields: {
  readonly [TABLE_NAME in keyof Tables]?: RA<
    keyof Tables[TABLE_NAME]['fields']
  >;
} = {
  CollectionObject: ['catalogedDate'],
  Determination: ['determinedDate'],
  ExchangeIn: ['exchangeDate'],
  ExchangeOut: ['exchangeDate'],
  Preparation: ['preparedDate'],
};

export const exportsForTests = {
  rangeDateFields,
};
