import { waitFor } from '@testing-library/react';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';

import { mount } from '../../../tests/reactUtils';
import { LoadingContext } from '../../Core/Contexts';
import { requireContext } from '../../../tests/helpers';
import * as Datasets from '../Datasets';
import { ImportFromMappingFile } from '../ImportFromMappingFile';

requireContext();

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

type FileType = 'text/csv' | 'image/jpeg' | 'image/png' | 'text/plain';

const fixturesRoot = path.join(
  __dirname,
  '../../../tests/fixtures/attachmentsImport'
);

function fixtureFile(name: string): File {
  const fileBuffer = fs.readFileSync(path.join(fixturesRoot, name));
  const type: FileType = name.endsWith('.png')
    ? 'image/png'
    : name.endsWith('.jpg') || name.endsWith('.jpeg')
    ? 'image/jpeg'
    : name.endsWith('.csv')
    ? 'text/csv'
    : 'text/plain';

  return new File([fileBuffer], name, { type });
}

describe('ImportFromMappingFile', () => {
  beforeEach(() => {
    const portalRoot = document.createElement('div');
    portalRoot.id = 'portal-root';
    document.body.appendChild(portalRoot);

    mockNavigate.mockClear();
    jest
      .spyOn(Datasets, 'createEmptyAttachmentDataset')
      .mockResolvedValue({ id: 123 } as any);
  });

  afterEach(() => {
    const portalRoot = document.getElementById('portal-root');
    if (portalRoot !== null) portalRoot.remove();
    jest.restoreAllMocks();
  });

  test('creates attachment dataset from a valid CSV mapping file', async () => {
    const { container, user } = mount(
      <LoadingContext.Provider value={(promise) => promise as Promise<unknown>}>
        <ImportFromMappingFile />
      </LoadingContext.Provider>
    );

    const fileInput = container.querySelector('input[type=file]');
    expect(fileInput).toBeTruthy();

    const mappingFile = fixtureFile('mapping-file-valid.csv');
    await user.upload(fileInput!, mappingFile);

    const importButton = container.getElementsByTagName('button')[0];
    expect(importButton).toBeTruthy();

    await waitFor(() => expect(importButton).not.toBeDisabled());
    await user.click(importButton!);

    await waitFor(() => {
      expect(Datasets.createEmptyAttachmentDataset).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          expect.objectContaining({
            uploadFile: expect.objectContaining({
              file: expect.objectContaining({ name: 'fake-image-1.jpg' }),
              parsedName: 'ID_001',
            }),
          }),
          expect.objectContaining({
            uploadFile: expect.objectContaining({
              file: expect.objectContaining({ name: 'fake-image-2.png' }),
              parsedName: 'ID_002',
            }),
          }),
        ])
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith('/specify/attachments/import/123');
  });

  test('parses pipe-delimited CSV mapping files with trimmed fields', async () => {
    const { container, user } = mount(
      <LoadingContext.Provider value={(promise) => promise as Promise<unknown>}>
        <ImportFromMappingFile />
      </LoadingContext.Provider>
    );

    const fileInput = container.querySelector('input[type=file]');
    expect(fileInput).toBeTruthy();

    const mappingFile = fixtureFile('mapping-file-pipe-delimited.csv');
    await user.upload(fileInput!, mappingFile);

    const importButton = container.getElementsByTagName('button')[0];
    expect(importButton).toBeTruthy();

    await waitFor(() => expect(importButton).not.toBeDisabled());
    await user.click(importButton!);

    await waitFor(() => {
      expect(Datasets.createEmptyAttachmentDataset).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          expect.objectContaining({
            uploadFile: expect.objectContaining({
              file: expect.objectContaining({ name: 'fake-image-3.jpg' }),
              parsedName: 'ID_003',
            }),
          }),
          expect.objectContaining({
            uploadFile: expect.objectContaining({
              file: expect.objectContaining({ name: 'fake-image-4.png' }),
              parsedName: 'ID_004',
            }),
          }),
        ])
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith('/specify/attachments/import/123');
  });

  test('fixture image files are readable and expose correct file metadata', () => {
    const jpegFile = fixtureFile('fake-image-1.jpg');
    const pngFile = fixtureFile('fake-image-2.png');

    expect(jpegFile.name).toBe('fake-image-1.jpg');
    expect(jpegFile.type).toBe('image/jpeg');
    expect(jpegFile.size).toBeGreaterThan(0);

    expect(pngFile.name).toBe('fake-image-2.png');
    expect(pngFile.type).toBe('image/png');
    expect(pngFile.size).toBeGreaterThan(0);
  });
});
