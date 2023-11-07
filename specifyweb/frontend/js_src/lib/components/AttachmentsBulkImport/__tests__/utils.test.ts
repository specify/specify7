import { requireContext } from '../../../tests/helpers';
import {
  CatalogNumberNumeric,
  formatterTypeMapper,
  UiFormatter,
} from '../../Forms/uiFormatters';
import { IR, RA } from '../../../utils/types';
import { schema } from '../../DataModel/schema';
import { formatterToParser } from '../../../utils/parser/definitions';
import { syncFieldFormat } from '../../../utils/fieldFormat';
import { matchFileSpec, resolveFileNames } from '../utils';
import { PartialUploadableFileSpec } from '../types';

requireContext();

type TestDefinition = IR<{
  readonly uiFormatter: UiFormatter;
  readonly testCases: RA<[string, undefined | string]>;
}>;

const fileNameTestSpec: TestDefinition = {
  catalogNumber: {
    uiFormatter: new CatalogNumberNumeric(),
    testCases: [
      ['000000001.jpg', '000000001'],
      ['00001.jpg', '000000001'],
      ['00001(1).jpg', undefined],
      ['000000001(2).jpg', '000000001'],
      // BUG: This could lead to unexpected matches
      ['0000000000002.jpg', '000000000'],
      ['someRandomValue.jpg', undefined],
    ],
  },
  numeric: {
    uiFormatter: new UiFormatter(false, [
      new formatterTypeMapper.numeric({
        size: 3,
        autoIncrement: true,
        byYear: false,
      }),
    ]),
    testCases: [
      ['000.jpg', '000'],
      ['001.jpg', '001'],
      ['23.jpg', '023'],
      ['DEF001.jpg', undefined],
      ['000(1).jpg', '000'],
      ['23(1).jpg', undefined],
    ],
  },
  regex: {
    uiFormatter: new UiFormatter(false, [
      new formatterTypeMapper.regex({
        size: 3,
        autoIncrement: true,
        value: '^\\d{1,6}(?:[a-zA-Z]{1,2})?$',
        byYear: false,
      }),
    ]),
    testCases: [
      ['45265.jpg', '45265'],
      ['45622AB.jpg', '45622AB'],
      ['45622AB', '45622AB'],
      ['45622787ABCDEF.jpg', undefined],
    ],
  },
};

describe('file names resolution test', () => {
  // Using text1 to not confuse with potential catalog number autonumbering
  Object.entries(fileNameTestSpec).forEach(
    ([testName, { uiFormatter, testCases }]) => {
      test(testName, () => {
        jest.spyOn(console, 'error').mockImplementation();
        const field = schema.models.CollectionObject.getLiteralField('text1')!;
        const getResultFormatter = (formatter: UiFormatter) => {
          return (value: string | undefined | number) =>
            value === undefined || value === null
              ? undefined
              : syncFieldFormat(
                  field,
                  formatterToParser(field, formatter),
                  value.toString(),
                  true
                );
        };
        const resultFormatter = getResultFormatter(uiFormatter);
        testCases.forEach(([input, output]) =>
          expect(resolveFileNames(input, resultFormatter, uiFormatter)).toEqual(
            output
          )
        );
      });
    }
  );
});

describe('resolve file names', () => {
  const queryResults = [
    [0, '1'] as const,
    [1, '2'] as const,
    [2, '3'] as const,
    [3, '4'] as const,
    [10, '5'] as const,
    [11, '5'] as const,
  ];
  const uploadSpec: RA<PartialUploadableFileSpec> = [
    {
      uploadFile: {
        file: { name: 'test', size: 0, type: '0' },
        parsedName: '1',
      },
    },
    {
      uploadFile: {
        file: { name: 'test2', size: 0, type: '0' },
        parsedName: '2',
      },
    },
    {
      uploadFile: {
        file: { name: 'test3', size: 0, type: '0' },
        parsedName: '3',
      },
    },
    {
      uploadFile: {
        file: { name: 'test4', size: 0, type: '0' },
        parsedName: '4',
      },
      attachmentId: 10,
      matchedId: [2],
      disambiguated: 10,
    },
    {
      // Shouldn't assume that backend will give back all the results back
      // just more than once, since MySQL will remove duplicates when having the in (..)
      // clause
      uploadFile: {
        file: { name: 'test5', size: 0, type: '0' },
        parsedName: '4',
      },
    },
    {
      uploadFile: {
        file: { name: 'test6', size: 0, type: '0' },
        parsedName: '5',
      },
      // This will be reset
      matchedId: [12, 13, 10, 11],
      disambiguated: 10,
    },
    {
      uploadFile: {
        file: { name: 'test6', size: 0, type: '0' },
        parsedName: '5',
      },
      matchedId: [10, 11],
      // This should be reset, even if keeping disambiguation since it is stale
      disambiguated: 18,
    },
    {
      uploadFile: {
        file: { name: 'test7', size: 0, type: '0' },
        parsedName: '5',
      },
      matchedId: [10, 11],
      // This should be preserved
      disambiguated: 10,
    },
  ];
  test('resolve file names from validation', () => {
    expect(matchFileSpec(uploadSpec, queryResults)).toMatchSnapshot();
  });
  test('resolve file names from validation (keeping disambiguation)', () => {
    expect(matchFileSpec(uploadSpec, queryResults, true)).toMatchSnapshot();
  });
});
