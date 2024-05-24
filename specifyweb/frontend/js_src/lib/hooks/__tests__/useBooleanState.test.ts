import { act, renderHook } from '@testing-library/react';

import { useBooleanState } from '../useBooleanState';

test('Verify state does not change when setter not called with default value', () => {
  const { result } = renderHook(() => useBooleanState());

  expect(result.current[0]).toBe(false);
});

test('Verify state does not change when setter is not called', () => {
  const { result } = renderHook(() => useBooleanState(true));

  expect(result.current[0]).toBe(true);
});

test.each([
  [true, true],
  [false, true],
])(
  'Test state is true whenever enable is called',
  (initialValue, expectedOutcome) => {
    const { result } = renderHook(() => useBooleanState(initialValue));

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(expectedOutcome);
  }
);

test.each([
  [true, true],
  [false, true],
])(
  'Test state is true whenever enable is called multiple times',
  (initialValue, expectedOutcome) => {
    const { result } = renderHook(() => useBooleanState(initialValue));

    act(() => {
      result.current[1]();
      result.current[1]();
      result.current[1]();
    });

    expect(result.current[0]).toBe(expectedOutcome);
  }
);

test.each([
  [true, false],
  [false, false],
])(
  'Test state is false whenever disable is called',
  (initialValue, expectedOutcome) => {
    const { result } = renderHook(() => useBooleanState(initialValue));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe(expectedOutcome);
  }
);

test.each([
  [true, false],
  [false, false],
])(
  'Test state is false whenever disable is called mutiple times',
  (initialValue, expectedOutcome) => {
    const { result } = renderHook(() => useBooleanState(initialValue));

    act(() => {
      result.current[2]();
      result.current[2]();
      result.current[2]();
    });

    expect(result.current[0]).toBe(expectedOutcome);
  }
);

test.each([
  [true, false],
  [false, true],
])(
  'Test state switches whenever toggle is called',
  (initialValue, expectedOutcome) => {
    const { result } = renderHook(() => useBooleanState(initialValue));

    act(() => {
      result.current[3]();
    });

    expect(result.current[0]).toBe(expectedOutcome);
  }
);

test.each([
  [true, true],
  [false, false],
])(
  'Test state switches whenever toggle is called two times',
  (initialValue, expectedOutcome) => {
    const { result } = renderHook(() => useBooleanState(initialValue));

    act(() => {
      result.current[3]();
      result.current[3]();
    });

    expect(result.current[0]).toBe(expectedOutcome);
  }
);

test.each([
  [true, false],
  [false, true],
])(
  'Test state switches whenever toggle is called three times',
  (initialValue, expectedOutcome) => {
    const { result } = renderHook(() => useBooleanState(initialValue));

    act(() => {
      result.current[3]();
      result.current[3]();
      result.current[3]();
    });

    expect(result.current[0]).toBe(expectedOutcome);
  }
);

test('Test state updates whenever hook is called multiple times', () => {
  const { result } = renderHook(() => useBooleanState(true));

  act(() => {
    result.current[1]();
  });

  expect(result.current[0]).toBe(true);

  act(() => {
    result.current[2]();
  });

  expect(result.current[0]).toBe(false);

  act(() => {
    result.current[3]();
  });

  expect(result.current[0]).toBe(true);
});

test('Test state updates whenever hook is called multiple times in a row', () => {
  const { result } = renderHook(() => useBooleanState(true));

  act(() => {
    result.current[1]();
    result.current[2]();
    result.current[3]();
  });

  expect(result.current[0]).toBe(true);
});

test('Test state updates when default value changes', () => {
  const { result, rerender } = renderHook(
    ({ initialValue }) => useBooleanState(initialValue),
    {
      initialProps: { initialValue: true },
    }
  );

  expect(result.current[0]).toBe(true);

  rerender({ initialValue: false });

  expect(result.current[0]).toBe(false);
});
