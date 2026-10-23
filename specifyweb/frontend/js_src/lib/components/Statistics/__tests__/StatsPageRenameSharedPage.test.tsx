import { screen, within } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import { defaultLayoutGenerated } from '../StatsSpec';
import {
  addSharedPage,
  getCurrentPageName,
  getPageNames,
  mockStatsRequests,
  openEditPageDialog,
  renderEmptyStatsPage,
  type User,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();

const defaultPageName = defaultLayoutGenerated[0].label;
const newName = 'Renamed Page';

async function renameSharedPage(
  user: User,
  pageName: string,
  name: string
): Promise<void> {
  const dialog = await openEditPageDialog(user, pageName);
  const input = within(dialog).getByRole('textbox');
  await user.clear(input);
  await user.type(input, name);
  await user.click(
    within(dialog).getByRole('button', { name: commonText.save() })
  );
}

describe('Renaming a Shared page with the pencil icon', () => {
  test('the pencil opens "Edit Page" with the current name', async () => {
    const { user } = await renderEmptyStatsPage();
    const dialog = await openEditPageDialog(user, defaultPageName);
    expect(within(dialog).getByRole('textbox')).toHaveValue(defaultPageName);
  });

  test('saving renames the page and keeps its content', async () => {
    const { user, sharedLayout, getSharedLayout, getPersonalLayout } =
      await renderEmptyStatsPage();
    const personalLayout = getPersonalLayout();
    await renameSharedPage(user, defaultPageName, newName);

    expect(
      screen.queryByRole('dialog', { name: statsText.editPage() })
    ).not.toBeInTheDocument();
    expect(getPageNames(statsText.shared())).toEqual([newName]);
    expect(getCurrentPageName()).toBe(newName);
    expect(getSharedLayout()).toEqual([{ ...sharedLayout[0], label: newName }]);
    expect(getPersonalLayout()).toEqual(personalLayout);
  });

  test('renaming another page keeps the order and selected page', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    for (const name of ['A', 'B']) await addSharedPage(user, name);
    await renameSharedPage(user, 'A', newName);

    expect(getPageNames(statsText.shared())).toEqual([
      defaultPageName,
      newName,
      'B',
    ]);
    expect(getSharedLayout()?.map(({ label }) => label)).toEqual([
      defaultPageName,
      newName,
      'B',
    ]);
    expect(getCurrentPageName()).toBe('B');
  });

  test('closing the dialog keeps the old name', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    const dialog = await openEditPageDialog(user, defaultPageName);
    const input = within(dialog).getByRole('textbox');
    await user.clear(input);
    await user.type(input, newName);
    await user.click(
      within(dialog).getByRole('button', { name: commonText.close() })
    );

    expect(getPageNames(statsText.shared())).toEqual([defaultPageName]);
    expect(getSharedLayout()?.[0].label).toBe(defaultPageName);
  });
});
