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

async function fakeAsyncFunction() {
  await new Promise((resolve) => setTimeout(resolve, 100));

  return 'Data fetched from async operation';
}
test('Update state with asynchronous code', async () => {
  const { result } = renderHook(() => useTriggerState(0));

  expect(result.current[0]).toBe(0);

  await act(async () => {
    await fakeAsyncFunction();

    result.current[1](42);
  });

  expect(result.current[0]).toBe(42);
});
