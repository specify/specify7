import { requireContext } from '../../../tests/helpers';
import type { QueryField } from '../helpers';
import { unParseQueryFields } from '../helpers';

requireContext();

// [QueryBuilder] Map the age range filter
test('maps the age range filter to a query field', () => {
  const field: QueryField = {
    id: 0,
    mappingPath: ['age'],
    sortType: undefined,
    isDisplay: true,
    filters: [
      {
        type: 'ageRange',
        startValue: '-10.5,20.25',
        isNot: false,
        isStrict: true,
      },
    ],
  };

  const [serialized] = unParseQueryFields('CollectionObject', [field]);

  expect(serialized).toMatchObject({
    tableList: '1',
    stringId: '1.collectionobject.age',
    fieldName: 'age',
    operStart: 16,
    startValue: '-10.5,20.25',
    isStrict: true,
    isDisplay: true,
  });
});

// [QueryBuilder] Map the age name filter
test('maps the age name filter to a query field', () => {
  const field: QueryField = {
    id: 0,
    mappingPath: ['age'],
    sortType: undefined,
    isDisplay: true,
    filters: [
      {
        type: 'ageName',
        startValue: 'Paleocene',
        isNot: false,
        isStrict: false,
      },
    ],
  };

  const [serialized] = unParseQueryFields('CollectionObject', [field]);

  expect(serialized).toMatchObject({
    tableList: '1',
    stringId: '1.collectionobject.age',
    fieldName: 'age',
    operStart: 17,
    startValue: 'Paleocene',
    isStrict: false,
    isDisplay: true,
  });
});
