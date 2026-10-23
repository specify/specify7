import { screen, within } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import { defaultLayoutGenerated } from '../StatsSpec';
import {
  addSharedPage,
  deletePage,
  getCurrentPageName,
  getPageButtons,
  getPageNames,
  mockStatsRequests,
  openEditPageDialog,
  renderEmptyStatsPage,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();

const defaultPageName = defaultLayoutGenerated[0].label;

describe('Deleting Shared pages', () => {
  test('the only Shared page cannot be deleted', async () => {
    const { user } = await renderEmptyStatsPage();
    const dialog = await openEditPageDialog(user, defaultPageName);
    expect(
      within(dialog).queryByRole('button', { name: commonText.remove() })
    ).not.toBeInTheDocument();
  });

  test('deleting several pages keeps the right page selected', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    for (const name of ['A', 'B', 'C', 'D']) await addSharedPage(user, name);
    expect(getCurrentPageName()).toBe('D');

    const expectPages = (names: readonly string[], current: string) => {
      expect(
        screen.queryByRole('dialog', { name: statsText.editPage() })
      ).not.toBeInTheDocument();
      expect(getPageNames(statsText.shared())).toEqual(names);
      expect(getSharedLayout()?.map(({ label }) => label)).toEqual(names);
      expect(getCurrentPageName()).toBe(current);
    };

    // A page before the selected one: selection stays on the same page
    await deletePage(user, 'B');
    expectPages([defaultPageName, 'A', 'C', 'D'], 'D');

    // The selected page: selection moves to the previous page
    await deletePage(user, 'D');
    expectPages([defaultPageName, 'A', 'C'], 'C');

    // The first page
    await deletePage(user, defaultPageName);
    expectPages(['A', 'C'], 'C');

    // A page after the selected one: selection doesn't move
    await user.click(getPageButtons(statsText.shared())[0]);
    await deletePage(user, 'C');
    expectPages(['A'], 'A');

    // One page remaining so it can no longer be deleted
    const dialog = await openEditPageDialog(user, 'A');
    expect(
      within(dialog).queryByRole('button', { name: commonText.remove() })
    ).not.toBeInTheDocument();
  });

  test('deleting Shared pages does not touch the Private section', async () => {
    const { user, getPersonalLayout } = await renderEmptyStatsPage();
    const personalLayout = getPersonalLayout();
    for (const name of ['A', 'B']) await addSharedPage(user, name);
    await deletePage(user, 'A');
    await deletePage(user, 'B');

    expect(getPersonalLayout()).toEqual(personalLayout);
    expect(getPageNames(statsText.private())).toEqual([
      defaultLayoutGenerated[1].label,
    ]);
  });
});
