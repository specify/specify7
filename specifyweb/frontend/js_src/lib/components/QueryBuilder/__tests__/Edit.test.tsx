import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
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

requireContext();

jest.mock('../../Forms/ResourceView', () => ({
  ResourceView: jest.fn(({ children }) => <>{children}</>),
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

test.each([true, false])(
  'reloads the definition before adopting the sharing version (success: %s)',
  async (success) => {
    const original = new tables.SpQuery.Resource<SpQuery>(
      addMissingFields('SpQuery', {
        id: 100,
        name: 'Original definition',
        version: 1,
        specifyUser: userInformation.resource_uri,
        fields: [
          addMissingFields('SpQueryField', {
            id: 101,
            startValue: 'Original filter',
          }),
        ],
      })
    );
    const current = new tables.SpQuery.Resource<SpQuery>(
      addMissingFields('SpQuery', {
        ...serializeResource(original),
        name: 'Current definition',
        version: 7,
        fields: [
          addMissingFields('SpQueryField', {
            id: 101,
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
    render(
      <LoadingContext.Provider
        value={(promise): void => {
          pending.push(promise);
          void promise.catch(() => undefined);
        }}
      >
        <QueryEditButton query={serializeResource(original)} />
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

    await act(async () => {
      if (success) {
        resolveReload(current);
        await pending[0];
      } else {
        rejectReload(new Error('Reload failed'));
        await expect(pending[0]).rejects.toThrow('Reload failed');
      }
    });
    expect(resource.get('version')).toBe(success ? 7 : 1);
    expect(resource.get('name')).toBe(
      success ? 'Current definition' : 'Original definition'
    );
    expect(serializeResource(resource).fields[0].startValue).toBe(
      success ? 'Current filter' : 'Original filter'
    );
  }
);
