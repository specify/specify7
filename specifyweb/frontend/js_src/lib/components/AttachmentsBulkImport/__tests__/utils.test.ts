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
  crossReferenceMappingFiles,
  inferDeletedAttachments,
  inferUploadedAttachments,
  isMappingFilePlaceholder,
  matchFileSpec,
  matchSelectedFiles,
  prepareMappingFileSelection,
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
      tables.CollectionObject?.getLiteralField('catalogNumber'),
      'testNumeric'
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
      tables.CollectionObject?.getLiteralField('catalogNumber'),
      'testRegex'
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

describe('crossReferenceMappingFiles', () => {
  const CSV: RA<{ readonly matchValue: string; readonly fileName: string }> = [
    { matchValue: '000271806', fileName: '271806.jpg' },
    { matchValue: '000601146', fileName: '601146.jpg' },
    { matchValue: '000601146', fileName: '601146_2.jpg' },
    { matchValue: '000273074', fileName: '273074.jpg' },
  ];

  const makePlaceholder = (name: string, mv: string) =>
    ({
      uploadFile: {
        file: { name, size: 0, type: '' },
        parsedName: mv,
        mappingMatchValue: mv,
      },
      status: { type: 'cancelled', reason: 'fileMissing' },
    }) as PartialUploadableFileSpec;

  const makeReal = (name: string, mv: string) =>
    ({
      uploadFile: {
        file: { name, size: 91, type: 'image/jpeg' },
        parsedName: mv,
        mappingMatchValue: mv,
      },
    }) as PartialUploadableFileSpec;

  test('initial seeding produces all placeholders', () => {
    const result = crossReferenceMappingFiles([], CSV);
    expect(result).toHaveLength(4);
    expect(result.every((r) => r.status?.reason === 'fileMissing')).toBe(true);
  });

  test('adding one real file replaces corresponding placeholder', () => {
    const seeded = crossReferenceMappingFiles([], CSV);
    const result = crossReferenceMappingFiles(
      [...seeded, makeReal('601146.jpg', '000601146')],
      CSV
    );
    expect(result).toHaveLength(4);
    expect(
      result.find((r) => r.uploadFile.file.name === '601146.jpg')
        ?.uploadFile.file.size
    ).toBe(91);
    expect(
      result.filter((r) => r.status?.reason === 'fileMissing')
    ).toHaveLength(3);
  });

  test('adding all files removes all placeholders', () => {
    const seeded = crossReferenceMappingFiles([], CSV);
    const result = crossReferenceMappingFiles(
      [
        ...seeded,
        makeReal('271806.jpg', '000271806'),
        makeReal('601146.jpg', '000601146'),
        makeReal('601146_2.jpg', '000601146'),
        makeReal('273074.jpg', '000273074'),
      ],
      CSV
    );
    expect(result).toHaveLength(4);
    expect(
      result.every(
        (r) => !r.status || r.status.reason !== 'fileMissing'
      )
    ).toBe(true);
    expect(result.every((r) => r.uploadFile.file.size === 91)).toBe(true);
  });

  test('batch processing produces no duplicates', () => {
    const seeded = crossReferenceMappingFiles([], CSV);
    const batch1 = crossReferenceMappingFiles(
      [
        ...seeded,
        makeReal('271806.jpg', '000271806'),
        makeReal('601146.jpg', '000601146'),
      ],
      CSV
    );
    expect(batch1).toHaveLength(4);

    const batch2 = crossReferenceMappingFiles(
      [
        ...batch1,
        makeReal('601146_2.jpg', '000601146'),
        makeReal('273074.jpg', '000273074'),
      ],
      CSV
    );
    expect(batch2).toHaveLength(4);
    expect(batch2.every((r) => r.uploadFile.file.size === 91)).toBe(true);
  });

  test('file not in CSV is flagged', () => {
    const seeded = crossReferenceMappingFiles([], CSV);
    const result = crossReferenceMappingFiles(
      [...seeded, makeReal('unknown.jpg', '?')],
      CSV
    );
    expect(
      result.find((r) => r.uploadFile.file.name === 'unknown.jpg')?.status
        ?.reason
    ).toBe('notInMappingFile');
  });

  test('duplicate filenames in CSV produce exactly one row', () => {
    const csv2: RA<{ readonly matchValue: string; readonly fileName: string }> =
      [
        { matchValue: 'A', fileName: 'dup.jpg' },
        { matchValue: 'B', fileName: 'dup.jpg' },
      ];
    const result = crossReferenceMappingFiles(
      [...crossReferenceMappingFiles([], csv2), makeReal('dup.jpg', 'A')],
      csv2
    );
    expect(result).toHaveLength(1);
    expect(result[0].uploadFile.file.size).toBe(91);
  });
});

