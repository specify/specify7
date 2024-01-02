import type { LocalizedString } from 'typesafe-i18n';

import type { Parser } from '../../utils/parser/definitions';
import { resolveParser } from '../../utils/parser/definitions';
import { parseValue } from '../../utils/parser/parse';
import { localized } from '../../utils/types';
import { removeKey } from '../../utils/utils';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { LiteralField } from '../DataModel/specifyField';
import type { PickList } from '../DataModel/types';
import { unsafeGetPickLists } from '../PickLists/definitions';
import { fetchPickList, getPickListItems } from '../PickLists/fetch';

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
  value: boolean | number | string | null | undefined,
  parser?: Parser,
  formatter?: string
): Promise<LocalizedString> {
  if (value === undefined || value === null) return localized('');

  const formatted = uiFormatter(field, value?.toString() ?? '', formatter);
  if (typeof formatted === 'string') return formatted;

  // Find Pick List Item title
  const pickListName = parser?.pickListName ?? field?.getPickList();
  if (typeof pickListName === 'string') {
    const pickList = await fetchPickList(pickListName);
    const formatted = formatPickList(pickList, value);
    if (typeof formatted === 'string') return formatted;
  }

  return formatValue(field, parser, value, false);
}

function uiFormatter(
  field: Partial<LiteralField> | undefined,
  value: string,
  formatter?: string
): LocalizedString | undefined {
  const uiFormatter = field?.getUiFormatter?.();
  if (typeof uiFormatter === 'object') {
    const formatted = uiFormatter.format(value?.toString() ?? '');
    if (typeof formatted === 'string') return formatted;
    else
      console.error(
        `Invalid value for ${
          formatter ?? field?.getFormat?.() ?? ''
        } formatter: ${value}`,
        { field }
      );
  }
  return undefined;
}

function formatPickList(
  pickList: SpecifyResource<PickList> | undefined,
  value: boolean | number | string
): LocalizedString | undefined {
  if (pickList === undefined) return undefined;
  const parsedValue = value.toString();
  const items = getPickListItems(pickList);
  const item = items.find((item) => item.value === parsedValue);
  return localized(item?.title);
}

/**
 * Format fields value. Does not format pick list items.
 * Prefer using fieldFormat() or syncFieldFormat() instead
 */
function formatValue<STRICT extends boolean = false>(
  field: LiteralField | undefined,
  parser: Parser | undefined,
  value: boolean | number | string,
  // @ts-expect-error
  strict: STRICT = false
): STRICT extends true ? LocalizedString | undefined : LocalizedString {
  const resolvedParser = parser ?? resolveParser(field ?? {});

  const parseResults = parseValue(
    removeKey(resolvedParser, 'required'),
    undefined,
    value.toString()
  );
  if (parseResults.isValid)
    return localized(
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

  return (strict ? undefined : localized(value.toString())) as ReturnType<
    typeof formatValue<STRICT>
  >;
}

/**
 * Like fieldFormat, but synchronous, because it doesn't fetch a pick list if
 * it is not already fetched
 */

export function syncFieldFormat<STRICT extends boolean = false>(
  field: LiteralField | undefined,
  value: boolean | number | string | null | undefined,
  parser?: Parser,
  formatter?: string,
  // @ts-expect-error
  strict: STRICT = false
): ReturnType<typeof formatValue<STRICT>> {
  if (value === undefined || value === null) return '' as LocalizedString;

  const formatted = uiFormatter(field, value?.toString() ?? '', formatter);

  if (typeof formatted === 'string') return formatted;

  // Find Pick List Item Title
  const pickListName = parser?.pickListName ?? field?.getPickList();
  if (typeof pickListName === 'string') {
    const pickList = unsafeGetPickLists()[pickListName];
    const formatted = formatPickList(pickList, value);
    if (typeof formatted === 'string') return formatted;
  }
  return formatValue<STRICT>(field, parser, value, strict);
}

export const exportsForTests = {
  formatValue,
  formatPickList,
};
