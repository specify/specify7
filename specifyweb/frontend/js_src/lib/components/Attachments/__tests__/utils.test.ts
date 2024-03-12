import { requireContext } from '../../../tests/helpers';
import { strictGetTable } from '../../DataModel/tables';
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

test.each([
  [() => strictGetTable('DNASequence'), 'attachments'],
  [() => strictGetTable('FieldNotebook'), 'attachments'],
  [() => strictGetTable('CollectionObject'), 'collectionObjectAttachments'],
  [() => strictGetTable('Attachment'), undefined],
  [() => strictGetTable('AttachmentMetadata'), undefined],
  [() => strictGetTable('CollectingEventAttachment'), undefined],
  [() => strictGetTable('Author'), undefined],
])('getAttachmentRelationship', (getSpecifyModel, relationshipName) =>
  expect(getAttachmentRelationship(getSpecifyModel())?.name).toEqual(
    relationshipName
  )
);
