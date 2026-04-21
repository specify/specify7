import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import { getResourceApiUrl } from '../../DataModel/resource';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import { fetchAttachmentParent } from '../Cell';

requireContext();

describe('fetchAttachmentParent', () => {
  const makeBackendResponse = (
    objects: RA<unknown>,
    offset: number,
    total_count: number,
    limit = 20
  ) => ({
    objects,
    meta: {
      limit,
      offset,
      total_count,
    },
  });

  const collectionObjectAttachmentId = 5;
  const collectionObjectId = 1;
  const attachmentId = 7;

  overrideAjax(
    `/api/specify/collectionobjectattachment/?limit=20&attachment=${attachmentId}`,
    makeBackendResponse(
      [
        {
          id: collectionObjectAttachmentId,
          attachment: {
            id: attachmentId,
            resource_uri: getResourceApiUrl('Attachment', attachmentId),
            _tableName: 'Attachment',
          },
          _tableName: 'CollectionObjectAttachment',
        },
      ],
      0,
      1
    )
  );

  test('fetches related parent correctly', async () => {
    const collectionObject = new tables.CollectionObject.Resource({
      id: collectionObjectId,
    });

    const attachment = new tables.Attachment.Resource({
      id: attachmentId,
    });

    const collectionObjectAttachment =
      new tables.CollectionObjectAttachment.Resource({
        id: collectionObjectAttachmentId,
        collectionObject: getResourceApiUrl(
          'CollectionObject',
          collectionObject.id
        ),
      });

    collectionObjectAttachment.set('attachment', attachment);

    const parent = await fetchAttachmentParent(
      tables.CollectionObject,
      serializeResource(attachment)
    );

    expect(parent?.specifyTable.name).toBe('CollectionObjectAttachment');
    expect(parent?.id).toBe(collectionObjectAttachmentId);
  });
});
