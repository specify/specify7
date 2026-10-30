import { requireContext } from '../../../tests/helpers';
import { generateUploadSpec } from '../SelectUploadPath';

requireContext();

describe('generateUploadSpec catalog number result formatting', () => {
  test('preserves catalog numbers that do not match the schema formatter', () =>
    expect(
      generateUploadSpec('collectionObjectCatalogNumber').formatQueryResults!(
        'F-250750'
      )
    ).toBe('F-250750'));

  test('keeps canonical formatting for values accepted by the schema formatter', () =>
    expect(
      generateUploadSpec('collectionObjectCatalogNumber').formatQueryResults!(
        '123'
      )
    ).toBe('000000123'));
});
