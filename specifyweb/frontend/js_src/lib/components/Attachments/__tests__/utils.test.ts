import { requireContext } from '../../../tests/helpers';
import { strictGetModel } from '../../DataModel/schema';
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
  [() => strictGetModel('DNASequence'), 'attachments'],
  [() => strictGetModel('FieldNotebook'), 'attachments'],
  [() => strictGetModel('CollectionObject'), 'collectionObjectAttachments'],
  [() => strictGetModel('Attachment'), undefined],
  [() => strictGetModel('AttachmentMetadata'), undefined],
  [() => strictGetModel('CollectingEventAttachment'), undefined],
  [() => strictGetModel('Author'), undefined],
])('getAttachmentRelationship', (getSpecifyModel, relationshipName) =>
  expect(getAttachmentRelationship(getSpecifyModel())?.name).toEqual(
    relationshipName
  )
);
