import {
  parseCatalogNumberEntries,
  parseCatalogNumberRanges,
  tokenizeCatalogEntry,
} from '../parseCatalogNumbers';

describe('parseCatalogNumberEntries', () => {
  test('trims lines and removes empty lines', () => {
    expect(parseCatalogNumberEntries('\n  0001 \n\n0002\n')).toEqual([
      '0001',
      '0002',
    ]);
  });
});

describe('tokenizeCatalogEntry', () => {
  test('treats non-numeric characters as delimiters except dash', () => {
    expect(tokenizeCatalogEntry('SEMC000271806,SEMC000687972;000601108')).toEqual(
      [271_806, 687_972, 601_108]
    );
  });

  test('retains dash as a range token', () => {
    expect(tokenizeCatalogEntry('0001 - 0150')).toEqual([1, '-', 150]);
  });
});

describe('parseCatalogNumberRanges', () => {
  test('parses single catalog numbers split by non-numeric delimiters', () => {
    expect(
      parseCatalogNumberRanges([
        'SEMC000271806 SEMC000687972 SEMC000601108',
      ])
    ).toEqual([
      [271_806, 271_806],
      [687_972, 687_972],
      [601_108, 601_108],
    ]);
  });

  test('parses ranges and normalizes reversed ranges', () => {
    expect(parseCatalogNumberRanges(['0001 - 0150', '0150-0001'])).toEqual([
      [1, 150],
      [1, 150],
    ]);
  });
});