describe('prepareMappingFileSelection', () => {
  const CSV: RA<{ readonly matchValue: string; readonly fileName: string }> = [
    { matchValue: '000271806', fileName: '271806.jpg' },
    { matchValue: '000601146', fileName: '601146.jpg' },
    { matchValue: '000601146', fileName: '601146_2.jpg' },
  ];

  const makePlaceholder = (name: string, mv: string) =>
    ({
      uploadFile: {
        file: { name, size: 0, type: '' },
        parsedName: mv,
        mappingMatchValue: mv,
      },
      status: { type: 'cancelled', reason: 'fileMissing' },
    }) as PartialUploadableFileSpec;

  const makeReal = (name: string, mv: string) =>
    ({
      uploadFile: {
        file: { name, size: 91, type: 'image/jpeg' },
        parsedName: mv,
        mappingMatchValue: mv,
      },
    }) as PartialUploadableFileSpec;

  test('replaces seeded placeholders with matching uploaded files', () => {
    const seeded = crossReferenceMappingFiles([], CSV);
    const { resolvedFiles, duplicateFiles } = prepareMappingFileSelection(
      seeded,
      [makeReal('601146.jpg', '000601146')],
      CSV
    );

    expect(duplicateFiles).toHaveLength(0);
    expect(resolvedFiles).toHaveLength(3);
    expect(
      resolvedFiles.find((r) => r.uploadFile.file.name === '601146.jpg')
        ?.uploadFile.file.size
    ).toBe(91);
    expect(
      resolvedFiles.filter((r) => r.status?.reason === 'fileMissing')
    ).toHaveLength(2);
  });

  test('keeps uploaded files that are already real while preserving missing placeholders', () => {
    const seeded = crossReferenceMappingFiles([], CSV);
    const { resolvedFiles } = prepareMappingFileSelection(
      [
        ...seeded,
        makeReal('271806.jpg', '000271806'),
        makePlaceholder('601146_2.jpg', '000601146'),
      ],
      [makeReal('601146.jpg', '000601146')],
      CSV
    );

    expect(resolvedFiles).toHaveLength(3);
    expect(resolvedFiles.every((r) => r.uploadFile.file.size === 91 || r.status?.reason === 'fileMissing')).toBe(true);
    expect(
      resolvedFiles.filter((r) => r.uploadFile.file.name === '601146.jpg')
    ).toHaveLength(1);
  });
});

