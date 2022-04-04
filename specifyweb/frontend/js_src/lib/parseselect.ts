/** Parser for the SQL Select Query strings in TypeSearches xml definitions */

import type { IR } from './types';
import { defined } from './types';

const reFrom = /from\s+(\w+)\s+(?:as\s+)?(\w+)/i;
const reJoin = /join\s+(\w+\.\w+)\s+(?:as\s+)?(\w+)/gi;

function parse(sqlSelectQuery: string): IR<string> {
  const [_match, table, tableAlias] = defined(
    reFrom.exec(sqlSelectQuery) ?? undefined
  );
  const columnMapping = {
    [tableAlias]: table,
  };

  Array.from(
    sqlSelectQuery.matchAll(reJoin),
    ([_match, fieldWithTable, alias]) => {
      const [table, fieldName] = fieldWithTable.split('.');
      const col = defined(columnMapping[table]);
      columnMapping[alias] = `${col}.${fieldName}`;
    }
  );
  return columnMapping;
}

function columnToField(columnMapping: IR<string>, columnName: string): string {
  const column = columnName.split('.');
  return column.length === 1
    ? columnName
    : [...columnMapping[column[0]].split('.'), column[1]]
        .slice(0, -1)
        .join('.');
}

export const columnToFieldMapper = (
  sqlSelectQuery: string
): ((columnName: string) => string) =>
  columnToField.bind(undefined, parse(sqlSelectQuery));
