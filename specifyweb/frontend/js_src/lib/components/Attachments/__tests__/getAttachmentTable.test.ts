import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import { getAttachmentTable } from '../Cell';

requireContext();

describe('getAttachmentTable', () => {
  test('attachment table', () => {
    expect(getAttachmentTable(tables.Accession.tableId)).toBe(tables.Accession);
  });

  test('non-attachment table', () => {
    expect(getAttachmentTable(tables.Division.tableId)).toBeUndefined();
  });
});
