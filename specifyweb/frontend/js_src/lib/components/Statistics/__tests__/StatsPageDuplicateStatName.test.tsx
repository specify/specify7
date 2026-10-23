import { screen, waitFor, within } from '@testing-library/react';
import { requireContext } from '../../../tests/helpers';
import {
  addPageWithCategory,
  getCategoryItems,
  getStatInputs,
  mockSavedQueries,
  mockStatsRequests,
  openChooseStatisticsDialog,
  renderEmptyStatsPage,
  type User,
} from './statsPageTestUtils';

const queryName = 'My Saved Query';

requireContext();
mockStatsRequests();
mockSavedQueries([
  {
    id: 1,
    name: queryName,
    contextname: 'Locality',
    contexttableid: 2,
    selectdistinct: false,
    searchsynonymy: false,
    countonly: false,
    timestampcreated: '2026-01-01T00:00:00',
    fields: [],
    resource_uri: '/api/specify/spquery/1/',
  },
]);

async function addSavedQuery(user: User): Promise<void> {
  const dialog = await openChooseStatisticsDialog(user);
  await user.click(
    await within(dialog).findByRole('button', {
      name: new RegExp(`${queryName}$`, 'u'),
    })
  );
}

describe('Adding a stat item with the same name', () => {
  test('the second copy is named with "(2)"', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    await addPageWithCategory(user);
    await addSavedQuery(user);
    await addSavedQuery(user);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(getCategoryItems(getSharedLayout).map(({ label }) => label)).toEqual(
      [queryName, `${queryName} (2)`]
    );
    expect(getStatInputs(0).map(({ value }) => value)).toEqual([
      queryName,
      `${queryName} (2)`,
    ]);
    await waitFor(() =>
      getCategoryItems(getSharedLayout).forEach((item) =>
        expect(item.itemValue).toBeDefined()
      )
    );
  });

  test('a third copy is named with "(3)"', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    await addPageWithCategory(user);
    for (let index = 0; index < 3; index += 1) await addSavedQuery(user);

    expect(getCategoryItems(getSharedLayout).map(({ label }) => label)).toEqual(
      [queryName, `${queryName} (2)`, `${queryName} (3)`]
    );
    await waitFor(() =>
      getCategoryItems(getSharedLayout).forEach((item) =>
        expect(item.itemValue).toBeDefined()
      )
    );
  });
});
