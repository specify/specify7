import React from 'react';

import { commonText } from '../../../localization/common';
import { Container, ErrorMessage, H2, H3, Key, Summary, Ul } from '../index';
import { mount, snapshot } from '../../../tests/reactUtils';

snapshot(ErrorMessage, { children: commonText.title() });
snapshot(Container.FullGray, { children: commonText.title() });
snapshot(Container.Base, { children: commonText.title() });
snapshot(Container.Center, { children: commonText.title() });
snapshot(Container.Full, { children: commonText.title() });
snapshot(Ul, { children: commonText.title() });
snapshot(H2, { children: commonText.title() });
snapshot(H3, { children: commonText.title() });
snapshot(Key, { children: commonText.title() });

test('Can use <summary> as a controlled component', async () => {
  const build = (open: boolean) => (
    <details open={open}>
      <Summary onToggle={handleToggle}>a</Summary>
    </details>
  );
  const handleToggle = jest.fn((open: boolean) => rerender(build(open)));
  const { asFragment, rerender, getByText, user } = mount(build(false));
  const summary = getByText.a();

  await user.click(summary);
  expect(handleToggle).toHaveBeenLastCalledWith(true);

  await user.click(summary);
  expect(handleToggle).toHaveBeenLastCalledWith(false);

  expect(asFragment()).toMatchSnapshot();
});
