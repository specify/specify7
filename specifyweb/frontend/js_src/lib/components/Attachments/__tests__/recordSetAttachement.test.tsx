import { screen } from '@testing-library/react';
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
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const mockRecord = {
      specifyTable: {
        name: 'TestTable',
      },
      populated: true,
      rgetCollection: jest.fn().mockResolvedValue({
        models: [],
      }),
    } as any;

    const { user } = mount(
      <LoadingContext.Provider value={f.void}>
        <RecordSetAttachments
          name="Test Record Set"
          recordCount={1}
          recordSetId={1}
          records={[mockRecord]}
          onFetch={undefined}
        />
      </LoadingContext.Provider>
    );

    // Open attachments dialog
    const galleryButton = screen.getByRole('button', {
      name: /attachments/i,
    });

    await user.click(galleryButton);

    // Assert dialog opens and Download All appears (but disabled)
    const downloadAllButton = await screen.findByRole('button', {
      name: /download all/i,
    });

    expect(downloadAllButton).toBeDisabled();
  });
});