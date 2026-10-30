import { requireContext } from '../../../tests/helpers';
import { strictGetTable } from '../../DataModel/tables';
import { staticAttachmentImportPaths } from '../importPaths';

requireContext();

const expectedPaths = [
  'collectionObjectCatalogNumber',
  'collectionObjectAltCatalogNumber',
  'taxonFullName',
  'storageFullName',
  'collectingEventGuid',
  'collectingEventFieldnumber',
  'loanNumber',
  'accessionNumber',
  'giftNumber',
  'preparationBarcode',
  'preparationGUID',
  'borrowInvoiceNumber',
  'treatmentEventFieldNumber',
  'exchangeInAttachment',
  'exchangeOutAttachment',
  'referenceWorkGUID',
  'referenceWorkTitle',
  'localityUniqueIdentifier',
  'localityGUID',
  'permitNumber',
  'agentGUID',
  'collectingTripName',
  'deaccessionNumber',
] as const;

describe('staticAttachmentImportPaths', () => {
  test('every configured path resolves to a real table field', () => {
    const invalid = Object.entries(staticAttachmentImportPaths).filter(
      ([, { baseTable, path }]) => {
        try {
          strictGetTable(baseTable).strictGetField(path);
          return false;
        } catch {
          return true;
        }
      }
    );

    expect(invalid).toEqual([]);
  });

  test('contains every expected path', () => {
    expect(Object.keys(staticAttachmentImportPaths)).toEqual(
      expect.arrayContaining([...expectedPaths])
    );
  });
});
