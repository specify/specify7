import { act, renderHook } from '@testing-library/react';

import { useId } from '../useId';

describe('useId', () => {
  test('generates stable prefix', async () => {
    const { result, rerender } = renderHook(() => useId('test'));

    /*
     * NOTES: asserting that the callback is stable is not good.
     * Instead, just the stability of result is considered.
     */

    // TODO: Technically, there should be a cleanup function where idStore gets cleaned up.
    expect(result.current('suffix')).toBe('test-0-suffix');
    expect(result.current('suffix_second')).toBe('test-0-suffix_second');

    await act(rerender);
    // The rerender shouldn't change the value.
    expect(result.current('suffix')).toBe('test-0-suffix');

    // Now, a new hook instance is mounted.
    const { result: secondResult, rerender: secondRerender } = renderHook(() =>
      useId('test')
    );
    expect(secondResult.current('suffix')).toBe('test-1-suffix');

    await act(secondRerender);

    expect(secondResult.current('suffix')).toBe('test-1-suffix');
    // The first callback should still be stable
    expect(result.current('suffix_third')).toBe('test-0-suffix_third');
  });

  test('handles empty suffix', async () => {
    const { result } = renderHook(() => useId('brand_new_prefix'));
    expect(result.current('')).toBe('brand_new_prefix-0');
  });
});
