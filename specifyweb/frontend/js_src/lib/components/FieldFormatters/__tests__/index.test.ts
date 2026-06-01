import { mockTime, requireContext } from '../../../tests/helpers';
import { getField } from '../../DataModel/helpers';
import { tables } from '../../DataModel/tables';
import { UiFormatter, fetchContext, fieldFormatterTypeMapper, getUiFormatters } from '..';
import { localized } from '../../../utils/types';

mockTime();
requireContext();

test('field formatters are fetched and parsed correctly', async () =>
  expect(fetchContext).resolves.toMatchSnapshot());

const getFormatter = (): UiFormatter | undefined =>
  getField(tables.CollectionObject, 'catalogNumber')?.getUiFormatter();

const getSecondFormatter = (): UiFormatter | undefined =>
  getUiFormatters().AccessionNumber;

describe('defaultValue', () => {
  test('catalog number', () =>
    expect(getFormatter()?.defaultValue).toBe('#########'));

  test('accession number', () =>
    expect(getSecondFormatter()?.defaultValue).toBe('2022-AA-###'));
});

describe('placeholder', () => {
  test('catalog number', () =>
    expect(getUiFormatters().CatalogNumberNumericRegex?.placeholder).toBe(
      '####[-A]'
    ));
  test('accession number', () =>
    expect(getSecondFormatter()?.placeholder).toBe('2022-AA-###'));
});

describe('regex', () => {
  test('catalog number', () =>
    expect(getFormatter()?.regex.source).toBe('^(#########|\\d{0,9})$'));
  test('accession number', () =>
    expect(getSecondFormatter()?.regex.source).toBe(
      '^(YEAR|\\d{4})(-)([a-zA-Z0-9]{2})(-)(###|\\d{3})$'
    ));
});

describe('format', () => {
  test('catalog number', () =>
    expect(getFormatter()?.format('4')).toBe('000000004'));

  test('overly long catalog number', () =>
    expect(getFormatter()?.format('0000000004')).toBeUndefined());

  test('invalid catalog number', () =>
    expect(getFormatter()?.format('a')).toBeUndefined());

  test('grouped regex preserves full value', () => {
    const formatter = new UiFormatter(
      false,
      localized('GroupedRegex'),
      [
        new fieldFormatterTypeMapper.regex({
          size: 1,
          placeholder: localized(
            '(CANB|CBG|CNS|JCT|QRS)-([0-9]{4})-([0-9]{3})'
          ),
          autoIncrement: false,
          byYear: false,
          regexPlaceholder: localized('eg. CANB-2024-001'),
        }),
      ],
      undefined,
      undefined,
      'GroupedRegex'
    );

    expect(formatter.format('CNS-2026-503')).toBe('CNS-2026-503');
    expect(formatter.format('CBG-1091-030')).toBe('CBG-1091-030');
    expect(formatter.format('CANB-2026-002')).toBe('CANB-2026-002');
  });

  test('numeric decimal depth regex formats full value', () => {
    const formatter = new UiFormatter(
      true,
      localized('NumericDecimalDepth'),
      [
        new fieldFormatterTypeMapper.regex({
          size: 9,
          placeholder: localized('(?:0|[1-9]\\d{0,3})(?:\\.\\d+)?'),
          autoIncrement: false,
          byYear: false,
          regexPlaceholder: localized(''),
        }),
      ],
      undefined,
      undefined,
      'NumericDecimalDepth'
    );

    expect(formatter.format('12.34')).toBe('12.34');
    expect(formatter.format('0')).toBe('0');
  });

  test('catalog number entry book regex formats full value', () => {
    const formatter = new UiFormatter(
      false,
      localized('CatalogNumberEntryBook'),
      [
        new fieldFormatterTypeMapper.regex({
          size: 9,
          placeholder: localized(
            '(?:[1-9]\\d{0,3})\\.(?:00[1-9]|0[1-9]\\d|100)[A-Za-z]?'
          ),
          autoIncrement: false,
          byYear: false,
          regexPlaceholder: localized('ex: 1.001 + {a,b,...} (opt.)'),
        }),
      ],
      undefined,
      undefined,
      'CatalogNumberEntryBook'
    );

    expect(formatter.format('1.001a')).toBe('1.001a');
    expect(formatter.format('9999.100')).toBe('9999.100');
  });
});
