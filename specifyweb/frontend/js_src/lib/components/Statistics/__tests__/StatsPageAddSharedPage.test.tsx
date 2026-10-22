import { screen, within } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import { defaultLayoutGenerated } from '../StatsSpec';
import {
  addSharedPage,
  getPageButtons,
  getPageNames,
  mockStatsRequests,
  openAddPageDialog,
  renderEmptyStatsPage,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();

const defaultPageName = defaultLayoutGenerated[0].label;
const newPageName = 'My Shared Page';

describe('Adding a new Shared page', () => {
  test('"+" opens an empty "Add Page" dialog', async () => {
    const { user } = await renderEmptyStatsPage();
    const dialog = await openAddPageDialog(user);
    expect(within(dialog).getByRole('textbox')).toHaveValue('');
  });

  test('adds an empty page to the end of Shared and opens it', async () => {
    const { user, getSharedLayout, getPersonalLayout } =
      await renderEmptyStatsPage();
    const personalLayout = getPersonalLayout();
    await addSharedPage(user, newPageName);

    expect(
      screen.queryByRole('dialog', { name: statsText.addPage() })
    ).not.toBeInTheDocument();
    expect(getPageNames(statsText.shared())).toEqual([
      defaultPageName,
      newPageName,
    ]);
    expect(getPageButtons(statsText.shared())[1]).toHaveAttribute(
      'aria-current',
      'page'
    );

    expect(getSharedLayout()?.[1]).toMatchObject({
      label: newPageName,
      categories: [],
    });
    defaultLayoutGenerated[0].categories.forEach(({ label }) =>
      expect(
        screen.queryByRole('heading', { name: label })
      ).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole('button', { name: statsText.addACategory() })
    ).toBeInTheDocument();

    expect(getPersonalLayout()).toEqual(personalLayout);
  });

  test('Cancel discards the new page and reopens the last existing page', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    await addSharedPage(user, newPageName);
    await user.click(screen.getByRole('button', { name: commonText.cancel() }));

    expect(getSharedLayout()?.map(({ label }) => label)).toEqual([
      defaultPageName,
    ]);
    expect(getPageNames(statsText.shared())).toEqual([defaultPageName]);
    expect(getPageButtons(statsText.shared())[0]).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('closing the dialog does not add a page', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    const dialog = await openAddPageDialog(user);
    await user.type(within(dialog).getByRole('textbox'), newPageName);
    await user.click(
      within(dialog).getByRole('button', { name: commonText.close() })
    );

    expect(getSharedLayout()).toHaveLength(1);
    expect(getPageNames(statsText.shared())).toEqual([defaultPageName]);
  });
});

describe('Adding multiple Shared pages', () => {
  const newPageNames = ['First Page', 'Second Page', 'Third Page'];

  test('adds each page to the end of Shared and opens the newest one', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();

    for (const [index, name] of newPageNames.entries()) {
      await addSharedPage(user, name);
      const expectedNames = [
        defaultPageName,
        ...newPageNames.slice(0, index + 1),
      ];
      expect(getPageNames(statsText.shared())).toEqual(expectedNames);
      expect(getSharedLayout()?.map(({ label }) => label)).toEqual(
        expectedNames
      );

      const pages = getPageButtons(statsText.shared());
      expect(pages.at(-1)).toHaveAttribute('aria-current', 'page');
      pages
        .slice(0, -1)
        .forEach((page) => expect(page).not.toHaveAttribute('aria-current'));
    }

    getSharedLayout()!
      .slice(1)
      .forEach((page) => expect(page.categories).toEqual([]));
  });

  test('Cancel discards every page added in the edit session', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    for (const name of newPageNames) await addSharedPage(user, name);
    await user.click(screen.getByRole('button', { name: commonText.cancel() }));

    expect(getSharedLayout()?.map(({ label }) => label)).toEqual([
      defaultPageName,
    ]);
    expect(getPageNames(statsText.shared())).toEqual([defaultPageName]);
    expect(getPageButtons(statsText.shared())[0]).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});
