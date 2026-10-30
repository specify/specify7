import { within } from '@testing-library/react';
import React from 'react';

import { attachmentsText } from '../../../localization/attachments';
import { commonText } from '../../../localization/common';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { Http } from '../../../utils/ajax/definitions';
import {
  attachmentSettingsPromise,
  overrideAttachmentServerStatus,
} from '../../Attachments/attachments';
import * as attachments from '../../Attachments/attachments';
import type { Collection } from '../../DataModel/specifyTable';
import { tables } from '../../DataModel/tables';
import type { CollectionObjectAttachment } from '../../DataModel/types';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { AttachmentsCollection } from '../AttachmentsCollection';

requireContext();
overrideAjax('/attachment_gw/health/', '', { responseCode: Http.NO_CONTENT });

function recordAttachments(id: number, filenames: readonly string[]) {
  const record = new tables.CollectionObject.Resource({ id });
  return new tables.CollectionObjectAttachment.DependentCollection(
    {
      related: record,
      field:
        tables.CollectionObjectAttachment.strictGetRelationship(
          'collectionObject'
        ),
    },
    filenames.map((filename, ordinal) => {
      const join = new tables.CollectionObjectAttachment.Resource({ ordinal });
      join.set(
        'attachment',
        new tables.Attachment.Resource({
          attachmentLocation: filename,
          origFilename: filename,
          title: filename,
          mimeType: 'image/jpeg',
        })
      );
      return join;
    })
  ) as Collection<CollectionObjectAttachment>;
}

beforeEach(async () => {
  await attachmentSettingsPromise;
  overrideAttachmentServerStatus('available');
  // Keep the real gallery and cells; only replace external asset retrieval.
  jest
    .spyOn(attachments, 'fetchThumbnail')
    .mockImplementation(async (attachment) => ({
      src: `/test-assets/${attachment.origFilename}`,
      alt: attachment.origFilename ?? '',
      width: 100,
      height: 100,
    }));
  jest.spyOn(attachments, 'fetchOriginalUrl').mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('opens the CO gallery with all its attachments and excludes another CO', async () => {
  const selected = recordAttachments(101, ['first.jpg', 'second.jpg']);
  const other = recordAttachments(102, ['unrelated.jpg']);
  const { getAllByRole, queryByRole, findByRole, user } = mount(
    <UnloadProtectsContext.Provider value={[]}>
      <AttachmentsCollection collection={selected} />
      <AttachmentsCollection collection={other} />
    </UnloadProtectsContext.Provider>
  );

  expect(queryByRole('dialog')).not.toBeInTheDocument();
  await user.click(
    getAllByRole('button', { name: attachmentsText.attachments() })[0]
  );

  const dialog = await findByRole('dialog');
  const gallery = within(dialog);
  await gallery.findByRole('img', { name: 'first.jpg' });
  await gallery.findByRole('img', { name: 'second.jpg' });
  expect(gallery.getAllByRole('img')).toHaveLength(2);
  expect(
    gallery.queryByRole('img', { name: 'unrelated.jpg' })
  ).not.toBeInTheDocument();

  await user.click(gallery.getByRole('button', { name: commonText.close() }));
  expect(queryByRole('dialog')).not.toBeInTheDocument();

  await user.click(
    getAllByRole('button', { name: attachmentsText.attachments() })[1]
  );
  const otherGallery = within(await findByRole('dialog'));
  await otherGallery.findByRole('img', { name: 'unrelated.jpg' });
  expect(otherGallery.getAllByRole('img')).toHaveLength(1);
  expect(
    otherGallery.queryByRole('img', { name: 'first.jpg' })
  ).not.toBeInTheDocument();
});
