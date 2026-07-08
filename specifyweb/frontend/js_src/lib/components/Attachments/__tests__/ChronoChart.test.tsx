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
    const { getAllByRole, getByRole, queryAllByRole, user } = mount(
      <UnloadProtectsContext.Provider value={[]}>
        <ChronoChart />
      </UnloadProtectsContext.Provider>
    );

    const button = getAllByRole('button')[0];

    await user.click(button);

    expect(
      getByRole('heading', { name: 'Chronostratigraphic Chart' })
    ).toBeInTheDocument();
    expect(getByRole('img', { name: 'Chrono Chart' })).toBeInTheDocument();
    expect(getAllByRole('dialog')).toHaveLength(1);

    const closeButton = getAllByRole('button')[4];

    await user.click(closeButton);

    expect(queryAllByRole('dialog')).toHaveLength(0);
  });
});
