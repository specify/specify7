import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import { clearIdStore } from '../../../hooks/useId';
import { overrideAjax } from '../../../tests/ajax';
import attachmentSettings from '../../../tests/ajax/static/context/attachment_settings.json';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { f } from '../../../utils/functools';
import { LoadingContext } from '../../Core/Contexts';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import { deserializeResource } from '../../DataModel/serializers';
import type { Attachment } from '../../DataModel/types';
import { overrideAttachmentSettings } from '../attachments';
import * as Attachments from '../attachments';
import { UploadAttachment } from '../Plugin';
import { testAttachment } from './utils';

requireContext();

async function uploadFileMock(): Promise<SpecifyResource<Attachment>> {
  return deserializeResource(testAttachment);
}

beforeEach(() => {
  clearIdStore();
});

describe('UploadAttachment', () => {
  const testToken = 'testToken';
  const testAttachmentLocation = 'testLocation';

  overrideAjax(
    `/attachment_gw/get_upload_params/`,
    [{ token: testToken, attachmentLocation: testAttachmentLocation }],
    { method: 'POST' }
  );

  test('simple render', async () => {
    jest.spyOn(Attachments, 'uploadFile').mockImplementation(uploadFileMock);
    jest.spyOn(console, 'warn').mockImplementation();
    const handleUploaded = jest.fn();

    overrideAttachmentSettings(attachmentSettings);
    const { container, getByRole, user } = mount(
      <LoadingContext.Provider value={f.void}>
        <UploadAttachment
          attachmentServerAvailable
          onUploaded={handleUploaded}
        />
      </LoadingContext.Provider>
    );
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
    expect(
      getByRole('textbox', { name: 'External resource URL' })
    ).toBeInTheDocument();

    const input = Array.from(container.getElementsByTagName('input'))[0];
    const testFile = new File(['Some Text Contents'], 'testName', {
      type: 'text/plain',
    });

    await user.upload(input, testFile);
    fireEvent.change(input, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(handleUploaded).toHaveBeenCalled();
    });
  });

  test('creates external URL attachments without the asset server', async () => {
    const handleUploaded = jest.fn();
    const { getByRole, user } = mount(
      <LoadingContext.Provider value={f.void}>
        <UploadAttachment
          attachmentServerAvailable={false}
          onUploaded={handleUploaded}
        />
      </LoadingContext.Provider>
    );

    await user.type(
      getByRole('textbox', { name: 'External resource URL' }),
      'https://example.org/specimen/123'
    );
    await user.click(getByRole('button', { name: 'Add external URL' }));

    expect(handleUploaded).toHaveBeenCalledTimes(1);
    const [attachment] = handleUploaded.mock.calls[0];
    expect(attachment.get('resourceURL')).toBe(
      'https://example.org/specimen/123'
    );
    expect(attachment.get('origFilename')).toBe(
      'https://example.org/specimen/123'
    );
  });

  test('rejects non-HTTP external URLs', async () => {
    const handleUploaded = jest.fn();
    const { getByRole, user } = mount(
      <LoadingContext.Provider value={f.void}>
        <UploadAttachment
          attachmentServerAvailable={false}
          onUploaded={handleUploaded}
        />
      </LoadingContext.Provider>
    );

    await user.type(
      getByRole('textbox', { name: 'External resource URL' }),
      'javascript:alert(1)'
    );
    await user.click(getByRole('button', { name: 'Add external URL' }));

    expect(handleUploaded).not.toHaveBeenCalled();
    expect(getByRole('alert')).toHaveTextContent(
      'Enter a valid HTTP or HTTPS URL.'
    );
  });

  test('rejects normalized URLs that exceed the field limit', async () => {
    const handleUploaded = jest.fn();
    const { getByRole, user } = mount(
      <LoadingContext.Provider value={f.void}>
        <UploadAttachment
          attachmentServerAvailable={false}
          onUploaded={handleUploaded}
        />
      </LoadingContext.Provider>
    );

    const input = `https://example.org/${'a '.repeat(502)}`;
    const urlInput = getByRole('textbox', { name: 'External resource URL' });
    fireEvent.change(urlInput, { target: { value: input } });
    await user.click(getByRole('button', { name: 'Add external URL' }));

    expect(handleUploaded).not.toHaveBeenCalled();
    expect(getByRole('alert')).toHaveTextContent(
      'URL must be 1,024 characters or fewer.'
    );
  });
});
