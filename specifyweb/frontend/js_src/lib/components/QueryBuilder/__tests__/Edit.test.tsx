import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { queryText } from '../../../localization/query';
import { requireContext } from '../../../tests/helpers';
import { LoadingContext } from '../../Core/Contexts';
import { addMissingFields } from '../../DataModel/addMissingFields';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import type { SpQuery } from '../../DataModel/types';
import { ResourceView } from '../../Forms/ResourceView';
import { userInformation } from '../../InitialContext/userInformation';
import { QueryEditButton } from '../Edit';
import { useQueryRefresh } from '../useQueryRefresh';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';

requireContext();

jest.mock('../../Forms/ResourceView', () => ({
  ResourceView: jest.fn(({ children, onClose }) => (
    <>
      <button type="button" onClick={onClose}>
        Close editor
      </button>
      {children}
    </>
  )),
}));
jest.mock('../Share', () => ({
  QuerySharingActions: ({
    onVersionChange,
  }: {
    readonly onVersionChange: (version: number) => void;
  }) => (
    <button type="button" onClick={() => onVersionChange(7)}>
      Update sharing
    </button>
  ),
}));

afterEach(() => jest.restoreAllMocks());

test('discards name and remarks edits on close without reverting other changes', () => {
  const resource = new tables.SpQuery.Resource<SpQuery>(
    addMissingFields('SpQuery', {
      id: 100,
      version: 1,
      name: 'Original name',
      remarks: 'Original remarks',
      isFavorite: false,
      contextTableId: tables.CollectionObject.tableId,
      specifyUser: userInformation.resource_uri,
      fields: [],
    })
  );
  render(
    <UnloadProtectsContext.Provider value={[]}>
      <QueryEditButton queryResource={resource} onRefresh={jest.fn()} />
    </UnloadProtectsContext.Provider>
  );

  fireEvent.click(screen.getByRole('button', { name: commonText.edit() }));
  resource.set('name', 'Discarded name');
  resource.set('remarks', 'Discarded remarks');
  resource.set('isFavorite', true);
  fireEvent.click(screen.getByRole('button', { name: 'Close editor' }));

  expect(resource.get('name')).toBe('Original name');
  expect(resource.get('remarks')).toBe('Original remarks');
  expect(resource.get('isFavorite')).toBe(true);
});

function Editor({
  resource,
  onRefreshed,
}: {
  readonly resource: SpecifyResource<SpQuery>;
  readonly onRefreshed: () => void;
}): JSX.Element {
  const { refreshQuery, conflictDialog } = useQueryRefresh(
    resource,
    undefined,
    onRefreshed
  );
  return (
    <>
      <QueryEditButton queryResource={resource} onRefresh={refreshQuery} />
      {conflictDialog}
    </>
  );
}

