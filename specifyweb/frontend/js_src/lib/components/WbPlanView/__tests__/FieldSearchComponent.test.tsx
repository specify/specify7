import { screen, waitFor } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { FieldSearch } from '../FieldSearchComponent';
import { searchFields } from '../fieldSearch';
import { navigatorSpecs } from '../navigatorSpecs';

requireContext();

const resultPageSize = 10;

const renderFieldSearch = () => {
  const handleSelect = jest.fn();
  const { user } = mount(
    <FieldSearch
      baseTableName="CollectionObject"
      searchSpec={navigatorSpecs.wbPlanView}
      showHiddenFields={false}
      onSelectSearchResult={handleSelect}
    />
  );
  return { handleSelect, user };
};

const getShowMore = (): HTMLElement =>
  screen.getByRole('button', { name: commonText.showMore() });

/** Count the result buttons, excluding the "show more" button */
const countResults = (): number =>
  screen
    .getAllByRole('button')
    .filter((button) => button.textContent !== commonText.showMore()).length;

const waitForResults = async (): Promise<void> => {
  // Wait out the search debounce
  await waitFor(() => expect(countResults()).toBeGreaterThan(0));
};

test('shows a "show more" button when more results are available', async () => {
  const { user } = renderFieldSearch();
  await user.type(screen.getByRole('textbox'), 'catalog');
  await waitForResults();

  expect(countResults()).toBe(resultPageSize);
  expect(getShowMore()).toBeInTheDocument();
});

test('"show more" reveals the next batch without scrolling', async () => {
  const { user } = renderFieldSearch();
  await user.type(screen.getByRole('textbox'), 'catalog');
  await waitForResults();

  await user.click(getShowMore());
  expect(countResults()).toBe(resultPageSize * 2);

  await user.click(getShowMore());
  expect(countResults()).toBe(resultPageSize * 3);
});

test('"show more" stops once every result is visible', async () => {
  const search = 'catalogNumber';
  const totalResults = searchFields({
    baseTableName: 'CollectionObject',
    search,
    spec: navigatorSpecs.wbPlanView,
  }).length;
  expect(totalResults).toBeGreaterThan(resultPageSize);

  const { user } = renderFieldSearch();
  await user.type(screen.getByRole('textbox'), search);
  await waitForResults();

  let clickCount = 0;
  while (
    screen.queryByRole('button', { name: commonText.showMore() }) !== null
  ) {
    // eslint-disable-next-line no-await-in-loop
    await user.click(getShowMore());
    clickCount += 1;
    expect(clickCount).toBeLessThan(totalResults);
  }

  // The last batch is capped at the total rather than overshooting it
  expect(countResults()).toBe(totalResults);
});

test('"show more" does not select a result', async () => {
  const { handleSelect, user } = renderFieldSearch();
  await user.type(screen.getByRole('textbox'), 'catalog');
  await waitForResults();

  await user.click(getShowMore());
  expect(handleSelect).not.toHaveBeenCalled();
  expect(screen.getByRole('textbox')).toHaveValue('catalog');
});
