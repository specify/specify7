import { within } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import { defaultLayoutGenerated } from '../StatsSpec';
import {
  getPageNames,
  mockStatsRequests,
  openAddPageDialog,
  openEditPageDialog,
  renderEmptyStatsPage,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();

const defaultPageName = defaultLayoutGenerated[0].label;

describe("Can't save a Shared page without a name", () => {
  test('adding a page with no name is blocked', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    const dialog = await openAddPageDialog(user);
    const input = within(dialog).getByRole('textbox');
    await user.click(
      within(dialog).getByRole('button', { name: commonText.add() })
    );

    expect(input).toBeInvalid();
    expect(dialog).toBeInTheDocument();
    expect(getSharedLayout()).toHaveLength(1);
    expect(getPageNames(statsText.shared())).toEqual([defaultPageName]);
  });

  test('renaming a page to no name is blocked', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    const dialog = await openEditPageDialog(user, defaultPageName);
    const input = within(dialog).getByRole('textbox');
    await user.clear(input);
    await user.click(
      within(dialog).getByRole('button', { name: commonText.save() })
    );

    expect(input).toBeInvalid();
    expect(dialog).toBeInTheDocument();
    expect(getSharedLayout()?.[0].label).toBe(defaultPageName);
    expect(getPageNames(statsText.shared())).toEqual([defaultPageName]);
  });
});
