import React from 'react';

import { clearIdStore } from '../../../hooks/useId';
import { mount } from '../../../tests/reactUtils';
import { Tabs } from '../Tabs';

beforeEach(() => {
  clearIdStore();
});

describe('Tabs', () => {
  test('simple no tabs', () => {
    const handleChange = jest.fn();

    const { asFragment } = mount(<Tabs index={[0, handleChange]} tabs={{}} />);
    expect(asFragment()).toMatchSnapshot();
  });

  test('first tab selected, and then second', async () => {
    const handleChange = jest.fn();

    const tabs = {
      tab1: <h1>Tab1</h1>,
      tab2: <h1>Tab2</h1>,
    };

    const { asFragment, getAllByRole, user } = mount(
      <Tabs index={[0, handleChange]} tabs={tabs} />
    );
    expect(asFragment()).toMatchSnapshot();
    expect(handleChange).not.toHaveBeenCalled();

    const tabElements = getAllByRole('tab');
    await user.click(tabElements[1]);

    expect(handleChange).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalledWith(1);
    expect(asFragment()).toMatchSnapshot();
  });
});
