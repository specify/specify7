import React from 'react';

import { mount } from '../../../tests/reactUtils';
import { Input } from '../Form';

test('Input.Text emits onValueChange', async () => {
  const handleValueChange = jest.fn();
  const { getByRole, user } = mount(
    <Input.Text name="test-input" value="" onValueChange={handleValueChange} />
  );

  const input = getByRole('textbox');
  await user.type(input, 'abc');
  expect(handleValueChange).toHaveBeenCalledTimes(3);
  expect(handleValueChange).toHaveBeenNthCalledWith(1, 'a');
  expect(handleValueChange).toHaveBeenNthCalledWith(2, 'b');
  expect(handleValueChange).toHaveBeenNthCalledWith(3, 'c');
});
