import { screen, waitFor } from '@testing-library/react';
import React from 'react';

import { clearIdStore } from '../../../hooks/useId';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { f } from '../../../utils/functools';
import { LoadingContext } from '../../Core/Contexts';
import { RecordSetAttachments } from '../RecordSetAttachment';

requireContext();

beforeEach(() => {
  clearIdStore();
});

describe('RecordSetAttachments', () => {
  test('Download All button is disabled when there are no attachments', async () => {
    jest.spyOn(console, 'warn').mockImplementation();

    const { user } = mount(
      <LoadingContext.Provider value={f.void}>
        <RecordSetAttachments
          name="Test Record Set"
          recordCount={0}
          recordSetId={1}
          records={[]}
          onFetch={undefined}
        />
      </LoadingContext.Provider>
    );

    // Open the attachments dialog
    const galleryButton = screen.getByTitle('attachments');
    await user.click(galleryButton);

    // Wait for the dialog to render with the Download All button
    await waitFor(() => {
      expect(
        screen.getByText('Download All', { exact: false })
      ).toBeInTheDocument();
    });

    // The Download All button should be disabled when there are no attachments
    const downloadAllButton = screen.getByText('Download All', {
      exact: false,
    }).closest('button')!;
    expect(downloadAllButton).toBeDisabled();
  });
});
