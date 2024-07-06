import { mockTime, requireContext } from '../../../tests/helpers';
import { getField } from '../../DataModel/helpers';
import { tables } from '../../DataModel/tables';
import type { UiFormatter } from '..';
import { fetchContext, getUiFormatters } from '..';

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
    expect(getSecondFormatter()?.placeholder).toBe(
      '^(YEAR|\\d{4})(-)([a-zA-Z0-9]{2})(-)(###|\\d{3})$'
    ));
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
});
