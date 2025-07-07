import { renderHook, waitFor } from '@testing-library/react';

import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import { useAppResources } from '../hooks';
import { staticAppResources } from './staticAppResources';
import { useAsyncStateMock } from '../../../hooks/useAsyncStateMock';

const mockFn = jest.fn();

function mockState<T>(callback: () => Promise<T | undefined> | undefined) {
  useAsyncStateMock(callback, mockFn);
  return [undefined, undefined];
}

jest.mock('../../../hooks/useAsyncState', () => {
  const module = jest.requireActual('../../../hooks/useAsyncState');
  return {
    ...module,
    useAsyncState: mockState,
  };
});

requireContext();

beforeAll(() => {
  mockFn.mockClear();
});

describe('useAppResources', () => {
  const makeCollection = (resources: RA<unknown>) => ({
    objects: resources,
    meta: {
      limit: 0,
      offset: 0,
      total_count: resources.length,
    },
  });

  overrideAjax(
    '/api/specify/spappresourcedir/?limit=0',
    makeCollection(staticAppResources.directories)
  );
  overrideAjax(
    '/api/specify/discipline/?limit=0',
    makeCollection(staticAppResources.disciplines)
  );
  overrideAjax(
    '/api/specify/collection/?limit=0',
    makeCollection(staticAppResources.collections)
  );
  overrideAjax(
    '/api/specify/specifyuser/?limit=0',
    makeCollection(staticAppResources.users)
  );
  overrideAjax(
    '/api/specify/spappresource/?limit=0',
    makeCollection(staticAppResources.appResources)
  );
  overrideAjax(
    '/api/specify/spviewsetobj/?limit=0',
    makeCollection(staticAppResources.viewSets)
  );

  test('no loading screen', async () => {
    jest.spyOn(console, 'warn').mockImplementation();

    renderHook(() => useAppResources(false));

    await waitFor(() => {
      expect(mockFn).toBeCalledTimes(1);
      expect(mockFn.mock.lastCall).toEqual([staticAppResources]);
    });
  });
});
