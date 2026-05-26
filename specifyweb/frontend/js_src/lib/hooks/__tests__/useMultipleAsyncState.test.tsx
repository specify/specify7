import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { LoadingContext } from '../../components/Core/Contexts';
import { mount } from '../../tests/reactUtils';
import type { IR } from '../../utils/types';
import { useMultipleAsyncState } from '../useAsyncState';

describe('useMultipleAsyncState', () => {
  function TestLoading({
    promises,
    callback,
    showLoading,
  }: {
    readonly promises: IR<() => Promise<string>>;
    readonly callback: (state: IR<string | undefined> | undefined) => void;
    readonly showLoading: boolean;
  }) {
    const [state] = useMultipleAsyncState(promises, showLoading);
    React.useEffect(() => {
      callback(state);
    }, [state, callback]);
    return <></>;
  }

  test('promise gets resolved and state set', async () => {
    const promises = {
      firstItem: async () => 'First Promise',
      secondItem: async () => 'Second Promise',
    };

    const { result } = renderHook(() => useMultipleAsyncState(promises, false));

    await waitFor(() => {
      expect(result.current[0]?.firstItem).toBe('First Promise');
      expect(result.current[0]?.secondItem).toBe('Second Promise');
    });
  });

  test('Loading screen appears', async () => {
    const promises = {
      firstItem: async () => 'First Promise',
      secondItem: async () => 'Second Promise',
    };

    const promiseHandler = jest.fn();
    const onStateSet = jest.fn();

    mount(
      <LoadingContext.Provider value={promiseHandler}>
        <TestLoading callback={onStateSet} promises={promises} showLoading />
      </LoadingContext.Provider>
    );

    await waitFor(() => {
      expect(onStateSet.mock.calls.length).toBeGreaterThanOrEqual(1);
      const stateSet = onStateSet.mock.calls.at(-1).at(0);
      expect(stateSet).toEqual({
        firstItem: 'First Promise',
        secondItem: 'Second Promise',
      });
    });

    expect(promiseHandler).toHaveBeenCalled();
  });

  test.skip('state changes when promise changes', async () => {
    const firstPromise = Promise.resolve('First Promise');
    const secondPromise = Promise.resolve('Second Promise');
    const thirdPromise = Promise.resolve('Third Promise');

    let promises: IR<() => Promise<string>> = {
      firstItem: async () => firstPromise,
      secondItem: async () => secondPromise,
    };

    const { result, rerender } = renderHook(() =>
      useMultipleAsyncState(promises, false)
    );

    await waitFor(() => {
      expect(result.current[0]?.firstItem).toBe('First Promise');
      expect(result.current[0]?.secondItem).toBe('Second Promise');
    });

    promises = { ...promises, thirdItem: async () => thirdPromise };

    await act(rerender);

    await waitFor(() => {
      expect(result.current[0]?.firstItem).toBe('First Promise');
      expect(result.current[0]?.secondItem).toBe('Second Promise');
      expect(result.current[0]?.thirdItem).toBe('Third Promise');
    });
  });
});
