import { renderHook, waitFor } from '@testing-library/react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncStateMock } from '../../../hooks/useAsyncStateMock';
import { overrideAjax } from '../../../tests/ajax';
import { hasPermission } from '../../Permissions/helpers';
import { useAdmins } from '../Institution';

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: jest.fn(),
}));

const mockSetState = jest.fn();

jest.mock('../../../hooks/useAsyncState', () => {
  const module = jest.requireActual('../../../hooks/useAsyncState');
  return {
    ...module,
    useAsyncState: <T>(callback: () => Promise<T | undefined> | undefined) => {
      useAsyncStateMock(callback, mockSetState);
      return [undefined, () => undefined];
    },
  };
});

beforeEach(() => {
  mockSetState.mockClear();
});

describe('useAdmins - permission denied', () => {
  beforeEach(() => {
    (hasPermission as jest.Mock).mockReturnValue(false);
  });

  test('returns empty admins Set when permission is denied', async () => {
    renderHook(() => useAdmins());

    await waitFor(() => {
      expect(mockSetState).toHaveBeenCalledTimes(1);
    });

    const result = mockSetState.mock.lastCall?.[0];
    expect(result?.admins).toEqual(new Set());
  });

  test('returns empty adminUsers array when permission is denied', async () => {
    renderHook(() => useAdmins());

    await waitFor(() => {
      expect(mockSetState).toHaveBeenCalledTimes(1);
    });

    const result = mockSetState.mock.lastCall?.[0];
    expect(result?.adminUsers).toEqual([]);
  });

  test('returns empty legacyAdmins Set when permission is denied', async () => {
    renderHook(() => useAdmins());

    await waitFor(() => {
      expect(mockSetState).toHaveBeenCalledTimes(1);
    });

    const result = mockSetState.mock.lastCall?.[0];
    expect(result?.legacyAdmins).toEqual(new Set());
  });
});

describe('useAdmins - permission granted with admin data', () => {
  beforeEach(() => {
    (hasPermission as jest.Mock).mockReturnValue(true);
  });

  overrideAjax('/permissions/list_admins/', {
    sp7_admins: [
      { userid: 1, username: 'alice' as LocalizedString },
      { userid: 2, username: 'bob' as LocalizedString },
    ],
    sp6_admins: [{ userid: 3, username: 'charlie' as LocalizedString }],
  });

  test('admins Set contains sp7_admin userids', async () => {
    renderHook(() => useAdmins());

    await waitFor(() => {
      expect(mockSetState).toHaveBeenCalledTimes(1);
    });

    const result = mockSetState.mock.lastCall?.[0];
    expect(result?.admins.has(1)).toBe(true);
    expect(result?.admins.has(2)).toBe(true);
    expect(result?.admins.has(3)).toBe(false);
  });

  test('adminUsers maps sp7_admins using camelCase keys', async () => {
    renderHook(() => useAdmins());

    await waitFor(() => {
      expect(mockSetState).toHaveBeenCalledTimes(1);
    });

    const result = mockSetState.mock.lastCall?.[0];
    expect(result?.adminUsers).toEqual([
      { userId: 1, userName: 'alice' },
      { userId: 2, userName: 'bob' },
    ]);
  });

  test('adminUsers does not include sp6 (legacy) admins', async () => {
    renderHook(() => useAdmins());

    await waitFor(() => {
      expect(mockSetState).toHaveBeenCalledTimes(1);
    });

    const result = mockSetState.mock.lastCall?.[0];
    const hasCharlie = result?.adminUsers.some(
      (u: { userId: number }) => u.userId === 3
    );
    expect(hasCharlie).toBe(false);
  });

  test('legacyAdmins Set contains sp6_admin userids', async () => {
    renderHook(() => useAdmins());

    await waitFor(() => {
      expect(mockSetState).toHaveBeenCalledTimes(1);
    });

    const result = mockSetState.mock.lastCall?.[0];
    expect(result?.legacyAdmins.has(3)).toBe(true);
    expect(result?.legacyAdmins.has(1)).toBe(false);
    expect(result?.legacyAdmins.has(2)).toBe(false);
  });

  test('admins and legacyAdmins are disjoint Sets', async () => {
    renderHook(() => useAdmins());

    await waitFor(() => {
      expect(mockSetState).toHaveBeenCalledTimes(1);
    });

    const result = mockSetState.mock.lastCall?.[0];
    const adminsArray = [...result.admins];
    const legacyAdminsArray = [...result.legacyAdmins];
    const overlap = adminsArray.filter((id: number) =>
      legacyAdminsArray.includes(id)
    );
    expect(overlap).toEqual([]);
  });
});

describe('useAdmins - permission granted with empty admin lists', () => {
  beforeEach(() => {
    (hasPermission as jest.Mock).mockReturnValue(true);
  });

  overrideAjax('/permissions/list_admins/', {
    sp7_admins: [],
    sp6_admins: [],
  });

  test('admins Set is empty when no sp7 admins exist', async () => {
    renderHook(() => useAdmins());

    await waitFor(() => {
      expect(mockSetState).toHaveBeenCalledTimes(1);
    });

    const result = mockSetState.mock.lastCall?.[0];
    expect(result?.admins).toEqual(new Set());
  });

  test('adminUsers array is empty when no sp7 admins exist', async () => {
    renderHook(() => useAdmins());

    await waitFor(() => {
      expect(mockSetState).toHaveBeenCalledTimes(1);
    });

    const result = mockSetState.mock.lastCall?.[0];
    expect(result?.adminUsers).toEqual([]);
  });

  test('legacyAdmins Set is empty when no sp6 admins exist', async () => {
    renderHook(() => useAdmins());

    await waitFor(() => {
      expect(mockSetState).toHaveBeenCalledTimes(1);
    });

    const result = mockSetState.mock.lastCall?.[0];
    expect(result?.legacyAdmins).toEqual(new Set());
  });
});
