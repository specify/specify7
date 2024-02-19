/** Parser for the SQL Select Query strings in TypeSearches XML definitions */

import type { IR } from '../../utils/types';
import { defined } from '../../utils/types';
import { backboneFieldSeparator } from '../DataModel/helpers';

export const columnToFieldMapper = (
  sqlSelectQuery: string
): ((columnName: string) => string) =>
  columnToField.bind(undefined, parseSqlQuery(sqlSelectQuery));

const reFrom = /from\s+(\w+)\s+(?:as\s+)?(\w+)/iu;
const reJoin = /join\s+(\w+\.\w+)\s+(?:as\s+)?(\w+)/giu;

export function parseSqlQuery(sqlSelectQuery: string): IR<string> {
  const [_match, table, tableAlias] = defined(
    reFrom.exec(sqlSelectQuery) ?? undefined,
    `Unable to parse SQL query: ${sqlSelectQuery}`
  );
  const columnMapping = {
    [tableAlias]: table,
  };

  Array.from(
    sqlSelectQuery.matchAll(reJoin),
    ([_match, fieldWithTable, alias]) => {
      const [table, fieldName] = fieldWithTable.split(backboneFieldSeparator);
      const col = defined(columnMapping[table]);
      columnMapping[alias] = `${col}.${fieldName}`;
    }
  );
  return columnMapping;
}

function columnToField(columnMapping: IR<string>, columnName: string): string {
  const column = columnName.split(backboneFieldSeparator);
  return column.length === 1
    ? columnName
    : [...columnMapping[column[0]].split(backboneFieldSeparator), column[1]]
        .slice(1)
        .join(backboneFieldSeparator);
}

export const exportsForTests = {
  columnToField,
  parseSqlQuery,
};
