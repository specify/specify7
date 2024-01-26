import React from 'react';

import { databaseDateFormat } from '../../utils/parser/dateConfig';
import { fullDateFormat, monthFormat } from '../../utils/parser/dateFormat';
import { userPreferences } from '../Preferences/userPreferences';

function isInputSupported(type: 'date' | 'month'): boolean {
  const input = document.createElement('input');
  const value = 'a';
  input.setAttribute('type', type);
  input.setAttribute('value', value);
  return input.value !== value;
}

export function useDatePreferences(): {
  readonly dateType: 'date' | 'text';
  readonly dateSupported: boolean;
  readonly monthType: 'month' | 'text';
  readonly monthSupported: boolean;
  readonly inputFullFormat: string;
  readonly inputMonthFormat: string;
} {
  // Preferences
  const [useDatePicker] = userPreferences.use(
    'form',
    'ui',
    'useAccessibleFullDatePicker'
  );
  const [useMonthPicker] = userPreferences.use(
    'form',
    'ui',
    'useAccessibleMonthPicker'
  );
  return React.useMemo(() => {
    const dateType = useDatePicker ? 'date' : 'text';
    const monthType = useMonthPicker ? 'month' : 'text';
    const dateSupported = useDatePicker && isInputSupported('date');
    const monthSupported = useMonthPicker && isInputSupported('month');

    return {
      dateType,
      dateSupported,
      monthType,
      monthSupported,
      /*
       * If input[type="date"] or input[type="month"] is not supported,
       * present the date in a more human-readable format
       */
      inputFullFormat: dateSupported ? databaseDateFormat : fullDateFormat(),
      inputMonthFormat: monthSupported ? 'YYYY-MM' : monthFormat(),
    };
  }, [useDatePicker, useMonthPicker]);
}

export const exportsForTests = { isInputSupported };
