import { act, renderHook, waitFor } from '@testing-library/react';

import { usePromise } from '../useAsyncState';

describe("usePromise", ()=>{

    test("promise gets resolved and state set", async ()=>{

        const promise = Promise.resolve(10);

        const {result } = renderHook(()=>usePromise(promise, false));

        await waitFor(()=>{
            expect(result.current[0]).toBe(10);
        });

        await act(()=>result.current[1](11));

        expect(result.current[0]).toBe(11);

  });

  test('state changes when promise changes', async () => {
    let promise = Promise.resolve(10);

    const { result, rerender } = renderHook(() => usePromise(promise, false));

    await waitFor(() => {
      expect(result.current[0]).toBe(10);
    });

    promise = Promise.resolve(11);

    await act(rerender);

    await waitFor(() => {
      expect(result.current[0]).toBe(11);
    });

  });

});
