import { renderHook } from '@testing-library/react';

import { getCache } from '../../utils/cache';
import { useCachedState } from '../useCachedState';

// Mock cache utility functions
jest.mock('../../utils/cache', () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  cacheEvents: {
    on: jest.fn(),
    emit: jest.fn(),
  },
}));

test('Initialize state from cache', () => {
  (getCache as jest.Mock).mockReturnValue(true); // Assume boolean value
  const { result } = renderHook(() => useCachedState('header', 'isCollapsed'));

  expect(result.current[0]).toBe(true);
  expect(getCache).toHaveBeenCalledWith('header', 'isCollapsed');
});