describe('end-to-end: seeding then full file selection', () => {
  // Simulates the real user flow: CSV uploaded → placeholders seeded → user selects files
  const FULL_CSV: RA<{
    readonly matchValue: string;
    readonly fileName: string;
  }> = [
    { matchValue: '000271806', fileName: '271806.jpg' },
    { matchValue: '000601146', fileName: '601146.jpg' },
    { matchValue: '000601146', fileName: '601146_2.jpg' },
    { matchValue: '000273074', fileName: '273074.jpg' },
    { matchValue: '000687972', fileName: '687972.jpg' },
    { matchValue: '000601108', fileName: '601108.jpg' },
    { matchValue: '000728604', fileName: '728604.jpg' },
    { matchValue: '000466309', fileName: '466309.jpg' },
    { matchValue: '000475938', fileName: '475938.jpg' },
    { matchValue: '000855732', fileName: '855732.jpg' },
  ];

  const EXTRA_FILES = ['601766.jpg', '601766_2.jpg', '601766_3.jpg'];

  const allFileNames = [...FULL_CSV.map((r) => r.fileName), ...EXTRA_FILES];

  const makeRealFile = (
    name: string,
    mv: string | undefined
  ): PartialUploadableFileSpec =>
    ({
      uploadFile: {
        file: { name, size: 91, type: 'image/jpeg' } as File,
        parsedName: mv,
        mappingMatchValue: mv,
        mappingFileName: mv !== undefined ? name : undefined,
      },
    }) as PartialUploadableFileSpec;

  const countNames = (
    files: RA<PartialUploadableFileSpec>
  ): Map<string, number> => {
    const m = new Map<string, number>();
    for (const f of files)
      m.set(f.uploadFile.file.name, (m.get(f.uploadFile.file.name) ?? 0) + 1);
    return m;
  };

  test('1: seeding then selecting all files — every name once, mappingMatchValue set', () => {
    const seeded = crossReferenceMappingFiles([], FULL_CSV);
    expect(seeded).toHaveLength(10);

    const filesToResolve = allFileNames.map((name) => {
      const csvRow = FULL_CSV.find((r) => r.fileName === name);
      return makeRealFile(name, csvRow?.matchValue);
    });

    const { resolvedFiles, duplicateFiles } = prepareMappingFileSelection(
      seeded,
      filesToResolve,
      FULL_CSV
    );

    expect(duplicateFiles).toHaveLength(0);
    expect(resolvedFiles).toHaveLength(13);

    const counts = countNames(resolvedFiles);
    for (const [, c] of counts) expect(c).toBe(1);

    const csvNames = new Set(FULL_CSV.map((r) => r.fileName));
    for (const r of resolvedFiles) {
      if (csvNames.has(r.uploadFile.file.name)) {
        expect(r.uploadFile.mappingMatchValue).toBeTruthy();
        expect(r.uploadFile.parsedName).toBeTruthy();
      } else {
        expect(r.status?.reason).toBe('notInMappingFile');
      }
    }
  });

  test('2: selecting all files on empty rows (no prior seeding)', () => {
    const filesToResolve = allFileNames.map((name) => {
      const csvRow = FULL_CSV.find((r) => r.fileName === name);
      return makeRealFile(name, csvRow?.matchValue);
    });

    const { resolvedFiles, duplicateFiles } = prepareMappingFileSelection(
      [],
      filesToResolve,
      FULL_CSV
    );

    expect(duplicateFiles).toHaveLength(0);
    expect(resolvedFiles).toHaveLength(13);

    const counts = countNames(resolvedFiles);
    for (const [, c] of counts) expect(c).toBe(1);
  });

  test('3: reload scenario — saved rows without mappingMatchValue + re-select files', () => {
    // Old saved rows: plain objects, File-like, NO mappingMatchValue
    const savedRows = FULL_CSV.map(
      (row) =>
        ({
          uploadFile: {
            file: { name: row.fileName, size: 91, type: 'image/jpeg' },
            parsedName: row.matchValue,
          },
        }) as PartialUploadableFileSpec
    );

    const newFiles = FULL_CSV.map((row) =>
      makeRealFile(row.fileName, row.matchValue)
    );

    const { resolvedFiles, duplicateFiles } = prepareMappingFileSelection(
      savedRows,
      newFiles,
      FULL_CSV
    );

    expect(duplicateFiles).toHaveLength(0);
    expect(resolvedFiles).toHaveLength(10);

    for (const r of resolvedFiles) {
      expect(r.uploadFile.mappingMatchValue).toBeTruthy();
    }

    const counts = countNames(resolvedFiles);
    for (const [, c] of counts) expect(c).toBe(1);
  });

  test('4: crossReferenceMappingFiles with old row (no mappingMatchValue) + new file → mappingMatchValue wins', () => {
    const oldRow = {
      uploadFile: {
        file: { name: '271806.jpg', size: 91, type: 'image/jpeg' },
        parsedName: '000271806',
      },
    } as PartialUploadableFileSpec;

    const newFile = makeRealFile('271806.jpg', '000271806');

    const result = crossReferenceMappingFiles([oldRow, newFile], FULL_CSV);

    const matches = result.filter(
      (r) => r.uploadFile.file.name === '271806.jpg'
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].uploadFile.mappingMatchValue).toBe('000271806');
  });

  test('5: every output row has mappingMatchValue after cross-reference with mixed data', () => {
    const seeded = crossReferenceMappingFiles([], FULL_CSV);
    const realFiles = FULL_CSV.map((row) =>
      makeRealFile(row.fileName, row.matchValue)
    );

    const result = crossReferenceMappingFiles(
      [...seeded, ...realFiles],
      FULL_CSV
    );

    expect(result).toHaveLength(10);
    for (const r of result) {
      expect(r.uploadFile.mappingMatchValue).toBeTruthy();
    }
  });
});

