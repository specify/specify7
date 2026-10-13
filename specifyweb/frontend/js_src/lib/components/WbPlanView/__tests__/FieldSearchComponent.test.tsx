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

const countResults = (): number => screen.queryAllByRole('option').length;

const waitForResults = async (): Promise<void> => {
  // Wait out the search debounce
  await waitFor(() => expect(countResults()).toBeGreaterThan(0));
};

const getSearchInput = (): HTMLElement => screen.getByRole('combobox');

test('shows a "show more" button when more results are available', async () => {
  const { user } = renderFieldSearch();
  await user.type(getSearchInput(), 'catalog');
  await waitForResults();

  expect(countResults()).toBe(resultPageSize);
  expect(getShowMore()).toBeInTheDocument();
});

test('"show more" reveals the next batch without scrolling', async () => {
  const { user } = renderFieldSearch();
  await user.type(getSearchInput(), 'catalog');
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
  await user.type(getSearchInput(), search);
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
  await user.type(getSearchInput(), 'catalog');
  await waitForResults();

  await user.click(getShowMore());
  expect(handleSelect).not.toHaveBeenCalled();
  expect(getSearchInput()).toHaveValue('catalog');
});

test('exposes results as a keyboard-controlled listbox', async () => {
  const { user } = renderFieldSearch();
  const input = getSearchInput();
  await user.type(input, 'catalog');
  await waitForResults();

  const options = screen.getAllByRole('option');
  expect(input).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('listbox')).toHaveAttribute(
    'id',
    input.getAttribute('aria-controls')
  );
  options.forEach((option) => expect(option).toHaveAttribute('tabindex', '-1'));

  await user.keyboard('{ArrowDown}');
  expect(options[0]).toHaveAttribute('aria-selected', 'true');
  expect(options[0]).toHaveClass('bg-gray-200');
  expect(input).toHaveAttribute('aria-activedescendant', options[0].id);

  await user.keyboard('{ArrowDown}');
  expect(options[0]).toHaveAttribute('aria-selected', 'false');
  expect(options[0]).not.toHaveClass('bg-gray-200');
  expect(options[1]).toHaveAttribute('aria-selected', 'true');
  expect(options[1]).toHaveClass('bg-gray-200');

  await user.keyboard('{ArrowUp}');
  expect(options[0]).toHaveAttribute('aria-selected', 'true');
});

test('selects the active result with Enter', async () => {
  const { handleSelect, user } = renderFieldSearch();
  await user.type(getSearchInput(), 'catalog');
  await waitForResults();

  const expectedResult = searchFields({
    baseTableName: 'CollectionObject',
    search: 'catalog',
    spec: navigatorSpecs.wbPlanView,
  })[0];
  await user.keyboard('{ArrowDown}');
  await user.keyboard('{Enter}');

  expect(handleSelect).toHaveBeenCalledWith(expectedResult.mappingPath);
  expect(getSearchInput()).toHaveValue('');
});

test('selects the active result with ArrowRight', async () => {
  const { handleSelect, user } = renderFieldSearch();
  await user.type(getSearchInput(), 'catalog');
  await waitForResults();

  const expectedResult = searchFields({
    baseTableName: 'CollectionObject',
    search: 'catalog',
    spec: navigatorSpecs.wbPlanView,
  })[1];
  await user.keyboard('{ArrowDown}');
  await user.keyboard('{ArrowDown}');
  await user.keyboard('{ArrowRight}');

  expect(handleSelect).toHaveBeenCalledWith(expectedResult.mappingPath);
  expect(getSearchInput()).toHaveValue('');
});

test('dismisses results with Escape and reopens them with an arrow key', async () => {
  const { user } = renderFieldSearch();
  const input = getSearchInput();
  await user.type(input, 'catalog');
  await waitForResults();

  await user.keyboard('{Escape}');
  expect(input).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('listbox')).toBeNull();

  await user.keyboard('{ArrowDown}');
  expect(input).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getAllByRole('option')[0]).toHaveAttribute(
    'aria-selected',
    'true'
  );
});

test('ArrowDown reveals and activates the next result page', async () => {
  const { user } = renderFieldSearch();
  await user.type(getSearchInput(), 'catalog');
  await waitForResults();

  for (let index = 0; index < resultPageSize; index += 1) {
    // Each keyboard call must render the state used by the next key handler.
    // eslint-disable-next-line no-await-in-loop
    await user.keyboard('{ArrowDown}');
  }
  expect(screen.getAllByRole('option')).toHaveLength(resultPageSize);

  await user.keyboard('{ArrowDown}');
  const options = screen.getAllByRole('option');
  expect(options).toHaveLength(resultPageSize * 2);
  expect(options[resultPageSize]).toHaveAttribute('aria-selected', 'true');
});
