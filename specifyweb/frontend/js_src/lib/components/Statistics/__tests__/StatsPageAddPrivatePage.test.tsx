import { screen, within } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import { defaultLayoutGenerated } from '../StatsSpec';
import {
  addPage,
  getCurrentPageName,
  getPageNames,
  mockStatsRequests,
  openAddPageDialog,
  renderEmptyStatsPage,
  waitForInitialLoad,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();

const privateSection = statsText.private();
const defaultPrivatePageName = defaultLayoutGenerated[1].label;
const newPageName = 'My Private Page';

describe('Adding a new Private page', () => {
  test('"+" opens an empty "Add Page" dialog', async () => {
    const { user } = await renderEmptyStatsPage();
    const dialog = await openAddPageDialog(user, privateSection);
    expect(within(dialog).getByRole('textbox')).toHaveValue('');
  });

  test('adds an empty page to the end of Private and opens it', async () => {
    const { user, getSharedLayout, getPersonalLayout } =
      await renderEmptyStatsPage();
    const sharedLayout = getSharedLayout();
    await addPage(user, newPageName, privateSection);

    expect(
      screen.queryByRole('dialog', { name: statsText.addPage() })
    ).not.toBeInTheDocument();
    expect(getPageNames(privateSection)).toEqual([
      defaultPrivatePageName,
      newPageName,
    ]);
    expect(getCurrentPageName(privateSection)).toBe(newPageName);
    expect(getCurrentPageName()).toBeUndefined();

    expect(getPersonalLayout()?.[1]).toMatchObject({
      label: newPageName,
      categories: [],
    });
    expect(
      screen.getByRole('button', { name: statsText.addACategory() })
    ).toBeInTheDocument();

    expect(getSharedLayout()).toEqual(sharedLayout);
  });

  test('Cancel discards the new page and reopens the last existing page', async () => {
    const { user, getPersonalLayout } = await renderEmptyStatsPage();
    await addPage(user, newPageName, privateSection);
    await user.click(screen.getByRole('button', { name: commonText.cancel() }));

    const personalLayout = await waitForInitialLoad(getPersonalLayout);
    expect(personalLayout.map(({ label }) => label)).toEqual([
      defaultPrivatePageName,
    ]);
    expect(getPageNames(privateSection)).toEqual([defaultPrivatePageName]);
    expect(getCurrentPageName(privateSection)).toBe(defaultPrivatePageName);
  });

  test('closing the dialog does not add a page', async () => {
    const { user, getPersonalLayout } = await renderEmptyStatsPage();
    const dialog = await openAddPageDialog(user, privateSection);
    await user.type(within(dialog).getByRole('textbox'), newPageName);
    await user.click(
      within(dialog).getByRole('button', { name: commonText.close() })
    );

    expect(getPersonalLayout()).toHaveLength(1);
    expect(getPageNames(privateSection)).toEqual([defaultPrivatePageName]);
  });
});

describe('Adding multiple Private pages', () => {
  const newPageNames = ['First Page', 'Second Page', 'Third Page'];

  test('adds each page to the end of Private and opens the newest one', async () => {
    const { user, getSharedLayout, getPersonalLayout } =
      await renderEmptyStatsPage();
    const sharedLayout = getSharedLayout();

    for (const [index, name] of newPageNames.entries()) {
      await addPage(user, name, privateSection);
      const expectedNames = [
        defaultPrivatePageName,
        ...newPageNames.slice(0, index + 1),
      ];
      expect(getPageNames(privateSection)).toEqual(expectedNames);
      expect(getPersonalLayout()?.map(({ label }) => label)).toEqual(
        expectedNames
      );
      expect(getCurrentPageName(privateSection)).toBe(name);
    }

    getPersonalLayout()!
      .slice(1)
      .forEach((page) => expect(page.categories).toEqual([]));
    expect(getSharedLayout()).toEqual(sharedLayout);
  });

  test('Cancel discards every page added in the edit session', async () => {
    const { user, getPersonalLayout } = await renderEmptyStatsPage();
    for (const name of newPageNames) await addPage(user, name, privateSection);
    await user.click(screen.getByRole('button', { name: commonText.cancel() }));

    const personalLayout = await waitForInitialLoad(getPersonalLayout);
    expect(personalLayout.map(({ label }) => label)).toEqual([
      defaultPrivatePageName,
    ]);
    expect(getPageNames(privateSection)).toEqual([defaultPrivatePageName]);
    expect(getCurrentPageName(privateSection)).toBe(defaultPrivatePageName);
  });
});