describe('crossReferenceMappingFiles CSV always wins matchValue', () => {
  test('CSV matchValue overrides row with undefined mappingMatchValue', () => {
    const row = {
      uploadFile: {
        file: { name: 'test.jpg', size: 91, type: 'image/jpeg' },
        parsedName: 'oldValue',
      },
    } as PartialUploadableFileSpec;

    const csv = [{ fileName: 'test.jpg', matchValue: 'newValue' }];
    const result = crossReferenceMappingFiles([row], csv);

    expect(result).toHaveLength(1);
    expect(result[0].uploadFile.mappingMatchValue).toBe('newValue');
    expect(result[0].uploadFile.parsedName).toBe('newValue');
    expect(result[0].uploadFile.mappingFileName).toBe('test.jpg');
  });

  test('CSV matchValue overrides row with different mappingMatchValue', () => {
    const row = {
      uploadFile: {
        file: { name: 'test.jpg', size: 91, type: 'image/jpeg' },
        parsedName: 'oldValue',
        mappingMatchValue: 'oldValue',
        mappingFileName: 'old.jpg',
      },
    } as PartialUploadableFileSpec;

    const csv = [{ fileName: 'test.jpg', matchValue: 'CORRECT_VALUE' }];
    const result = crossReferenceMappingFiles([row], csv);

    expect(result).toHaveLength(1);
    expect(result[0].uploadFile.mappingMatchValue).toBe('CORRECT_VALUE');
    expect(result[0].uploadFile.parsedName).toBe('CORRECT_VALUE');
    expect(result[0].uploadFile.mappingFileName).toBe('test.jpg');
  });
});

