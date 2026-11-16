import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { getResourceApiUrl } from '../../DataModel/resource';
import { tables } from '../../DataModel/tables';
import { getAuditRecordFormatter } from '../AuditLogFormatter';
import { QueryFieldSpec } from '../fieldSpec';

jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasTablePermission: () => true,
}));

requireContext();

overrideAjax(
  getResourceApiUrl('CollectionObject', 123),
  () =>
    addMissingFields('CollectionObject', {
      id: 123,
      catalogNumber: '123',
    }) as never
);

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
    123,
    null,
  ]);

  expect(result[2]).toBe(
    tables.CollectionObject.strictGetField('catalogNumber')!.label
  );
  expect(result[3]).toMatchObject({
    props: {
      href: new tables.CollectionObject.Resource({ id: 123 }).viewUrl(),
    },
  });
  expect(result[4]).toBe('');
});
