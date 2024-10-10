import { act, renderHook } from '@testing-library/react';

import { cacheEvents, getCache, setCache } from '../../utils/cache';
import { useCachedState } from '../useCachedState';
import { resourceLimits } from 'worker_threads';

let eventHandler: (payload: { category: string; key: string }) => void;

// Mock cache utility functions
jest.mock('../../utils/cache', () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  cacheEvents: {
    on: jest.fn((eventName: string, handler: (payload: any) => void) => {
      if (eventName === 'change') {
        eventHandler = handler;
      }
      return jest.fn();
    }),
    trigger: jest.fn(),
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

test('Do not update state if setCachedState is called with undefined', () => {
  (getCache as jest.Mock).mockReturnValue(true);
  const { result } = renderHook(() => useCachedState('header', 'isCollapsed'));

  expect(result.current[0]).toBe(true);

  act(() => {
    result.current[1](undefined); // Call with undefined
  });

  expect(result.current[0]).toBe(true);
  expect(setCache).not.toHaveBeenCalled();
});

//fails
test('Retain state after multiple renders', () => {
  (getCache as jest.Mock).mockReturnValue(true);
  const { result, rerender } = renderHook(() =>
    useCachedState('header', 'isCollapsed')
  );

  expect(result.current[0]).toBe(true);

  act(() => {
    result.current[1](false); // Update the state to false
  });

  expect(result.current[0]).toBe(false);

  rerender();

  expect(result.current[0]).toBe(false);
});

/* wip
test('Update state when cacheEvents change is triggered', () => {
  (getCache as jest.Mock).mockReturnValueOnce(true);
  const { result } = renderHook(() => useCachedState('header', 'isCollapsed'));

  expect(result.current[0]).toBe(true);

  (getCache as jest.Mock).mockReturnValueOnce(false);

  act(() => {
    eventHandler({ category: 'header', key: 'isCollapsed' });
  });

  console.log("state after cache change event ", result.current[0]);

  expect(result.current[0]).toBe(false);
  expect(getCache).toHaveBeenCalledWith('header', 'isCollapsed');
});
*/
