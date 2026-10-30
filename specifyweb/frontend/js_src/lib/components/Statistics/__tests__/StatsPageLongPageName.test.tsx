/**
 * jsdom doesn't understand layout, so this can't check how a long name 
 * actually looks. It checks that the full name is kept and that the page
 * button keeps the classes that cap its width and scroll overflowing text.
 */

import { within } from '@testing-library/react';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import {
  addSharedPage,
  getPageButtons,
  getPageNames,
  mockStatsRequests,
  openEditPageDialog,
  renderEmptyStatsPage,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();

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
