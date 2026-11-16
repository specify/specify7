import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import { getAuditRecordFormatter } from '../AuditLogFormatter';
import { QueryFieldSpec } from '../fieldSpec';

requireContext();

// [QueryBuilder] Format audit log field names
test('formats audit log field names', async () => {
  const fieldSpecs = [
    QueryFieldSpec.fromPath('SpAuditLog', ['tableNum']),
    QueryFieldSpec.fromPath('SpAuditLog', ['parentTableNum']),
    QueryFieldSpec.fromPath('SpAuditLogField', ['fieldName']),
    QueryFieldSpec.fromPath('SpAuditLog', ['recordId']),
    QueryFieldSpec.fromPath('SpAuditLog', ['parentRecordId']),
  ];
  const formatter = getAuditRecordFormatter(fieldSpecs);
  expect(formatter).toBeDefined();

  const result = await formatter!([
    999,
    tables.CollectionObject.tableId,
    tables.CollectionObject.tableId,
    'catalogNumber',
    null,
    null,
  ]);

  expect(result[2]).toBe(
    tables.CollectionObject.strictGetField('catalogNumber')!.label
  );
  expect(result[3]).toBe('');
  expect(result[4]).toBe('');
});