test.each([true, false])(
  'reloads the definition before adopting the sharing version (success: %s)',
  async (success) => {
    const original = new tables.SpQuery.Resource<SpQuery>(
      addMissingFields('SpQuery', {
        id: 100,
        name: 'Original definition',
        version: 1,
        contextTableId: tables.CollectionObject.tableId,
        specifyUser: userInformation.resource_uri,
        fields: [
          addMissingFields('SpQueryField', {
            id: 101,
            stringId: '1.collectionobject.catalognumber',
            tableList: '1',
            fieldName: 'CatalogNumber',
            position: 0,
            operStart: 1,
            startValue: 'Original filter',
          }),
        ],
      })
    );
    const current = new tables.SpQuery.Resource<SpQuery>(
      addMissingFields('SpQuery', {
        ...serializeResource(original),
        name: 'Current definition',
        version: 8,
        fields: [
          addMissingFields('SpQueryField', {
            id: 101,
            stringId: '1.collectionobject.catalognumber',
            tableList: '1',
            fieldName: 'CatalogNumber',
            position: 0,
            operStart: 1,
            startValue: 'Current filter',
          }),
        ],
      })
    );
    let resolveReload!: (query: SpecifyResource<SpQuery>) => void;
    let rejectReload!: (error: Error) => void;
    const reload = new Promise<SpecifyResource<SpQuery>>((resolve, reject) => {
      resolveReload = resolve;
      rejectReload = reject;
    });
    const fetch = jest
      .spyOn(tables.SpQuery.Resource.prototype, 'fetch')
      .mockReturnValue(reload);
    const pending: Promise<unknown>[] = [];
    const refreshed = jest.fn();
    render(
      <LoadingContext.Provider
        value={(promise): void => {
          pending.push(promise);
          void promise.catch(() => undefined);
        }}
      >
        <UnloadProtectsContext.Provider value={[]}>
          <Editor resource={original} onRefreshed={refreshed} />
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: commonText.edit() }));
    const resource = jest.mocked(ResourceView).mock.calls.at(-1)![0]
      .resource as SpecifyResource<SpQuery>;
    fireEvent.click(screen.getByRole('button', { name: 'Update sharing' }));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.instances[0]).not.toBe(resource);
    expect(resource.get('version')).toBe(1);
    expect(resource.get('name')).toBe('Original definition');
    expect(resource).toBe(original);
    original.set('remarks', 'Unsaved local remarks');

    await act(async () => {
      if (success) {
        resolveReload(current);
        await pending[0];
      } else {
        rejectReload(new Error('Reload failed'));
        await expect(pending[0]).rejects.toThrow('Reload failed');
      }
    });
    expect(resource.get('version')).toBe(success ? 8 : 1);
    expect(resource.get('remarks')).toBe('Unsaved local remarks');
    expect(refreshed).toHaveBeenCalledTimes(success ? 1 : 0);
    expect(resource.get('name')).toBe(
      success ? 'Current definition' : 'Original definition'
    );
    expect(serializeResource(resource).fields[0].startValue).toBe(
      success ? 'Current filter' : 'Original filter'
    );
  }
);

test.each(['local', 'server', 'cancel'] as const)(
  'keeps the old version until overlapping edits are resolved (%s)',
  async (choice) => {
    const original = new tables.SpQuery.Resource<SpQuery>(
      addMissingFields('SpQuery', {
        id: 100,
        version: 1,
        name: 'Original',
        contextTableId: tables.CollectionObject.tableId,
        specifyUser: userInformation.resource_uri,
        fields: [],
      })
    );
    const server = new tables.SpQuery.Resource<SpQuery>({
      ...serializeResource(original),
      name: 'Server name',
      remarks: 'Server remarks',
      version: 8,
    });
    jest
      .spyOn(tables.SpQuery.Resource.prototype, 'fetch')
      .mockResolvedValue(server);
    const refreshed = jest.fn();
    render(
      <LoadingContext.Provider
        value={(promise): void => {
          void promise;
        }}
      >
        <UnloadProtectsContext.Provider value={[]}>
          <Editor resource={original} onRefreshed={refreshed} />
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: commonText.edit() }));
    original.set('name', 'Local name');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Update sharing' }));
    });
    expect(original.get('version')).toBe(1);
    expect(original.get('name')).toBe('Local name');
    expect(refreshed).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: commonText.apply() })
    ).toBeDisabled();
    if (choice === 'cancel') {
      fireEvent.click(
        screen.getByRole('button', { name: commonText.cancel() })
      );
      expect(original.get('version')).toBe(1);
      expect(original.get('name')).toBe('Local name');
      return;
    }
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: choice },
    });
    fireEvent.click(screen.getByRole('button', { name: commonText.apply() }));
    expect(original.get('version')).toBe(8);
    expect(original.get('name')).toBe(
      choice === 'local' ? 'Local name' : 'Server name'
    );
    expect(original.get('remarks')).toBe('Server remarks');
    expect(refreshed).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText(queryText.queryRefreshConflict())
    ).not.toBeInTheDocument();
  }
);
