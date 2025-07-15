import { renderHook } from '@testing-library/react';

import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { exportsForTests, useDatePreferences } from '../useDatePreferences';

requireContext();

const { isInputSupported } = exportsForTests;

// Hard to test the input not supported case in a test environment
theories(isInputSupported, [
  [['date'], true],
  [['month'], true],
]);

// Hook tests
test('useDatePreferences', () => {
  const { result } = renderHook(() => useDatePreferences());
  expect(result.current).toMatchInlineSnapshot(`
    {
      "dateSupported": true,
      "dateType": "date",
      "inputFullFormat": "YYYY-MM-DD",
      "inputMonthFormat": "YYYY-MM",
      "monthSupported": true,
      "monthType": "month",
    }
  `);
});
