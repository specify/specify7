import { screen, within } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import { defaultLayoutGenerated } from '../StatsSpec';
import {
  addPage,
  addSharedPage,
  deletePage,
  getCurrentPageName,
  getPageButtons,
  getPageNames,
  mockStatsRequests,
  openAddPageDialog,
  openEditPageDialog,
  renderEmptyStatsPage,
  type User,
  waitForInitialLoad,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();

const defaultPageName = defaultLayoutGenerated[0].label;
const privateSection = statsText.private();
const defaultPrivatePageName = defaultLayoutGenerated[1].label;

describe('Adding a new Shared page', () => {
  const newPageName = 'My Shared Page';

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

/**
 * jsdom doesn't understand layout, so this can't check how a long name
 * actually looks. It checks that the full name is kept and that the page
 * button keeps the classes that cap its width and scroll overflowing text.
 */

const longNames = {
  'with spaces': 'A very long statistics page name '.repeat(5).trim(),
  'without spaces': 'X'.repeat(200),
};

describe('Adding a Shared page with a long name', () => {
  test.each(Object.entries(longNames))(
    'keeps the full name (%s)',
    async (_, name) => {
      const { user, getSharedLayout } = await renderEmptyStatsPage();
      await addSharedPage(user, name);

      expect(getPageNames(statsText.shared()).at(-1)).toBe(name);
      expect(getSharedLayout()?.at(-1)?.label).toBe(name);

      const dialog = await openEditPageDialog(user, name);
      expect(within(dialog).getByRole('textbox')).toHaveValue(name);
    }
  );

  test('the page button caps its width and scrolls overflowing text', async () => {
    const { user } = await renderEmptyStatsPage();
    await addSharedPage(user, longNames['without spaces']);

    expect(getPageButtons(statsText.shared()).at(-1)).toHaveClass(
      'max-w-xs',
      'overflow-x-auto'
    );
  });
});

describe('Adding a new Private page', () => {
  const newPageName = 'My Private Page';

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

describe('Deleting Private pages', () => {
  const defaultSharedPageName = defaultLayoutGenerated[0].label;

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
