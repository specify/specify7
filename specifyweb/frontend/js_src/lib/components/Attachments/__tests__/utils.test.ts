import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import { schema } from '../../DataModel/schema';
import type { SpecifyModel } from '../../DataModel/specifyModel';
import {
  allTablesWithAttachments,
  attachmentRelatedTables,
  getAttachmentRelationship,
} from '../utils';

requireContext();

test('attachmentRelatedTables', () =>
  expect(attachmentRelatedTables()).toMatchSnapshot());

test('allTablesWithAttachments', () =>
  expect(allTablesWithAttachments()).toMatchSnapshot());

test('getAttachmentRelationship', () => {
  const cases: RA<readonly [SpecifyModel, string | undefined]> = [
    [schema.models.DNASequence, 'attachments'],
    [schema.models.FieldNotebook, 'attachments'],
    [schema.models.CollectionObject, 'collectionObjectAttachments'],
    [schema.models.Attachment, undefined],
    [schema.models.AttachmentMetadata, undefined],
    [schema.models.CollectingEventAttachment, undefined],
    [schema.models.Author, undefined],
  ];
  cases.forEach(([table, relationshipName]) =>
    expect(getAttachmentRelationship(table)?.name).toBe(relationshipName)
  );
});
