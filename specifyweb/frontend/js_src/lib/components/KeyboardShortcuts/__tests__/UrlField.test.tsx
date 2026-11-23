import { fireEvent, screen } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { UrlField } from '../UrlShortcuts';

requireContext();

test('preserves an unchanged saved relative destination on blur', () => {
  const onChange = jest.fn();
  mount(<UrlField value="report.html" onChange={onChange} />);
  fireEvent.blur(screen.getByRole('textbox'));
  expect(onChange).not.toHaveBeenCalled();
});

test.each([
  ['google.com', 'https://google.com/'],
  ['https://google.com/search?q=fish', 'https://google.com/search?q=fish'],
  ['/specify/overlay/trees/', '/specify/overlay/trees'],
])('normalizes edited destination %s', async (input, expected) => {
  const onChange = jest.fn();
  const { user } = mount(<UrlField value="" onChange={onChange} />);
  await user.type(screen.getByRole('textbox'), input);
  await user.tab();
  expect(onChange).toHaveBeenCalledWith(expected);
});
