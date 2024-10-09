import { act, renderHook } from '@testing-library/react';

import { cacheEvents, getCache, setCache } from '../../utils/cache';
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
  (getCache as jest.Mock).mockReturnValue(true);
  const { result } = renderHook(() => useCachedState('header', 'isCollapsed'));

  expect(result.current[0]).toBe(true);
  expect(getCache).toHaveBeenCalledWith('header', 'isCollapsed');
});

test('Update state and cache when setCachedState is called', () => {
  (getCache as jest.Mock).mockReturnValue(true); // Returns true
  (setCache as jest.Mock).mockReturnValue(false); // Cache should get updated to false
  const { result } = renderHook(() => useCachedState('header', 'isCollapsed'));

  expect(result.current[0]).toBe(true);

  // Update the state using the second value from result (setCachedState)
  act(() => {
    result.current[1](false);
  });

  expect(result.current[0]).toBe(false);
  expect(setCache).toHaveBeenCalledWith('header', 'isCollapsed', false, true);
});

test('Do not update state if cache value is the same', () => {
  (getCache as jest.Mock).mockReturnValueOnce(true);
  const { result } = renderHook(() => useCachedState('header', 'isCollapsed'));

  expect(result.current[0]).toBe(true);

  (getCache as jest.Mock).mockReturnValueOnce(true);

  act(() => {
    (cacheEvents.on as jest.Mock).mock.calls[0][1]({
      category: 'header',
      key: 'isCollapsed',
    });
  });

  expect(result.current[0]).toBe(true);
  expect(setCache).not.toHaveBeenCalled();
});

/*
 * Test('Update state when cacheEvents change is triggered', () => {
 *   (getCache as jest.Mock).mockReturnValueOnce(true);
 *   const { result } = renderHook(() => useCachedState('header', 'isCollapsed'));
 */

//   Expect(result.current[0]).toBe(true);

//   (getCache as jest.Mock).mockReturnValueOnce(false); // Cache changes to false

/*
 *   // Trigger cache event listener to simulate a cache change
 *   act(() => {
 *     (cacheEvents.on as jest.Mock).mock.calls[0][1]({
 *       category: 'header',
 *       key: 'isCollapsed',
 *     });
 *   });
 */

/*
 *   Expect(result.current[0]).toBe(false);
 *   expect(getCache).toHaveBeenCalledWith('header', 'isCollapsed');
 *  });
 */
