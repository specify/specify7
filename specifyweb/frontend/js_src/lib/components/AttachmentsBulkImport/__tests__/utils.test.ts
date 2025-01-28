import type { LocalizedString } from 'typesafe-i18n';

import { requireContext } from '../../../tests/helpers';
import { fieldFormatterToParser } from '../../../utils/parser/definitions';
import type { IR, RA } from '../../../utils/types';
import { localized } from '../../../utils/types';
import { tables } from '../../DataModel/tables';
import {
  CatalogNumberNumeric,
  fieldFormatterTypeMapper,
  UiFormatter,
} from '../../FieldFormatters';
import { syncFieldFormat } from '../../Formatters/fieldFormat';
import type { PartialUploadableFileSpec, UnBoundFile } from '../types';
import {
  inferDeletedAttachments,
  inferUploadedAttachments,
  matchFileSpec,
  resolveFileNames,
} from '../utils';

requireContext();

type TestDefinition = IR<{
  readonly uiFormatter: UiFormatter;
  readonly testCases: RA<readonly [string, string | undefined]>;
}>;

const staticTestCases: TestDefinition[string]['testCases'] = [
  ['      .jpg', undefined],
  ['\n\n\n\n\t\t', undefined],
  ['\t\t     \n\n.jpg', undefined],
];

const fileNameTestSpec: TestDefinition = {
  catalogNumber: {
    uiFormatter: new CatalogNumberNumeric(),
    testCases: [
      ['000000001.jpg', '000000001'],
      ['00002.jpg', '000000002'],
      ['00001(1).jpg', undefined],
      ['000000003(2).jpg', '000000003'],
      // BUG: This could lead to unexpected matches
      ['0000000000002.jpg', '000000000'],
      ['someRandomValue.jpg', undefined],
      ['\t\t\t0000 \n\n.jpg', '000000000'],
    ],
  },
  numeric: {
    uiFormatter: new UiFormatter(
      false,
      localized('testNumeric'),
      [
        new fieldFormatterTypeMapper.numeric({
          size: 3,
          autoIncrement: true,
          byYear: false,
        }),
      ],
      tables.CollectionObject,
      tables.CollectionObject?.getLiteralField('catalogNumber')
    ),
    testCases: [
      ['000.jpg', '000'],
      ['001.jpg', '001'],
      ['23.jpg', '023'],
      ['DEF001.jpg', undefined],
      ['000(1).jpg', '000'],
      ['23(1).jpg', undefined],
      ['\t\t\t02 \n\n.jpg', '002'],
    ],
  },
  regex: {
    uiFormatter: new UiFormatter(
      false,
      localized('testRegex'),
      [
        new fieldFormatterTypeMapper.regex({
          size: 3,
          autoIncrement: true,
          placeholder: localized('^\\d{1,6}(?:[a-zA-Z]{1,2})?$'),
          byYear: false,
        }),
      ],
      tables.CollectionObject,
      tables.CollectionObject?.getLiteralField('catalogNumber')
    ),
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
      const allTestCases = [...testCases, ...staticTestCases];
      test(testName, () => {
        jest.spyOn(console, 'error').mockImplementation();
        const field = tables.CollectionObject.getLiteralField('text1')!;
        const getResultFormatter =
          (formatter: UiFormatter) =>
          (value: number | string | undefined): LocalizedString | undefined =>
            value === undefined || value === null
              ? undefined
              : syncFieldFormat(
                  field,
                  value.toString(),
                  fieldFormatterToParser(field, formatter),
                  undefined,
                  true
                );
        const resultFormatter = getResultFormatter(uiFormatter);
        allTestCases.forEach(([input, output]) => {
          expect(resolveFileNames(input, resultFormatter, uiFormatter)).toEqual(
            output
          );
        });
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
      /*
       * Shouldn't assume that backend will give back all the results back
       * just more than once, since MySQL will remove duplicates when having the in (..)
       * clause
       */
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

const fakeFile: UnBoundFile = {
  file: {
    name: 'someName',
    size: 0,
    type: 'test',
  },
};

test('reconstruct uploading attachment spec', () => {
  const queryResults = [
    [0, [1, 'location1.jpg']],
    [0, [2, 'location2.jpg']],
    [0, [3, 'location3.jpg']],
    [1, [4, 'location4.jpg']],
    [2, [10, null]], // If set to null by user, skip
  ] as RA<readonly [number, RA<number | string | null>]>;

  const files: RA<PartialUploadableFileSpec> = [
    {
      status: {
        type: 'matched',
        id: 0,
      },
      uploadTokenSpec: {
        attachmentLocation: 'location1.jpg',
        token: 'fakeToken',
      },
      uploadFile: fakeFile,
    },
    {
      status: {
        type: 'matched',
        id: 0,
      },
      uploadTokenSpec: {
        attachmentLocation: 'location2.jpg',
        token: 'fakeToken',
      },
      uploadFile: fakeFile,
    },
    {
      status: {
        type: 'matched',
        id: 0,
      },
      uploadTokenSpec: {
        attachmentLocation: 'location3.jpg',
        token: 'fakeToken',
      },
      uploadFile: fakeFile,
    },
    // This file will be skipped in checking for attachment locations
    {
      status: {
        type: 'skipped',
        reason: 'noMatch',
      },
      uploadTokenSpec: {
        attachmentLocation: 'location10.jpg',
        token: 'fakeToken',
      },
      uploadFile: fakeFile,
    },
    {
      status: {
        type: 'matched',
        // This resource's upload was interrupted.
        id: 100,
      },
      uploadTokenSpec: {
        attachmentLocation: 'location10.jpg',
        token: 'fakeToken',
      },
      uploadFile: fakeFile,
    },
    {
      status: {
        type: 'matched',
        // This resource was uploaded, but then modified by the user in someway
        id: 2,
      },
      uploadTokenSpec: {
        attachmentLocation: 'locationAny.jpg',
        token: 'fakeToken',
      },
      uploadFile: fakeFile,
    },
  ];
  expect(inferUploadedAttachments(queryResults, files)).toMatchSnapshot();
});

test('reconstruct deleting attachment spec', () => {
  const queryResults = [
    [0, [1]],
    [1, [2]],
  ] as RA<readonly [number, RA<number>]>;
  const files: RA<PartialUploadableFileSpec> = [
    // This file wasn't deleted
    {
      status: {
        type: 'matched',
        id: 0,
      },
      uploadFile: fakeFile,
      attachmentId: 1,
    },
    {
      status: {
        type: 'matched',
        id: 0,
      },
      uploadFile: fakeFile,
      // This file was successfully deleted
      attachmentId: 100,
    },
    {
      status: {
        type: 'skipped',
        reason: 'incorrectFormatter',
      },
      uploadFile: fakeFile,
    },
    // This file was uploaded, but the corresponding resource was deleted,
    {
      status: {
        type: 'matched',
        id: 10,
      },
      uploadFile: fakeFile,
      attachmentId: 100,
    },
    // This file was also not deleted
    {
      status: {
        type: 'matched',
        id: 1,
      },
      uploadFile: fakeFile,
      attachmentId: 2,
    },
  ];
  expect(inferDeletedAttachments(queryResults, files)).toMatchSnapshot();
});
