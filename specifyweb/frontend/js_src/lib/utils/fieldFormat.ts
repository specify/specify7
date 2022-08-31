import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import type { LiteralField } from '../components/DataModel/specifyField';
import type { PickList } from '../components/DataModel/types';
import { unsafeGetPickLists } from '../components/PickLists/definitions';
import { fetchPickList, getPickListItems } from '../components/PickLists/fetch';
import type { Parser } from './uiParse';
import { parseValue, resolveParser } from './uiParse';
import { removeKey } from './utils';

/*
 * BUG: when formatting a date field, it uses the databaseDateFormat rather
 *  than fullDateFormat(). check usages to see where this may be a problem.
 */

/**
 * Format value for output
 *
 * @remarks
 * Parses the value
 * Formats it
 * Runs UI formatter if needed
 * Finds pickList item if available
 */
export async function fieldFormat(
  field: LiteralField | undefined,
  parser: Parser | undefined,
  value: boolean | number | string | null | undefined
): Promise<string> {
  if (value === undefined || value === null) return '';

  // Find Pick List Item Title
  const pickListName = parser?.pickListName ?? field?.getPickList();
  if (typeof pickListName === 'string') {
    const pickList = await fetchPickList(pickListName);
    const formatted = formatPickList(pickList, value);
    if (typeof formatted === 'string') return formatted;
  }

  return formatValue(field, parser, value);
}

export function formatPickList(
  pickList: SpecifyResource<PickList> | undefined,
  value: boolean | number | string
): string | undefined {
  if (pickList === undefined) return undefined;
  const parsedValue = value.toString();
  const items = getPickListItems(pickList);
  const item = items.find((item) => item.value === parsedValue);
  return item?.title;
}

/**
 * Format fields value. Does not format pick list items.
 * Prefer using fieldFormat() or syncFieldFormat() instead
 */
export function formatValue(
  field: LiteralField | undefined,
  parser: Parser | undefined,
  value: boolean | number | string
): string {
  const resolvedParser = parser ?? resolveParser(field ?? {});

  const parseResults = parseValue(
    removeKey(resolvedParser, 'required'),
    undefined,
    value.toString()
  );
  if (parseResults.isValid)
    return (
      resolvedParser.printFormatter?.(parseResults.parsed, resolvedParser) ??
      (parseResults.parsed as string | undefined)?.toString() ??
      ''
    );
  else
    console.error('Failed to parse value for field', {
      field,
      resolvedParser,
      parseResults,
    });

  return value.toString();
}

/**
 * Like fieldFormat, but synchronous, because it doesn't fetch a pick list if
 * it is not already fetched
 */
export function syncFieldFormat(
  field: LiteralField | undefined,
  parser: Parser | undefined,
  value: boolean | number | string | null | undefined
): string {
  if (typeof value === 'undefined' || value === null) return '';

  // Find Pick List Item Title
  const pickListName = parser?.pickListName ?? field?.getPickList();
  if (typeof pickListName === 'string') {
    const pickList = unsafeGetPickLists()[pickListName];
    const formatted = formatPickList(pickList, value);
    if (typeof formatted === 'string') return formatted;
  }

  return formatValue(field, parser, value);
}
