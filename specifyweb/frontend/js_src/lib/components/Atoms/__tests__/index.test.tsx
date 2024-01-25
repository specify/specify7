import React from 'react';

import { commonText } from '../../../localization/common';
import { mount, snapshot } from '../../../tests/reactUtils';
import { Container, ErrorMessage, H2, H3, Key, Summary, Ul } from '../index';

snapshot(ErrorMessage, { children: commonText.view() });
snapshot(Container.FullGray, { children: commonText.view() });
snapshot(Container.Base, { children: commonText.view() });
snapshot(Container.Center, { children: commonText.view() });
snapshot(Container.Full, { children: commonText.view() });
snapshot(Ul, { children: commonText.view() });
snapshot(H2, { children: commonText.view() });
snapshot(H3, { children: commonText.view() });
snapshot(Key, { children: commonText.view() });

test('Can use <summary> as a controlled component', async () => {
  const text = 'a';
  const build = (open: boolean): JSX.Element => (
    <details open={open}>
      <Summary onToggle={handleToggle}>{text}</Summary>
    </details>
  );
  const handleToggle = jest.fn((open: boolean) => rerender(build(open)));
  const { asFragment, rerender, getByText, user } = mount(build(false));
  const summary = getByText(text);

  await user.click(summary);
  expect(handleToggle).toHaveBeenLastCalledWith(true);

  await user.click(summary);
  expect(handleToggle).toHaveBeenLastCalledWith(false);

  expect(asFragment()).toMatchSnapshot();
});
