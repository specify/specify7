import { screen, within } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import { defaultLayoutGenerated } from '../StatsSpec';
import {
  addPage,
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

const privateSection = statsText.private();
const defaultPrivatePageName = defaultLayoutGenerated[1].label;
const defaultSharedPageName = defaultLayoutGenerated[0].label;

describe('Deleting Private pages', () => {
  test('the only Private page cannot be deleted', async () => {
    const { user } = await renderEmptyStatsPage();
    const dialog = await openEditPageDialog(
      user,
      defaultPrivatePageName,
      privateSection
    );
    expect(
      within(dialog).queryByRole('button', { name: commonText.remove() })
    ).not.toBeInTheDocument();
  });

  test('deleting several pages keeps the right page selected', async () => {
    const { user, getPersonalLayout } = await renderEmptyStatsPage();
    for (const name of ['A', 'B', 'C', 'D'])
      await addPage(user, name, privateSection);
    expect(getCurrentPageName(privateSection)).toBe('D');

    const expectPages = (names: readonly string[], current: string) => {
      expect(
        screen.queryByRole('dialog', { name: statsText.editPage() })
      ).not.toBeInTheDocument();
      expect(getPageNames(privateSection)).toEqual(names);
      expect(getPersonalLayout()?.map(({ label }) => label)).toEqual(names);
      expect(getCurrentPageName(privateSection)).toBe(current);
    };

    // A page before the selected one: selection stays on the same page
    await deletePage(user, 'B', privateSection);
    expectPages([defaultPrivatePageName, 'A', 'C', 'D'], 'D');

    // The selected page: selection moves to the previous page
    await deletePage(user, 'D', privateSection);
    expectPages([defaultPrivatePageName, 'A', 'C'], 'C');

    // The first page
    await deletePage(user, defaultPrivatePageName, privateSection);
    expectPages(['A', 'C'], 'C');

    // A page after the selected one: selection doesn't move
    await user.click(getPageButtons(privateSection)[0]);
    await deletePage(user, 'C', privateSection);
    expectPages(['A'], 'A');

    // One page remaining so it can no longer be deleted
    const dialog = await openEditPageDialog(user, 'A', privateSection);
    expect(
      within(dialog).queryByRole('button', { name: commonText.remove() })
    ).not.toBeInTheDocument();
  });

  test('deleting Private pages while a Shared page is open keeps it open', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    for (const name of ['A', 'B']) await addPage(user, name, privateSection);
    const sharedLayout = getSharedLayout();
    await user.click(getPageButtons(statsText.shared())[0]);

    await deletePage(user, 'A', privateSection);
    await deletePage(user, 'B', privateSection);

    expect(getPageNames(privateSection)).toEqual([defaultPrivatePageName]);
    expect(getCurrentPageName()).toBe(defaultSharedPageName);
    expect(getCurrentPageName(privateSection)).toBeUndefined();
    expect(getSharedLayout()).toEqual(sharedLayout);
  });
});
