import { RA } from '../../utils/types';
import { Tables } from '../DataModel/types';
import { SpecifyModel } from '../DataModel/specifyModel';
import { f } from '../../utils/functools';
import { schema } from '../DataModel/schema';
import { useAsyncState } from '../../hooks/useAsyncState';
import React from 'react';
import { serializeResource } from '../DataModel/helpers';
import { createQuery } from '../QueryBuilder';
import { runQuery } from '../../utils/ajax/specifyApi';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { flippedSortTypes } from '../QueryBuilder/helpers';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { sortFunction } from '../../utils/utils';
import { formsText } from '../../localization/forms';

export function DateRange({
  table,
  ids,
}: {
  readonly table: SpecifyModel;
  readonly ids: RA<number>;
}): JSX.Element | null {
  const dateFields = rangeDateFields()[table.name];
  return dateFields === undefined ? null : (
    <DateRangeComponent table={table} ids={ids} dateFields={dateFields} />
  );
}

function DateRangeComponent({
  table,
  ids,
  dateFields,
}: {
  readonly table: SpecifyModel;
  readonly ids: RA<number>;
  readonly dateFields: RA<string>;
}): JSX.Element | null {
  const range = useRange(table, ids, dateFields);
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
  table: SpecifyModel,
  ids: RA<number>,
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
                      QueryFieldSpec.fromPath(table.name, ['id'])
                        .toSpQueryField()
                        .set('isDisplay', false)
                        .set('startValue', ids.join(','))
                        .set('operStart', queryFieldFilters.in.id),
                    ])
                  ),
                  {
                    limit: 1,
                  }
                ).then((rows) => rows[0]?.[1])
            )
          )
        ).then((rawDates) => {
          const dates = rawDates
            .filter((date) => typeof date === 'string')
            .map((date) => [date!, new Date(date!)] as const)
            .sort(sortFunction(([_date, sortable]) => sortable));
          return dates.length === 0
            ? undefined
            : {
                from: dates[0][0],
                to: dates.at(-1)![0],
              };
        }),
      [table, ids, dateFields]
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
    Object.values(schema.models)
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
