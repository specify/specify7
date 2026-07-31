import {
  filterCompatibleFormatters,
  numericJavaTypes,
} from '../helpers';
import type { SimpleFieldFormatter } from '../schemaData';

const makeFormatter = (
  overrides: Partial<SimpleFieldFormatter> = {}
): SimpleFieldFormatter => ({
  name: 'TestFormatter',
  isSystem: false,
  value: '###',
  field: undefined,
  tableName: undefined,
  index: 0,
  isNumericOnly: false,
  ...overrides,
});

describe('filterCompatibleFormatters', () => {
  const numericFormatter = makeFormatter({
    name: 'NumericOnly',
    isNumericOnly: true,
  });
  const alphaFormatter = makeFormatter({
    name: 'WithAlpha',
    isNumericOnly: false,
  });
  const allFormatters = [numericFormatter, alphaFormatter];

  test('returns all formatters for string fields', () => {
    const result = filterCompatibleFormatters(
      allFormatters,
      'java.lang.String'
    );
    expect(result).toHaveLength(2);
    expect(result).toEqual(allFormatters);
  });

  test('returns all formatters for text fields', () => {
    const result = filterCompatibleFormatters(allFormatters, 'text');
    expect(result).toHaveLength(2);
  });

  test('returns all formatters when field type is null', () => {
    const result = filterCompatibleFormatters(allFormatters, null);
    expect(result).toHaveLength(2);
  });

  test('filters out non-numeric formatters for Integer fields', () => {
    const result = filterCompatibleFormatters(
      allFormatters,
      'java.lang.Integer'
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('NumericOnly');
  });

  test('filters out non-numeric formatters for Float fields', () => {
    const result = filterCompatibleFormatters(
      allFormatters,
      'java.lang.Float'
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('NumericOnly');
  });

  test('filters out non-numeric formatters for BigDecimal fields', () => {
    const result = filterCompatibleFormatters(
      allFormatters,
      'java.math.BigDecimal'
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('NumericOnly');
  });

  test('filters for all numeric Java types', () => {
    for (const javaType of numericJavaTypes) {
      const result = filterCompatibleFormatters(allFormatters, javaType);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('NumericOnly');
    }
  });

  test('returns empty array when no formatters are numeric-compatible', () => {
    const result = filterCompatibleFormatters(
      [alphaFormatter],
      'java.lang.Integer'
    );
    expect(result).toHaveLength(0);
  });

  test('does not filter for date fields', () => {
    const result = filterCompatibleFormatters(
      allFormatters,
      'java.util.Calendar'
    );
    expect(result).toHaveLength(2);
  });

  test('does not filter for boolean fields', () => {
    const result = filterCompatibleFormatters(
      allFormatters,
      'java.lang.Boolean'
    );
    expect(result).toHaveLength(2);
  });
});
