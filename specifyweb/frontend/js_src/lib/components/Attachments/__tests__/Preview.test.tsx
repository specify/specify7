import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import { overrideAjax } from '../../../tests/ajax';
import attachmentSettings from '../../../tests/ajax/static/context/attachment_settings.json';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { Http } from '../../../utils/ajax/definitions';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import {
  attachmentSettingsPromise,
  fetchThumbnail,
  overrideAttachmentServerStatus,
  overrideAttachmentSettings,
} from '../attachments';
import { Thumbnail } from '../Preview';

requireContext();

const healthCheckUrl = '/attachment_gw/health/';
const rootRelativeReadUrl = '/mockAssetServer/fileget';
const healthResponse = jest.fn(() => '');
let consoleError: jest.SpiedFunction<typeof console.error>;

overrideAjax(healthCheckUrl, healthResponse, {
  responseCode: Http.SERVER_ERROR,
});

beforeEach(async () => {
  await attachmentSettingsPromise;
  healthResponse.mockClear();
  consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  overrideAttachmentServerStatus('available');
  overrideAttachmentSettings({
    ...attachmentSettings,
    read: rootRelativeReadUrl,
  });
});

afterEach(() => {
  overrideAttachmentSettings(undefined);
  consoleError.mockRestore();
});

describe('Thumbnail', () => {
  test('reports failed root-relative asset server thumbnails', async () => {
    const attachment = new tables.Attachment.Resource({
      attachmentlocation: 'testLocation',
      mimetype: 'image/jpeg',
      origfilename: 'testFile.jpg',
      title: 'testFile.jpg',
      isPublic: true,
    });
    const thumbnail = await fetchThumbnail(serializeResource(attachment), 78);

    expect(thumbnail?.src.startsWith(rootRelativeReadUrl)).toBe(true);

    const { getByRole } = mount(
      <Thumbnail
        attachment={serializeResource(attachment)}
        thumbnail={thumbnail}
      />
    );

    fireEvent.error(getByRole('img'));

    await waitFor(() => expect(healthResponse).toHaveBeenCalledTimes(1));
    expect(consoleError).toHaveBeenCalledTimes(1);
  });
});
