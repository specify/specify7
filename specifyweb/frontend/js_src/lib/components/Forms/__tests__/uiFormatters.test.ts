import { mockTime, requireContext } from '../../../tests/helpers';
import { schema } from '../../DataModel/schema';
import type { UiFormatter } from '../uiFormatters';
import { fetchContext, getUiFormatters } from '../uiFormatters';

mockTime();
requireContext();

test('formatters are fetched and parsed correctly', async () =>
  expect(fetchContext).resolves.toMatchSnapshot());

const getFormatter = (): UiFormatter | undefined =>
  schema.models.CollectionObject.getField('catalogNumber')?.getUiFormatter();

const getSecondFormatter = (): UiFormatter | undefined =>
  getUiFormatters().AccessionNumber;

describe('valueOrWild', () => {
  test('catalog number', () =>
    expect(getFormatter()?.valueOrWild()).toBe('#########'));

  test('accession number', () =>
    expect(getSecondFormatter()?.valueOrWild()).toBe('2022-AA-###'));
});

describe('parseRegExp', () => {
  test('catalog number', () =>
    expect(getFormatter()?.parseRegExp()).toBe('^(#########|\\d{0,9})$'));
  test('accession number', () =>
    expect(getSecondFormatter()?.parseRegExp()).toBe(
      '^(YEAR|\\d{4})(-)([a-zA-Z0-9]{2})(-)(###|\\d{3})$'
    ));
});

describe('pattern', () => {
  test('catalog number', () =>
    expect(getUiFormatters().CatalogNumberNumericRegex?.pattern()).toBe(
      '####[-A]'
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
