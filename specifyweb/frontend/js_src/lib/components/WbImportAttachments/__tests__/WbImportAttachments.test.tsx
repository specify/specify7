import React from 'react';
import * as Router from 'react-router-dom';

import { clearIdStore } from '../../../hooks/useId';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { SetMenuContext } from '../../Header/MenuContext';
import { WbImportAttachmentsView } from '..';

requireContext();

beforeEach(() => {
  clearIdStore();
});

// [Import Attachments] Select multiple image files
test('selects multiple image files', async () => {
  const { container, getByRole, user } = mount(
    <Router.MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <SetMenuContext.Provider value={jest.fn()}>
        <WbImportAttachmentsView />
      </SetMenuContext.Provider>
    </Router.MemoryRouter>
  );

  const input = container.querySelector<HTMLInputElement>('input[type="file"]');

  if (input === null) {
    throw new Error('Unable to find the attachment file picker');
  }

  const files = [
    new File(['png image'], 'first-image.png', {
      type: 'image/png',
    }),
    new File(['webp image'], 'second-image.webp', {
      type: 'image/webp',
    }),
  ];

  expect(input).toHaveAttribute('multiple');

  await user.upload(input, files);

  expect(getByRole('cell', { name: 'first-image.png' })).toBeInTheDocument();

  expect(getByRole('cell', { name: 'second-image.webp' })).toBeInTheDocument();
});

// [Import Attachments] Select different image file types
test('selects different image file types', async () => {
  const { container, getByRole, user } = mount(
    <Router.MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <SetMenuContext.Provider value={jest.fn()}>
        <WbImportAttachmentsView />
      </SetMenuContext.Provider>
    </Router.MemoryRouter>
  );

  const input = container.querySelector<HTMLInputElement>('input[type="file"]');

  if (input === null) {
    throw new Error('Unable to find the attachment file picker');
  }

  const files = [
    new File(['png image'], 'image.png', {
      type: 'image/png',
    }),
    new File(['webp image'], 'image.webp', {
      type: 'image/webp',
    }),
    new File(['tiff image'], 'image.tiff', {
      type: 'image/tiff',
    }),
    new File(['jpeg image'], 'image.jpeg', {
      type: 'image/jpeg',
    }),
    new File(['gif image'], 'image.gif', {
      type: 'image/gif',
    }),
  ];

  expect(input).not.toHaveAttribute('accept');

  await user.upload(input, files);

  for (const file of files) {
    expect(getByRole('cell', { name: file.name })).toBeInTheDocument();
  }
});
