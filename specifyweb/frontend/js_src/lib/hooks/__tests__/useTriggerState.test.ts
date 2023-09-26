import { act, renderHook } from '@testing-library/react';

import { useTriggerState } from '../useTriggerState';

test('Verify state does not change when setter not called', () => {
  const { result } = renderHook(() => useTriggerState(2));

  expect(result.current[0]).toBe(2);
});

test('Update state whenever value changes', () => {
  const { result } = renderHook(() => useTriggerState(0));

  expect(result.current[0]).toBe(0);

  act(() => {
    result.current[1](42);
  });

  expect(result.current[0]).toBe(42);
});

test('Update state multiple times', () => {
  const { result } = renderHook(() => useTriggerState(0));

  expect(result.current[0]).toBe(0);

  act(() => {
    result.current[1](42);
    result.current[1](100);
  });

  expect(result.current[0]).toBe(100);
});

test('Initialize state with an object', () => {
  const initialValue = { value: 1 };
  const { result } = renderHook(() => useTriggerState(initialValue));

  expect(result.current[0]).toBe(initialValue);

  const updatedValue = { value: 2 };

  act(() => {
    result.current[1](updatedValue);
  });

  expect(result.current[0]).toBe(updatedValue);
});

test('Change state in response to defaultValue change', () => {
  const initialValue = { value: 1 };
  const updatedValue = { value: 2 };

  const { result, rerender } = renderHook(
    ({ value }) => useTriggerState(value),
    {
      initialProps: { value: initialValue },
    }
  );

  expect(result.current[0]).toBe(initialValue);

  rerender({ value: updatedValue });

  expect(result.current[0]).toBe(updatedValue);
});
