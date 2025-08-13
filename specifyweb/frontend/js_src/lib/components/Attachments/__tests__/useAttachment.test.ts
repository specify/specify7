import { renderHook, waitFor } from '@testing-library/react';

import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import type { AnySchema } from '../../DataModel/helperTypes';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import { getResourceApiUrl } from '../../DataModel/resource';
import { tables } from '../../DataModel/tables';
import { useAttachment } from '../Plugin';

requireContext();

describe('useAttachment', () => {
  test('resource is undefined', async () => {
    const { result } = renderHook(() => useAttachment(undefined));

    await waitFor(() => {
      // [0] = upload fn, [1] = resource
      expect(result.current[1]).toBe(false);
    });
  });

  test('resource is Attachment', async () => {
    const attachment = new tables.Attachment.Resource({
      id: 10,
      attachmentlocation: 'testLocation',
    });

    const { result } = renderHook(() => useAttachment(attachment));

    await waitFor(() => {
      expect(result.current[1]).toBe(attachment);
    });
  });

  const collectionObjectAttachmentId = 9;
  const attachmentId = 10;
  const collectionObjectId = 3;

  const collectionObjectAttachment = {
    id: collectionObjectAttachmentId,
    attachment: {
      id: attachmentId,
      resource_uri: getResourceApiUrl('Attachment', attachmentId),
      attachmentlocation: 'testLocation',
      _tableName: 'Attachment',
    },
    collectionobject: getResourceApiUrl('CollectionObject', collectionObjectId),
    _tableName: 'CollectionObjectAttachment',
  };

  overrideAjax(
    getResourceApiUrl(
      'CollectionObjectAttachment',
      collectionObjectAttachmentId
    ),
    collectionObjectAttachment
  );

  test('resource is Collection Object Attachment', async () => {
    const collectionObjectAttachmentRes =
      new tables.CollectionObjectAttachment.Resource({
        id: collectionObjectAttachmentId,
      });

    const { result } = renderHook(() =>
      useAttachment(collectionObjectAttachmentRes)
    );

    await waitFor(() => {
      const resource = result.current[1] as SpecifyResource<AnySchema>;
      expect(typeof resource).toBe('object');
      expect(resource.specifyTable.name).toBe('Attachment');
    });
  });
});
