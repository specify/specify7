import { cleanup } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import type { AutoCompleteItem } from '../AutoComplete';
import { AutoComplete } from '../AutoComplete';

requireContext();

describe('AutoComplete keyboard navigation', () => {
  const scrollIntoView = jest.fn();
  const portalRoot = document.createElement('div');

  beforeAll(() => {
    portalRoot.id = 'portal-root';
    document.body.append(portalRoot);
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterAll(() => {
    portalRoot.remove();
  });

  beforeEach(() => {
    scrollIntoView.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  const makeItems = (count: number): ReadonlyArray<AutoCompleteItem<string>> =>
    Array.from({ length: count }, (_, index) => ({
      label: `Item ${index}`,
      data: String(index),
    }));

  const scrolledIndexes = (): ReadonlyArray<string | null> =>
    scrollIntoView.mock.instances.map((element: Element) =>
      element.getAttribute('data-index')
    );

  test('scrolls the highlighted row into view with arrow keys', async () => {
    const { getByRole, user } = mount(
      <AutoComplete
        delay={0}
        filterItems={false}
        source={makeItems(10)}
        value=""
        onChange={jest.fn()}
      />
    );

    await user.type(getByRole('combobox'), 'i');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    expect(scrolledIndexes()).toContain('1');
  });
});