// ---------------------------------------------------------------------------
// isMappingFilePlaceholder
// ---------------------------------------------------------------------------
describe('isMappingFilePlaceholder', () => {
  test('returns true for fileMissing cancelled status', () => {
    expect(
      isMappingFilePlaceholder({
        uploadFile: { file: { name: 'a.jpg', size: 0, type: '' } },
        status: { type: 'cancelled', reason: 'fileMissing' },
      } as PartialUploadableFileSpec)
    ).toBe(true);
  });

  test('returns false for other cancelled reasons', () => {
    expect(
      isMappingFilePlaceholder({
        uploadFile: { file: { name: 'a.jpg', size: 0, type: '' } },
        status: { type: 'cancelled', reason: 'noMatch' },
      } as PartialUploadableFileSpec)
    ).toBe(false);
  });

  test('returns false for skipped status', () => {
    expect(
      isMappingFilePlaceholder({
        uploadFile: { file: { name: 'a.jpg', size: 0, type: '' } },
        status: { type: 'skipped', reason: 'fileMissing' },
      } as PartialUploadableFileSpec)
    ).toBe(false);
  });

  test('returns false for success status', () => {
    expect(
      isMappingFilePlaceholder({
        uploadFile: { file: { name: 'a.jpg', size: 0, type: '' } },
        status: { type: 'success', successType: 'uploaded' },
      } as PartialUploadableFileSpec)
    ).toBe(false);
  });

  test('returns false when status is undefined', () => {
    expect(
      isMappingFilePlaceholder({
        uploadFile: { file: { name: 'a.jpg', size: 91, type: 'image/jpeg' } },
      } as PartialUploadableFileSpec)
    ).toBe(false);
  });

  test('returns false for matched status', () => {
    expect(
      isMappingFilePlaceholder({
        uploadFile: { file: { name: 'a.jpg', size: 91, type: 'image/jpeg' } },
        status: { type: 'matched', id: 1 },
      } as PartialUploadableFileSpec)
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// matchSelectedFiles – existing function, now tested with mapping scenarios
// ---------------------------------------------------------------------------
describe('matchSelectedFiles', () => {
  const mk = (name: string, size = 91) =>
    ({
      uploadFile: {
        file: { name, size, type: 'image/jpeg' },
      },
    }) as PartialUploadableFileSpec;

  test('adds new files to empty list', () => {
    const { resolvedFiles, duplicateFiles } = matchSelectedFiles(
      [],
      [mk('a.jpg'), mk('b.jpg')]
    );
    expect(resolvedFiles).toHaveLength(2);
    expect(duplicateFiles).toHaveLength(0);
  });

  test('detects exact duplicate when existing entry has File instance', () => {
    const content = new Uint8Array(91);
    const file = new File([content], 'a.jpg', { type: 'image/jpeg' });
    const existing = [
      { uploadFile: { file } },
    ] as RA<PartialUploadableFileSpec>;
    const { resolvedFiles, duplicateFiles } = matchSelectedFiles(existing, [
      mk('a.jpg'),
    ]);
    expect(resolvedFiles).toHaveLength(1);
    expect(duplicateFiles).toHaveLength(1);
    expect(duplicateFiles[0].uploadFile.file.name).toBe('a.jpg');
  });

  test('placeholder (0 bytes) does NOT match real file (91 bytes) — both kept', () => {
    const placeholder = mk('a.jpg', 0);
    const real = mk('a.jpg', 91);
    const { resolvedFiles } = matchSelectedFiles([placeholder], [real]);
    expect(resolvedFiles).toHaveLength(2);
  });

  test('replaces non-File existing entry with new entry', () => {
    // Simulating a serialized row (plain object, not File instance)
    const saved = {
      uploadFile: {
        file: { name: 'a.jpg', size: 91, type: 'image/jpeg' },
      },
    } as PartialUploadableFileSpec;
    const real = mk('a.jpg', 91);
    const { resolvedFiles, duplicateFiles } = matchSelectedFiles(
      [saved],
      [real]
    );
    expect(resolvedFiles).toHaveLength(1);
    expect(duplicateFiles).toHaveLength(0);
    // The new entry's uploadFile replaced the old one
    expect(resolvedFiles[0].uploadFile).toBe(real.uploadFile);
  });

  test('preserves success status when replacing', () => {
    const saved = {
      uploadFile: {
        file: { name: 'a.jpg', size: 91, type: 'image/jpeg' } as File,
      },
      status: { type: 'success', successType: 'uploaded' },
    } as PartialUploadableFileSpec;
    const real = mk('a.jpg', 91);
    const { resolvedFiles } = matchSelectedFiles([saved], [real]);
    expect(resolvedFiles).toHaveLength(1);
    expect(resolvedFiles[0].status?.type).toBe('success');
  });

  test('preserves skipped/alreadyUploaded status when replacing', () => {
    const saved = {
      uploadFile: {
        file: { name: 'a.jpg', size: 91, type: 'image/jpeg' } as File,
      },
      status: { type: 'skipped', reason: 'alreadyUploaded' },
    } as PartialUploadableFileSpec;
    const real = mk('a.jpg', 91);
    const { resolvedFiles } = matchSelectedFiles([saved], [real]);
    expect(resolvedFiles).toHaveLength(1);
    expect(resolvedFiles[0].status?.type).toBe('skipped');
  });

  test('takes new cancelled status when replacing non-success entry', () => {
    const saved = {
      uploadFile: {
        file: { name: 'a.jpg', size: 91, type: 'image/jpeg' } as File,
      },
      status: { type: 'cancelled', reason: 'noMatch' },
    } as PartialUploadableFileSpec;
    const real = {
      ...mk('a.jpg', 91),
      status: { type: 'cancelled', reason: 'fileMissing' },
    } as PartialUploadableFileSpec;
    const { resolvedFiles } = matchSelectedFiles([saved], [real]);
    expect(resolvedFiles).toHaveLength(1);
    expect(resolvedFiles[0].status?.reason).toBe('fileMissing');
  });
});

// ---------------------------------------------------------------------------
// crossReferenceMappingFiles – additional edge cases
// ---------------------------------------------------------------------------
describe('crossReferenceMappingFiles – edge cases', () => {
  const mk = (
    name: string,
    size: number,
    mv?: string
  ): PartialUploadableFileSpec =>
    ({
      uploadFile: {
        file: { name, size, type: size > 0 ? 'image/jpeg' : '' },
        parsedName: mv,
        mappingMatchValue: mv,
        mappingFileName: mv !== undefined ? name : undefined,
      },
    }) as PartialUploadableFileSpec;

  test('empty CSV returns empty result', () => {
    expect(crossReferenceMappingFiles([], [])).toHaveLength(0);
  });

  test('empty uploadables with CSV produces all placeholders', () => {
    const csv = [
      { fileName: 'a.jpg', matchValue: '1' },
      { fileName: 'b.jpg', matchValue: '2' },
    ];
    const result = crossReferenceMappingFiles([], csv);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.status?.reason === 'fileMissing')).toBe(true);
    expect(result[0].uploadFile.mappingMatchValue).toBe('1');
    expect(result[1].uploadFile.mappingMatchValue).toBe('2');
  });

  test('uploadables not in CSV are flagged notInMappingFile', () => {
    const csv = [{ fileName: 'a.jpg', matchValue: '1' }];
    const result = crossReferenceMappingFiles(
      [mk('a.jpg', 91, '1'), mk('b.jpg', 91), mk('c.jpg', 91)],
      csv
    );
    const b = result.find((r) => r.uploadFile.file.name === 'b.jpg');
    const c = result.find((r) => r.uploadFile.file.name === 'c.jpg');
    expect(b?.status?.reason).toBe('notInMappingFile');
    expect(c?.status?.reason).toBe('notInMappingFile');
    // 'a' should be present and matched
    expect(
      result.find((r) => r.uploadFile.file.name === 'a.jpg')?.status
    ).toBeUndefined();
  });

  test('already-uploaded file (with attachmentId) is preserved through cross-reference', () => {
    const csv = [{ fileName: 'a.jpg', matchValue: '1' }];
    const uploaded = {
      uploadFile: {
        file: { name: 'a.jpg', size: 91, type: 'image/jpeg' },
        parsedName: '1',
        mappingMatchValue: '1',
      },
      attachmentId: 42,
      status: { type: 'success', successType: 'uploaded' },
    } as PartialUploadableFileSpec;

    const result = crossReferenceMappingFiles([uploaded], csv);
    expect(result).toHaveLength(1);
    expect(result[0].attachmentId).toBe(42);
    expect(result[0].status?.type).toBe('success');
  });

  test('byName prefers real File (size 91) over plain object (size 91)', () => {
    const csv = [{ fileName: 'a.jpg', matchValue: '1' }];
    // Plain object first (would be first in byName), then real file
    const plainObj = {
      uploadFile: {
        file: { name: 'a.jpg', size: 91, type: 'image/jpeg' },
        parsedName: '1',
        mappingMatchValue: 'wrong',
      },
    } as PartialUploadableFileSpec;
    const realFile = mk('a.jpg', 91, '1');
    // Give realFile a distinguishable property — it has mappingMatchValue set correctly
    const result = crossReferenceMappingFiles([plainObj, realFile], csv);
    expect(result).toHaveLength(1);
    // mappingMatchValue from CSV overrides regardless — both should be '1'
    expect(result[0].uploadFile.mappingMatchValue).toBe('1');
  });

  test('multiple CSV rows with same filename produce exactly one output row', () => {
    const csv = [
      { fileName: 'a.jpg', matchValue: '1' },
      { fileName: 'a.jpg', matchValue: '1' },
      { fileName: 'b.jpg', matchValue: '2' },
    ];
    const result = crossReferenceMappingFiles([], csv);
    expect(result).toHaveLength(2);
    const a = result.filter((r) => r.uploadFile.file.name === 'a.jpg');
    expect(a).toHaveLength(1);
  });

  test('triple duplicate filename in CSV produces one row', () => {
    const csv = [
      { fileName: 'x.jpg', matchValue: 'A' },
      { fileName: 'x.jpg', matchValue: 'A' },
      { fileName: 'x.jpg', matchValue: 'A' },
    ];
    const result = crossReferenceMappingFiles([mk('x.jpg', 91, 'A')], csv);
    expect(result).toHaveLength(1);
  });

  test('placeholder entries have correct parsedName and mappingMatchValue from CSV', () => {
    const csv = [{ fileName: 'test.jpg', matchValue: 'ABC-123' }];
    const result = crossReferenceMappingFiles([], csv);
    expect(result).toHaveLength(1);
    expect(result[0].uploadFile.parsedName).toBe('ABC-123');
    expect(result[0].uploadFile.mappingMatchValue).toBe('ABC-123');
    expect(result[0].uploadFile.file.size).toBe(0);
  });

  test('status is cleared when real file replaces placeholder (no error status)', () => {
    const csv = [{ fileName: 'a.jpg', matchValue: '1' }];
    const seeded = crossReferenceMappingFiles([], csv);
    expect(seeded[0].status?.reason).toBe('fileMissing');

    const result = crossReferenceMappingFiles(
      [...seeded, mk('a.jpg', 91, '1')],
      csv
    );
    expect(result).toHaveLength(1);
    expect(result[0].status).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// prepareMappingFileSelection – additional edge cases
// ---------------------------------------------------------------------------
describe('prepareMappingFileSelection – edge cases', () => {
  const CSV = [
    { matchValue: 'A', fileName: 'a.jpg' },
    { matchValue: 'B', fileName: 'b.jpg' },
  ];

  const mk = (name: string, size: number, mv?: string) =>
    ({
      uploadFile: {
        file: { name, size, type: size > 0 ? 'image/jpeg' : '' },
        parsedName: mv,
        mappingMatchValue: mv,
        mappingFileName: mv !== undefined ? name : undefined,
      },
      ...(size === 0
        ? { status: { type: 'cancelled' as const, reason: 'fileMissing' as const } }
        : {}),
    }) as PartialUploadableFileSpec;

  test('empty inputs produce only placeholders from CSV', () => {
    const { resolvedFiles, duplicateFiles } = prepareMappingFileSelection(
      [],
      [],
      CSV
    );
    expect(duplicateFiles).toHaveLength(0);
    expect(resolvedFiles).toHaveLength(2);
    expect(resolvedFiles.every((r) => r.status?.reason === 'fileMissing')).toBe(
      true
    );
  });

  test('existing real files not in new selection are preserved', () => {
    const existing = [mk('a.jpg', 91, 'A')];
    const { resolvedFiles } = prepareMappingFileSelection(
      existing,
      [mk('b.jpg', 91, 'B')],
      CSV
    );
    expect(resolvedFiles).toHaveLength(2);
    expect(
      resolvedFiles.find((r) => r.uploadFile.file.name === 'a.jpg')
    ).toBeTruthy();
    expect(
      resolvedFiles.find((r) => r.uploadFile.file.name === 'b.jpg')
    ).toBeTruthy();
  });

  test('existing placeholders are NOT preserved', () => {
    const placeholders = [
      mk('a.jpg', 0, 'A'),
      mk('b.jpg', 0, 'B'),
    ];
    const { resolvedFiles, duplicateFiles } = prepareMappingFileSelection(
      placeholders,
      [mk('a.jpg', 91, 'A')],
      CSV
    );
    expect(duplicateFiles).toHaveLength(0);
    expect(resolvedFiles).toHaveLength(2);
    // a.jpg should now be real (91 bytes), b.jpg should be a placeholder
    const a = resolvedFiles.find((r) => r.uploadFile.file.name === 'a.jpg');
    const b = resolvedFiles.find((r) => r.uploadFile.file.name === 'b.jpg');
    expect(a?.uploadFile.file.size).toBe(91);
    expect(b?.status?.reason).toBe('fileMissing');
  });

  test('duplicate files (same name/size/type) are detected', () => {
    // Create a real File with 91 bytes so it matches the new entry
    const content = new Uint8Array(91);
    const existingFile = new File([content], 'a.jpg', { type: 'image/jpeg' });
    const existing = [
      {
        uploadFile: { file: existingFile, parsedName: 'A', mappingMatchValue: 'A' },
      },
    ] as RA<PartialUploadableFileSpec>;
    const { resolvedFiles, duplicateFiles } = prepareMappingFileSelection(
      existing,
      [mk('a.jpg', 91, 'A')],
      CSV
    );
    expect(duplicateFiles).toHaveLength(1);
    expect(resolvedFiles).toHaveLength(2); // a (existing) + b (placeholder)
  });

  test('files with attachmentId are preserved through selection', () => {
    const existing = [
      {
        ...mk('a.jpg', 91, 'A'),
        attachmentId: 99,
        status: { type: 'success' as const, successType: 'uploaded' as const },
      },
    ] as RA<PartialUploadableFileSpec>;

    const { resolvedFiles } = prepareMappingFileSelection(
      existing,
      [mk('b.jpg', 91, 'B')],
      CSV
    );
    const a = resolvedFiles.find((r) => r.uploadFile.file.name === 'a.jpg');
    expect(a?.attachmentId).toBe(99);
    expect(a?.status?.type).toBe('success');
  });

  test('old rows without mappingMatchValue get it from CSV after selection', () => {
    const savedRows = CSV.map(
      (row) =>
        ({
          uploadFile: {
            file: { name: row.fileName, size: 91, type: 'image/jpeg' },
            parsedName: row.matchValue,
          },
        }) as PartialUploadableFileSpec
    );

    const { resolvedFiles } = prepareMappingFileSelection(
      savedRows,
      [],
      CSV
    );

    for (const r of resolvedFiles) {
      expect(r.uploadFile.mappingMatchValue).toBeTruthy();
      expect(r.uploadFile.parsedName).toBeTruthy();
    }
  });
});
