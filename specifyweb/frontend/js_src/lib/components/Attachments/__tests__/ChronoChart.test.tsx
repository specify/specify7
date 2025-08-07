import React from 'react';

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

    await user.click(button);

    const dialog = getAllByRole('dialog')[0];

    expect(dialog).toMatchSnapshot();

    const closeButton = getAllByRole('button')[3];

    await user.click(closeButton);

    expect(() => getAllByRole('dialog')).toThrow();
  });
});
