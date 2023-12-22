import { getDateInputValue } from '../../utils/dayJs';
import { f } from '../../utils/functools';
import type { Parser } from '../../utils/parser/definitions';
import { resolveParser } from '../../utils/parser/definitions';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { PartialDatePrecision } from './useDatePrecision';

export const getDateParser = (
  dateField: LiteralField | Relationship | undefined,
  precision: PartialDatePrecision,
  defaultValue: Date | undefined
): Parser => ({
  ...(precision === 'month-year'
    ? undefined
    : resolveParser(dateField ?? {}, {
        type: precision === 'full' ? 'java.util.Date' : precision,
      })),
  value: f.maybe(defaultValue, getDateInputValue),
});
