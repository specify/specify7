import { screen, waitFor, within } from '@testing-library/react';
import { statsText } from '../../../localization/stats';
import { userText } from '../../../localization/user';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { Http } from '../../../utils/ajax/definitions';
import type { RA } from '../../../utils/types';
import { downloadFile } from '../../Molecules/FilePicker';
import { defaultLayoutGenerated } from '../StatsSpec';
import type { StatLayout } from '../types';
import {
  addPage,
  addPageWithCategory,
  enterEditMode,
  findDefaultStat,
  getCategoryInputs,
  getPageButtons,
  mockStatsRequests,
  renderEmptyStatsPage,
  type User,
} from './statsPageTestUtils';

const mockDeniedTables = new Set<string>();

jest.mock('../../Molecules/FilePicker', () => ({
  ...jest.requireActual('../../Molecules/FilePicker'),
  downloadFile: jest.fn(async () => undefined),
}));

jest.mock('../../Permissions/helpers', () => {
  const actual = jest.requireActual('../../Permissions/helpers');
  return {
    ...actual,
    hasTablePermission: (tableName: string, ...rest: RA<unknown>) =>
      !mockDeniedTables.has(tableName) &&
      actual.hasTablePermission(tableName, ...rest),
  };
});

requireContext();
mockStatsRequests();

const header = [
  statsText.categoryName(),
  statsText.itemName(),
  statsText.itemValue(),
].join('\t');

async function downloadTsv(user: User): Promise<RA<string>> {
  jest.mocked(downloadFile).mockClear();
  await user.click(
    screen.getByRole('button', { name: statsText.downloadAsTSV() })
  );
  expect(downloadFile).toHaveBeenCalledTimes(1);
  return (jest.mocked(downloadFile).mock.calls[0][1] as string).split('\n');
}

async function downloadFileName(user: User): Promise<string> {
  jest.mocked(downloadFile).mockClear();
  await user.click(
    screen.getByRole('button', { name: statsText.downloadAsTSV() })
  );
  expect(downloadFile).toHaveBeenCalledTimes(1);
  return jest.mocked(downloadFile).mock.calls[0][0];
}

const escapeRegExp = (value: string): string =>
  value.replaceAll(/[$()*+.?[\\\]^{|}]/gu, String.raw`\$&`);

const fileNamePattern = (section: string, page: string): RegExp =>
  new RegExp(
    `^Specify 7 Statistics ${escapeRegExp(section)} ${escapeRegExp(
      page
    )} \\w{3} \\w{3} \\d{2} \\d{4} \\d{2}:\\d{2}:\\d{2}\\.tsv$`,
    'u'
  );

const getStatButton = (label: string): HTMLElement =>
  screen
    .getAllByRole('button')
    .find((button) => button.firstElementChild?.textContent === label)!;

const hasRowFor = (lines: RA<string>, label: string): boolean =>
  lines.some((line) => line.split('\t')[1] === label);

const rowsFor = (page: StatLayout): RA<string> =>
  page.categories.flatMap(({ label, items }) =>
    items
      .filter(({ itemValue }) => itemValue !== undefined)
      .map((item) => [label, item.label, item.itemValue].join('\t'))
  );

describe('Downloading the statistics as a TSV', () => {
  test('exports one row per loaded statistic on the open page', async () => {
    const { user, sharedLayout } = await renderEmptyStatsPage();
    const lines = await downloadTsv(user);

    expect(lines[0]).toBe(header);
    expect(lines.slice(1)).toEqual(rowsFor(sharedLayout[0]));
    expect(lines).toContain(
      `${sharedLayout[0].categories[1].label}\tC&S\t826 / 430`
    );
  });

  test('skips empty categories', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    await enterEditMode(user);
    await user.click(
      screen.getByRole('button', { name: statsText.addACategory() })
    );
    await user.type(getCategoryInputs().at(-1)!, 'Empty Category');
    const lines = await downloadTsv(user);

    expect(getSharedLayout()![0].categories.at(-1)?.label).toBe(
      'Empty Category'
    );
    expect(lines.some((line) => line.startsWith('Empty Category\t'))).toBe(
      false
    );
    expect(lines.slice(1)).toEqual(rowsFor(getSharedLayout()![0]));
  });

  test('a page with only an empty category exports just the header', async () => {
    const { user } = await renderEmptyStatsPage();
    await addPageWithCategory(user);

    expect(await downloadTsv(user)).toEqual([header]);
  });
});

describe('The downloaded TSV file name', () => {
  const sharedSection = statsText.shared();
  const privateSection = statsText.private();

  test('includes the Shared section and the open page name', async () => {
    const { user } = await renderEmptyStatsPage();

    expect(await downloadFileName(user)).toMatch(
      fileNamePattern(sharedSection, defaultLayoutGenerated[0].label)
    );
  });

  test('includes the Private section and the open page name', async () => {
    const { user } = await renderEmptyStatsPage();
    await user.click(getPageButtons(privateSection)[0]);

    expect(await downloadFileName(user)).toMatch(
      fileNamePattern(privateSection, defaultLayoutGenerated[1].label)
    );
  });

  test.each([
    ['Shared', sharedSection],
    ['Private', privateSection],
  ])('reflects a newly added %s page', async (_, section) => {
    const { user } = await renderEmptyStatsPage();
    const pageName = 'Herbarium (2026) Summary';
    await addPage(user, pageName, section);

    const fileName = await downloadFileName(user);
    expect(fileName).toMatch(fileNamePattern(section, pageName));
    expect(fileName).not.toContain(defaultLayoutGenerated[0].label);
    expect(fileName).not.toContain(defaultLayoutGenerated[1].label);
  });
});

describe('Exporting statistics shown with NO PERMISSION', () => {
  const deniedStats = [
    findDefaultStat('loans', 'openLoansCount'),
    findDefaultStat('loans', 'overdueLoansCount'),
  ];

  beforeAll(() => mockDeniedTables.add('Loan'));
  afterAll(() => mockDeniedTables.clear());

  test('query stats on tables the user cannot read are skipped', async () => {
    const { user, sharedLayout } = await renderEmptyStatsPage();
    deniedStats.forEach(({ label }) =>
      expect(
        within(getStatButton(label)).getByText(userText.noPermission())
      ).toBeInTheDocument()
    );
    const lines = await downloadTsv(user);

    deniedStats.forEach(({ label }) =>
      expect(hasRowFor(lines, label)).toBe(false)
    );
    expect(lines.slice(1)).toEqual(rowsFor(sharedLayout[0]));
  });
});

describe('Exporting backend statistics the user is forbidden to see', () => {
  overrideAjax(
    '/stats/collection/locality_geography/percentGeoReferenced/',
    {},
    { responseCode: Http.FORBIDDEN },
    true
  );

  test('backend stats that return 403 are skipped', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    const { label } = findDefaultStat(
      'locality_geography',
      'percentGeoReferenced'
    );
    await waitFor(() =>
      expect(
        within(getStatButton(label)).getByText(userText.noPermission())
      ).toBeInTheDocument()
    );
    const lines = await downloadTsv(user);

    expect(hasRowFor(lines, label)).toBe(false);
    expect(lines.slice(1)).toEqual(rowsFor(getSharedLayout()![0]));
  });
});
