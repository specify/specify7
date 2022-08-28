import { render } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../localization/common';
import { mount } from '../../tests/utils';
import { ErrorMessage, Input } from './Basic';

test('ErrorMessage renders without errors', () => {
  const { asFragment } = render(
    <ErrorMessage>{commonText('title')}</ErrorMessage>,
    {}
  );

  expect(asFragment()).toMatchSnapshot();
});

test('Input.Text emits onValueChange', async () => {
  const handleValueChange = jest.fn();
  const { getByRole, user } = mount(
    <Input.Text name="test-input" value="" onValueChange={handleValueChange} />,
    {}
  );

  const input = getByRole('textbox');
  await user.type(input, 'abc');
  expect(handleValueChange).toHaveBeenCalledTimes(3);
  expect(handleValueChange).toHaveBeenNthCalledWith(1, 'a');
  expect(handleValueChange).toHaveBeenNthCalledWith(2, 'b');
  expect(handleValueChange).toHaveBeenNthCalledWith(3, 'c');
});
