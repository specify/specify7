import { requireContext } from '../../../tests/helpers';
import { QueryFieldSpec } from '../fieldSpec';
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
  getUsedQueryFormats,
  getDefaultQueryFormat,
} from '../helpers';

requireContext();

test('reserves the resolved Schema Config default instead of the first format', () => {
  const formats = [
    { name: 'A', isDefault: false },
    { name: 'B', isDefault: false },
  ];
  const resolved = getDefaultQueryFormat(formats, 'B', true);
  expect(resolved).toBe('B');
  expect(
    nextAvailableQueryFormat(
      [makeField()],
      path,
      ['A', 'B'],
      'CollectionObject',
      resolved ?? null
    )
  ).toBe('A');
  expect(
    getDefaultQueryFormat(
      [{ name: 'A', isDefault: true }, formats[1]],
      'B',
      true
    )
  ).toBe('A');
  expect(getDefaultQueryFormat(formats, undefined, false)).toBeUndefined();
});

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
  expect(nextAvailableQueryFormat([], path, formats)).toBeUndefined();
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
  ).toBeUndefined();
});

test('uses relationship schema for remote one-to-one formats before and after reload', () => {
  const remotePath = ['cojo', formatToManyIndex(1), formattedEntry];
  expect(queryFieldFormatType(remotePath, 'CollectionObject')).toBe(
    'formatter'
  );
  const spec = QueryFieldSpec.fromPath('CollectionObject', remotePath);
  const attributes = spec.toSpQueryAttributes();
  const reloaded = QueryFieldSpec.fromStringId(
    attributes.stringId,
    attributes.isRelFld ?? false
  ).toMappingPath();
  const existing = [{ ...makeField(), mappingPath: reloaded }];
  expect(getUsedQueryFormats(existing, remotePath, 'CollectionObject')).toEqual(
    new Set([''])
  );
  expect(
    nextAvailableQueryFormat(
      existing,
      remotePath,
      ['Default', 'Alternate'],
      'CollectionObject'
    )
  ).toBe('Alternate');
  expect(queryFieldFormatType(reloaded, 'CollectionObject')).toBe('formatter');
  expect(
    queryFieldFormatType(
      ['preparations', formatToManyIndex(2), formattedEntry],
      'CollectionObject'
    )
  ).toBe('aggregator');
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

test('keeps the first formatted or aggregated column on the implicit default', () => {
  const aggregatedPath = ['preparations', formatToManyIndex(1), formattedEntry];
  for (const mappingPath of [path, aggregatedPath]) {
    const firstFormat = nextAvailableQueryFormat([], mappingPath, [
      'Default',
      'Alternate',
    ]);
    expect(firstFormat).toBeUndefined();
    const first = { ...makeField(firstFormat), mappingPath };
    expect(
      unParseQueryFields('CollectionObject', [first])[0]?.formatName
    ).toBeUndefined();
    expect(
      nextAvailableQueryFormat([first], mappingPath, ['Default', 'Alternate'])
    ).toBe('Alternate');
  }
});
