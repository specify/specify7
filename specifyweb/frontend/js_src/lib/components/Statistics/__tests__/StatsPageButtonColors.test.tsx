import { act, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { commonText } from '../../../localization/common';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import type { IR, RA } from '../../../utils/types';
import { SetCssVariables } from '../../Preferences/ApplyPreferences';
import { userPreferences } from '../../Preferences/userPreferences';
import {
  addPageWithCategory,
  addSharedPage,
  enterEditMode,
  getPageButtons,
  openChooseStatisticsDialog,
  mockSavedQueries,
  mockStatsRequests,
  openEditPageDialog,
  renderEmptyStatsPage,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();
mockSavedQueries();

const colorClass = (variable: string): string =>
  `bg-[color:var(--${variable}-button-color)]`;

const getButton = (
  name: string,
  container: HTMLElement = document.body
): HTMLElement =>
  within(container)
    .getAllByRole('button', { name })
    .find(
      (button) =>
        (button.textContent || (button as HTMLInputElement).value) === name
    )!;

const lightColors = {
  saveButtonColor: '#eeeeee',
  secondaryButtonColor: '#dddddd',
  secondaryLightButtonColor: '#cccccc',
  dangerButtonColor: '#bbbbbb',
  infoButtonColor: '#aaaaaa',
};

const darkColors = {
  saveButtonColor: '#111111',
  secondaryButtonColor: '#222222',
  secondaryLightButtonColor: '#333333',
  dangerButtonColor: '#444444',
  infoButtonColor: '#555555',
};

const cssVariables = {
  saveButtonColor: '--save-button-color',
  secondaryButtonColor: '--secondary-button-color',
  secondaryLightButtonColor: '--secondary-light-button-color',
  dangerButtonColor: '--danger-button-color',
  infoButtonColor: '--info-button-color',
} as const;

const setButtonPreferences = (
  theme: 'dark' | 'light',
  colors: IR<string> = {}
): void =>
  userPreferences.setRaw({
    general: {
      ui: { theme },
      buttonLight: theme === 'light' ? colors : {},
      buttonDark: theme === 'dark' ? colors : {},
    },
  } as never);

const expectCssVariables = async (colors: IR<string>): Promise<void> =>
  waitFor(() =>
    Object.entries(colors).forEach(([key, color]) =>
      expect(
        document.body.style.getPropertyValue(
          cssVariables[key as keyof typeof cssVariables]
        )
      ).toBe(color)
    )
  );

async function renderStatsPageWithPreferences() {
  mount(<SetCssVariables />);
  return renderEmptyStatsPage();
}

const originalPreferences = userPreferences.getRaw();
afterEach(() => {
  userPreferences.setRaw(originalPreferences);
  document.body.removeAttribute('style');
  document.body.classList.remove('dark');
});

describe('Statistics buttons use the button color preferences', () => {
  test('header buttons use the secondary button color', async () => {
    await renderEmptyStatsPage();

    [
      statsText.refresh(),
      statsText.downloadAsTSV(),
      commonText.edit(),
    ].forEach((name) =>
      expect(getButton(name)).toHaveClass(colorClass('secondary'))
    );
  });

  test('Save uses the save color and Cancel the secondary color', async () => {
    const { user } = await renderEmptyStatsPage();
    await enterEditMode(user);

    expect(getButton(commonText.save())).toHaveClass(colorClass('save'));
    expect(getButton(commonText.cancel())).toHaveClass(
      colorClass('secondary')
    );
  });

  test('page buttons use the secondary colors unless they are open', async () => {
    await renderEmptyStatsPage();
    const [openPage] = getPageButtons(statsText.shared());
    const [closedPage] = getPageButtons(statsText.private());

    expect(closedPage).toHaveClass(colorClass('secondary'));
    expect(closedPage.className).toContain(
      `dark:bg-[color:var(--secondary-light-button-color)]`
    );
    expect(openPage).toHaveAttribute('aria-current', 'page');
    expect(openPage).toHaveClass('!bg-brand-400');
  });

  test('page dialog uses the save and secondary colors', async () => {
    const { user } = await renderEmptyStatsPage();
    await addSharedPage(user, 'Second Page');
    const dialog = await openEditPageDialog(user, 'Second Page');

    expect(getButton(commonText.save(), dialog)).toHaveClass(
      colorClass('save')
    );
    [commonText.remove(), commonText.close()].forEach((name) =>
      expect(getButton(name, dialog)).toHaveClass(colorClass('secondary'))
    );
  });

  test('deleting a category uses the danger color', async () => {
    const { user } = await renderEmptyStatsPage();
    await enterEditMode(user);
    const [deleteCategory] = screen.getAllByRole('button', {
      name: statsText.deleteCategory(),
    });
    expect(deleteCategory).toHaveClass(colorClass('secondary'));

    await user.click(deleteCategory);
    const dialog = screen.getByRole('dialog');
    expect(getButton(commonText.delete(), dialog)).toHaveClass(
      colorClass('danger')
    );
  });

  test('"New" statistic uses the info color', async () => {
    const { user } = await renderEmptyStatsPage();
    await addPageWithCategory(user);
    const dialog = await openChooseStatisticsDialog(user);

    expect(getButton(commonText.new(), dialog)).toHaveClass(colorClass('info'));
  });
});

describe('Button color preferences are applied on the Statistics page', () => {
  test('uses the default light colors when none are customized', async () => {
    setButtonPreferences('light');
    await renderStatsPageWithPreferences();

    await expectCssVariables(
      Object.fromEntries(
        (Object.keys(cssVariables) as RA<keyof typeof cssVariables>).map(
          (key) => [
            key,
            userPreferences.definition('general', 'buttonLight', key)
              .defaultValue,
          ]
        )
      )
    );
  });

  test('applies custom light mode colors', async () => {
    setButtonPreferences('light', lightColors);
    await renderStatsPageWithPreferences();

    expect(document.body).not.toHaveClass('dark');
    await expectCssVariables(lightColors);
  });

  test('applies custom dark mode colors, not the light ones', async () => {
    setButtonPreferences('dark', darkColors);
    await renderStatsPageWithPreferences();

    await waitFor(() => expect(document.body).toHaveClass('dark'));
    await expectCssVariables(darkColors);
  });

  test('changing a color while the page is open updates it', async () => {
    setButtonPreferences('light', lightColors);
    await renderStatsPageWithPreferences();
    await expectCssVariables(lightColors);

    const updatedColors = { ...lightColors, saveButtonColor: '#123456' };
    act(() => setButtonPreferences('light', updatedColors));

    await expectCssVariables(updatedColors);
    expect(getButton(statsText.refresh())).toHaveClass(colorClass('secondary'));
  });
});
