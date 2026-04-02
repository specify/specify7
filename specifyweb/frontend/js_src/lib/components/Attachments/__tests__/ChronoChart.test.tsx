import React from 'react';
import {
  act,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import { mount } from '../../../tests/reactUtils';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { ChronoChart } from '../ChronoChart';

describe('ChronoChart', () => {
  test('simple render', () => {
    const { asFragment } = mount(<ChronoChart />);
    expect(asFragment()).toMatchSnapshot();
  });

  test('dialog open and close', async () => {
    const { getAllByRole, user } = mount(
      <UnloadProtectsContext.Provider value={[]}>
        <ChronoChart />
      </UnloadProtectsContext.Provider>
    );

    const button = getAllByRole('button')[0];

    await act(async () => {
      await user.click(button);
    });

    const dialog = await screen.findByRole('dialog');

    expect(dialog).toMatchSnapshot();

    const closeButton = within(dialog).getByRole('button', {
      name: /close/i,
    });

    await act(async () => {
      await user.click(closeButton);
    });

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
