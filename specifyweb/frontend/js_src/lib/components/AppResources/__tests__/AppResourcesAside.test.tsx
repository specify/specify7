import React from 'react';
import { testAppResources } from './testAppResources';
import * as Router from 'react-router-dom';

import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import type { RA } from '../../../utils/types';
import type { AppResourcesConformation } from '../Aside';
import { AppResourcesAside } from '../Aside';

requireContext();

describe('AppResourcesAside (simple no conformation case)', () => {
  test('simple no conformation case', () => {
    const onOpen = jest.fn();
    const setConformations = jest.fn();

    const { asFragment, unmount } = mount(
      <AppResourcesAside
        resources={testAppResources}
        isEmbedded
        onOpen={onOpen}
        filters={undefined}
        conformations={[[], setConformations]}
      />
    );

    expect(asFragment()).toMatchSnapshot();
    unmount();
  });
});

describe('AppResourcesAside (expanded case)', () => {
  test('expanded case', async () => {
    const onOpen = jest.fn();
    const _setConformations = jest.fn();
    let _conformations: RA<AppResourcesConformation> | undefined = [];

    const setConformations = (
      argument: typeof _conformations // Whatever
    ) => {
      _setConformations(argument);
      _conformations = argument;
    };

    const {
      getAllByRole,
      user,
      unmount,
      asFragment: asFragmentInitial,
    } = mount(
      <AppResourcesAside
        resources={testAppResources}
        isEmbedded
        onOpen={onOpen}
        filters={undefined}
        conformations={[_conformations, setConformations]}
      />
    );

    const initialFragment = asFragmentInitial().textContent;

    const buttons = getAllByRole('button');

    await user.click(buttons[1]);

    unmount();

    const {
      asFragment,
      unmount: unmountSecond,
      getAllByRole: getIntermediate,
    } = mount(
      <AppResourcesAside
        resources={testAppResources}
        isEmbedded
        onOpen={onOpen}
        filters={undefined}
        conformations={[_conformations, setConformations]}
      />
    );

    expect(asFragment()).toMatchSnapshot();

    const intermediateFragment = asFragment().textContent;

    const closeAllButton = getIntermediate('button').at(-1);
    await user.click(closeAllButton!);

    unmountSecond();

    const {
      asFragment: asFragmentLater,
      unmount: unmountThird,
      getAllByRole: getFinal,
    } = mount(
      <AppResourcesAside
        resources={testAppResources}
        isEmbedded
        onOpen={onOpen}
        filters={undefined}
        conformations={[_conformations, setConformations]}
      />
    );

    const laterFragment = asFragmentLater().textContent;

    expect(initialFragment).toBe(
      'Global Resources (2)Discipline Resources (4)Expand AllCollapse All'
    );
    expect(intermediateFragment).toBe(
      'Global Resources (2)Discipline Resources (4)Botany (4)Expand AllCollapse All'
    );
    expect(laterFragment).toBe(
      'Global Resources (2)Discipline Resources (4)Expand AllCollapse All'
    );

    const expandAllButton = getFinal('button')[2];
    await user.click(expandAllButton);

    unmountThird();

    const { asFragment: asFragmentAllExpanded, unmount: unmountExpandedll } =
      mount(
        <Router.MemoryRouter initialEntries={['/specify/resources/']}>
          <AppResourcesAside
            resources={testAppResources}
            isEmbedded
            onOpen={onOpen}
            filters={undefined}
            conformations={[_conformations, setConformations]}
          />
        </Router.MemoryRouter>
      );

    const expandedAllFragment = asFragmentAllExpanded().textContent;

    expect(expandedAllFragment).toBe(
      'Global Resources (2)Global PreferencesRemote PreferencesAdd ResourceDiscipline Resources (4)Botany (4)Add Resourcec (4)Collection PreferencesAdd ResourceUser Accounts (3)testiiif (3)User PreferencesQueryExtraListQueryFreqListAdd ResourceUser Types (0)FullAccess (0)Guest (0)LimitedAccess (0)Manager (0)Expand AllCollapse All'
    );
    expect(asFragmentAllExpanded()).toMatchSnapshot();
    unmountExpandedll();
  });
});
