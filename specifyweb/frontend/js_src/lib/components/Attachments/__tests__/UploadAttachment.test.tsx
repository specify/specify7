import React from 'react';
import { mount } from '../../../tests/reactUtils';
import { UploadAttachment } from '../Plugin';
import { clearIdStore } from '../../../hooks/useId';
import { LoadingContext } from '../../Core/Contexts';
import { f } from '../../../utils/functools';
import { fireEvent, waitFor } from '@testing-library/react';
import { overrideAttachmentSettings } from '../attachments';
import attachmentSettings from '../../../tests/ajax/static/context/attachment_settings.json';
import { overrideAjax } from '../../../tests/ajax';
import * as Attachments from '../attachments';
import { requireContext } from '../../../tests/helpers';
import { deserializeResource } from '../../DataModel/serializers';
import { testAttachment } from './utils';
import { SpecifyResource } from '../../DataModel/legacyTypes';
import { Attachment } from '../../DataModel/types';

requireContext();

async function uploadFileMock() {
  return deserializeResource(testAttachment) as SpecifyResource<Attachment>;
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
    const { asFragment, container, user } = mount(
      <LoadingContext.Provider value={f.void}>
        <UploadAttachment onUploaded={handleUploaded} />
      </LoadingContext.Provider>
    );
    expect(asFragment()).toMatchSnapshot();

    const input = Array.from(container.getElementsByTagName('input'))[0];
    const testFile = new File(['Some Text Contents'], 'testName', {
      type: 'text/plain',
    });

    await user.upload(input, testFile);
    fireEvent.change(input, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(handleUploaded).toBeCalled();
    });
  });
});