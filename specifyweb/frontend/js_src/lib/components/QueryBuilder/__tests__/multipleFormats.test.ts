import { requireContext } from '../../../tests/helpers';
import {
  formattedEntry,
  formatToManyIndex,
} from '../../WbPlanView/mappingHelpers';
import type { QueryField } from '../helpers';
import {
  nextAvailableQueryFormat,
  parseQueryFields,
  queryFieldFormatType,
  unParseQueryFields,
} from '../helpers';

requireContext();

const path = [formattedEntry];
const makeField = (format?: string): QueryField => ({
  id: 0,
  mappingPath: path,
  sortType: undefined,
  isDisplay: true,
  filters: [
    {
      type: 'any',
      startValue: '',
      isNot: false,
      isStrict: false,
      fieldFormat: format,
    },
  ],
});

test('offers each formatted type once on the same query path', () => {
  const formats = ['Default', 'Alternate'];
  expect(nextAvailableQueryFormat([], path, formats)).toBe('Default');
  expect(nextAvailableQueryFormat([makeField()], path, formats)).toBe(
    'Alternate'
  );
  expect(
    nextAvailableQueryFormat(
      [makeField(), makeField('Alternate')],
      path,
      formats
    )
  ).toBeUndefined();
  expect(nextAvailableQueryFormat([makeField('Default')], path, formats)).toBe(
    'Alternate'
  );
});

test('identifies aggregated relationships separately from formatted relationships', () => {
  const aggregatedPath = ['preparations', formatToManyIndex(1), formattedEntry];
  expect(queryFieldFormatType(path)).toBe('formatter');
  expect(queryFieldFormatType(aggregatedPath)).toBe('aggregator');
  expect(
    nextAvailableQueryFormat([makeField('Default')], aggregatedPath, [
      'Default',
    ])
  ).toBe('Default');
});

test('keeps distinct formatted columns when serializing and parsing', () => {
  const fields = [makeField('Default'), makeField('Alternate')];
  const serialized = unParseQueryFields('CollectionObject', fields);
  expect(serialized).toHaveLength(2);
  expect(
    parseQueryFields(serialized).map(({ filters }) => filters[0]?.fieldFormat)
  ).toEqual(['Default', 'Alternate']);

  const aggregatedPath = ['preparations', formatToManyIndex(1), formattedEntry];
  const aggregated = unParseQueryFields('CollectionObject', [
    { ...makeField('Default'), mappingPath: aggregatedPath },
    { ...makeField('Alternate'), mappingPath: aggregatedPath },
  ]);
  expect(aggregated).toHaveLength(2);
  expect(
    parseQueryFields(aggregated).map(({ filters }) => filters[0]?.fieldFormat)
  ).toEqual(['Default', 'Alternate']);
});
