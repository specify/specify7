import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { formsText } from '../../../localization/forms';
import { requireContext } from '../../../tests/helpers';
import { Slider } from '../Slider';

requireContext();

// [FormSliders] Navigate records with buttons and number input
test('navigates to next and last records and typed record number', async () => {
  const onChange = jest.fn();
  const user = userEvent.setup();
  const { rerender } = render(
    <Slider
      count={3}
      enableKeyboardShortcuts={false}
      value={0}
      onChange={onChange}
    />
  );

  await user.click(
    screen.getByRole('button', { name: formsText.goToNextRecord() })
  );
  expect(onChange).toHaveBeenLastCalledWith(1);

  rerender(
    <Slider
      count={3}
      enableKeyboardShortcuts={false}
      value={1}
      onChange={onChange}
    />
  );
  await user.click(
    screen.getByRole('button', { name: formsText.goToLastRecord() })
  );
  expect(onChange).toHaveBeenLastCalledWith(2);

  const input = screen.getByRole('spinbutton');
  await act(async () => {
    await user.clear(input);
    await user.type(input, '3');
  });
  expect(onChange).toHaveBeenLastCalledWith(2);
});
