import { requireContext } from '../../../tests/helpers';
import {
  formattedEntry,
  formatToManyIndex,
} from '../../WbPlanView/mappingHelpers';
import { generateMappingPathPreview } from '../../WbPlanView/mappingPreview';
import { QueryFieldSpec } from '../fieldSpec';
import type { QueryField } from '../helpers';
import { getResultHeaderFormatSuffix } from '../Results';

requireContext();

const collectorPath = [
  'collectingEvent',
  'collectors',
  formatToManyIndex(1),
  formattedEntry,
];

const makeField = (
  mappingPath: string[],
  fieldFormat?: string
): QueryField => ({
  id: 0,
  mappingPath,
  sortType: undefined,
  isDisplay: true,
  filters: [
    {
      type: 'any',
      startValue: '',
      isNot: false,
      isStrict: false,
      fieldFormat,
    },
  ],
});

const formatters = {
  formatters: [
    { table: { name: 'CollectionObject' }, name: 'Default', isDefault: true },
    { table: { name: 'CollectionObject' }, name: 'Other', isDefault: false },
  ],
  aggregators: [
    { table: { name: 'Collector' }, name: 'Collector', isDefault: true },
    { table: { name: 'Collector' }, name: 'CollectorID', isDefault: false },
  ],
};

test('names an additional visible aggregation while keeping the default heading plain', () => {
  const original = makeField(collectorPath, 'Collector');
  const additional = makeField(collectorPath, 'CollectorID');
  const fields = [original, additional];
  const preview = generateMappingPathPreview(
    'CollectionObject',
    QueryFieldSpec.fromPath('CollectionObject', collectorPath).toMappingPath()
  );

  expect(preview).toBe('Collectors');
  expect(
    `${preview}${getResultHeaderFormatSuffix(original, fields, 'Collector', formatters) ?? ''}`
  ).toBe('Collectors');
  expect(
    `${preview}${getResultHeaderFormatSuffix(additional, fields, 'Collector', formatters)}`
  ).toBe('Collectors (CollectorID)');
  expect(
    getResultHeaderFormatSuffix(
      additional,
      [additional],
      'Collector',
      formatters
    )
  ).toBeUndefined();
});

test('uses the same rule for formatted fields and ignores unrelated paths', () => {
  const path = [formattedEntry];
  const defaultField = makeField(path);
  const additional = makeField(path, 'Other');

  expect(
    getResultHeaderFormatSuffix(
      additional,
      [defaultField, additional],
      'CollectionObject',
      formatters
    )
  ).toBe(' (Other)');
  expect(
    getResultHeaderFormatSuffix(
      additional,
      [makeField(collectorPath), additional],
      'CollectionObject',
      formatters
    )
  ).toBeUndefined();
  expect(
    getResultHeaderFormatSuffix(
      makeField(['catalogNumber']),
      [defaultField, additional],
      'CollectionObject',
      formatters
    )
  ).toBeUndefined();
});
