import { f } from '../../../utils/functools';
import type { RA } from '../../../utils/types';
import { formatNumber } from '../../Atoms/Internationalization';
import { MINUTE } from '../../Atoms/timeUnits';
import {
  applyRefreshLayout,
  applyStatBackendResponse,
  getBackendUrlToFetch,
  getDynamicQuerySpecsToFetch,
  resolveStatsSpec,
  setLayoutUndefined,
} from '../hooks';
import {
  backEndStatsSpec,
  defaultLayoutGenerated,
  dynamicStatsSpec,
  generateDefaultLayout,
  statsSpec,
} from '../StatsSpec';
import type { CustomStat, DefaultStat, StatLayout } from '../types';
import { defaultLayoutTest, statsSpecTest } from './layout.tests';

const allItems = (layout: RA<StatLayout>): RA<CustomStat | DefaultStat> =>
  layout.flatMap(({ categories }) => categories.flatMap(({ items }) => items));

describe('generateDefaultLayout', () => {
  test('creates one page per stats source, in spec order', () => {
    expect(defaultLayoutTest.map(({ label }) => label)).toEqual(
      Object.values(statsSpecTest).map(({ sourceLabel }) => sourceLabel)
    );
  });

  test('creates one category per spec category, in spec order', () => {
    Object.values(statsSpecTest).forEach(({ categories }, pageIndex) =>
      expect(
        defaultLayoutTest[pageIndex].categories.map(({ label }) => label)
      ).toEqual(Object.values(categories).map(({ label }) => label))
    );
  });

  test('a fresh layout has no values and has never been updated', () => {
    defaultLayoutTest.forEach((page) =>
      expect(page.lastUpdated).toBeUndefined()
    );
    allItems(defaultLayoutTest).forEach((item) =>
      expect(item.itemValue).toBeUndefined()
    );
  });

  test('maps spec items to DefaultStat items', () => {
    expect(defaultLayoutTest[0].categories[2].items).toEqual([
      {
        type: 'DefaultStat',
        pageName: 'collection',
        categoryName: 'locality_geography',
        itemName: 'countries',
        label: statsSpecTest.collection.categories.locality_geography.items
          .countries.label,
        itemValue: undefined,
        itemType: 'BackEndStat',
        pathToValue: 'countries',
      },
    ]);
  });

  test('only BackEndStat items carry a pathToValue', () => {
    allItems(defaultLayoutTest).forEach((item) => {
      if (item.type === 'DefaultStat' && item.itemType !== 'BackEndStat')
        expect(item.pathToValue).toBeUndefined();
    });
  });

  test('an empty spec produces an empty layout', () => {
    expect(generateDefaultLayout({})).toEqual([]);
  });
});

describe('defaultLayoutGenerated (used when no layout preference exists)', () => {
  test('has a shared page and a personal page', () => {
    expect(defaultLayoutGenerated).toHaveLength(2);
    expect(defaultLayoutGenerated[0].label).toBe(
      statsSpec.collection.sourceLabel
    );
    expect(defaultLayoutGenerated[1].label).toBe(statsSpec.user.sourceLabel);
  });

  test('every page has at least one category and every category has items', () => {
    defaultLayoutGenerated.forEach(({ categories }) => {
      expect(categories.length).toBeGreaterThan(0);
      categories.forEach(({ items }) =>
        expect(items.length).toBeGreaterThan(0)
      );
    });
  });

  test('starts with no values and no lastUpdated', () => {
    defaultLayoutGenerated.forEach((page) =>
      expect(page.lastUpdated).toBeUndefined()
    );
    allItems(defaultLayoutGenerated).forEach((item) =>
      expect(item.itemValue).toBeUndefined()
    );
  });

  test('contains only DefaultStat items', () => {
    allItems(defaultLayoutGenerated).forEach((item) =>
      expect(item.type).toBe('DefaultStat')
    );
  });

  test('every non-dynamic default item resolves to a fetchable spec', () => {
    allItems(defaultLayoutGenerated)
      .filter(
        (item): item is DefaultStat =>
          item.type === 'DefaultStat' && item.itemType !== 'DynamicStat'
      )
      .forEach((item) =>
        expect(
          resolveStatsSpec(item, { showPreparationsTotal: true })
        ).toBeDefined()
      );
  });
});

describe('fetches needed on initial load', () => {
  test('requests every backend category on the default shared page', () => {
    const sharedPage = [defaultLayoutGenerated[0]];
    expect(getBackendUrlToFetch(sharedPage)).toEqual(
      backEndStatsSpec
        .map(({ responseKey }) => responseKey)
        .filter((key) => key.startsWith('/stats/collection/'))
        .filter((key) => !key.startsWith('/stats/collection/user/'))
    );
  });

  test('requests each backend category only once', () => {
    const urls = getBackendUrlToFetch([
      ...defaultLayoutGenerated,
      ...defaultLayoutGenerated,
    ]);
    expect(urls).toEqual(Array.from(new Set(urls)));
  });

  test('every requested backend URL is known to the backend stats spec', () => {
    const knownKeys = backEndStatsSpec.map(({ responseKey }) => responseKey);
    getBackendUrlToFetch(defaultLayoutGenerated).forEach((url) =>
      expect(knownKeys).toContain(url)
    );
  });

  test('runs every dynamic query in the default layout', () => {
    expect(
      getDynamicQuerySpecsToFetch(defaultLayoutGenerated).map(({ key }) => key)
    ).toEqual(dynamicStatsSpec.map(({ responseKey }) => responseKey));
  });

  test('the test fixture requests its two backend categories', () => {
    expect(getBackendUrlToFetch(defaultLayoutTest)).toEqual([
      '/stats/collection/preparations/',
      '/stats/collection/type_specimens/',
    ]);
  });

  test('the test fixture has no dynamic queries', () => {
    expect(getDynamicQuerySpecsToFetch(defaultLayoutTest)).toEqual([]);
  });
});

describe('applying the initial backend responses', () => {
  const typeSpecimensUrl = '/stats/collection/type_specimens/';
  const preparationsUrl = '/stats/collection/preparations/';
  const response = {
    [typeSpecimensUrl]: { Holotype: 19, Neotype: 1 },
    [preparationsUrl]: { EtOH: { lots: 176, total: 985 } },
  };
  const numberFormatter = (raw: number | undefined): string | undefined =>
    f.maybe(raw, formatNumber);
  const prepFormatter = (
    raw: { readonly lots: number; readonly total: number } | undefined
  ): string | undefined =>
    raw === undefined
      ? undefined
      : `${formatNumber(raw.lots)} / ${formatNumber(raw.total)}`;

  const loadedLayout: RA<StatLayout> = defaultLayoutTest.map((page) => ({
    ...page,
    categories: page.categories.map((category) => ({
      ...category,
      items: applyStatBackendResponse(
        response,
        applyStatBackendResponse(
          response,
          category.items,
          typeSpecimensUrl,
          numberFormatter,
          statsSpecTest
        ),
        preparationsUrl,
        prepFormatter,
        statsSpecTest
      ),
    })),
  }));

  test('expands phantom items into one item per response key', () => {
    expect(
      loadedLayout[0].categories[3].items.map(({ label }) => label)
    ).toEqual(['Holotype', 'Neotype']);
    expect(
      loadedLayout[0].categories[1].items.map(({ itemValue }) => itemValue)
    ).toEqual(['176 / 985']);
  });

  test('does not touch categories without a phantom item', () => {
    expect(loadedLayout[0].categories[0]).toEqual(
      defaultLayoutTest[0].categories[0]
    );
    expect(loadedLayout[0].categories[2]).toEqual(
      defaultLayoutTest[0].categories[2]
    );
    expect(loadedLayout[1]).toEqual(defaultLayoutTest[1]);
  });

  test('loaded categories are not requested again', () => {
    expect(getBackendUrlToFetch(loadedLayout)).toEqual([]);
  });

  test('an empty backend response leaves the category empty and does not refetch', () => {
    const items = applyStatBackendResponse(
      { [typeSpecimensUrl]: {} },
      defaultLayoutTest[0].categories[3].items,
      typeSpecimensUrl,
      numberFormatter,
      statsSpecTest
    );
    expect(items).toEqual([]);
    expect(
      getBackendUrlToFetch([
        {
          ...defaultLayoutTest[0],
          categories: [{ label: 'Type specimens', items }],
        },
      ])
    ).toEqual([]);
  });
});

describe('setLayoutUndefined', () => {
  const loadedPage: StatLayout = {
    label: 'Page',
    lastUpdated: '2026-01-01T00:00:00.000Z',
    categories: [
      {
        label: 'Category',
        items: [
          {
            ...(defaultLayoutTest[0].categories[0].items[0] as DefaultStat),
            itemValue: 5,
          },
          {
            type: 'CustomStat',
            label: 'Custom',
            querySpec: { tableName: 'CollectionObject', fields: [] },
            itemValue: '10',
          },
        ],
      },
    ],
  };

  test('clears every value and lastUpdated', () => {
    const cleared = setLayoutUndefined(loadedPage);
    expect(cleared.lastUpdated).toBeUndefined();
    allItems([cleared]).forEach((item) =>
      expect(item.itemValue).toBeUndefined()
    );
  });

  test('keeps labels and item definitions', () => {
    const cleared = setLayoutUndefined(loadedPage);
    expect(cleared.label).toBe(loadedPage.label);
    expect(cleared.categories[0].label).toBe('Category');
    expect(cleared.categories[0].items.map(({ type }) => type)).toEqual([
      'DefaultStat',
      'CustomStat',
    ]);
  });
});

describe('applyRefreshLayout', () => {
  const now = new Date('2026-06-01T12:00:00.000Z').valueOf();
  const page = (lastUpdated: string | undefined): StatLayout => ({
    label: 'Page',
    lastUpdated,
    categories: [
      {
        label: 'Category',
        items: [
          {
            ...(defaultLayoutTest[0].categories[0].items[0] as DefaultStat),
            itemValue: 5,
          },
        ],
      },
    ],
  });

  beforeEach(() => jest.spyOn(Date, 'now').mockReturnValue(now));
  afterEach(() => jest.restoreAllMocks());

  test('returns undefined when there is no layout yet', () => {
    expect(applyRefreshLayout(undefined, 24)).toBeUndefined();
  });

  test('leaves never-updated pages alone', () => {
    const layout = [page(undefined)];
    expect(applyRefreshLayout(layout, 24)).toEqual(layout);
  });

  test('leaves pages with an unparsable lastUpdated alone', () => {
    const layout = [page('not a date')];
    expect(applyRefreshLayout(layout, 24)).toEqual(layout);
  });

  test('keeps pages newer than the refresh rate', () => {
    const layout = [page(new Date(now - 10 * MINUTE).toISOString())];
    expect(applyRefreshLayout(layout, 24)).toEqual(layout);
  });

  test('clears pages at or past the refresh rate', () => {
    const layout = [page(new Date(now - 24 * MINUTE).toISOString())];
    expect(applyRefreshLayout(layout, 24)).toEqual([
      setLayoutUndefined(layout[0]),
    ]);
  });

  test('leaves pages with a lastUpdated in the future alone', () => {
    const layout = [page(new Date(now + MINUTE).toISOString())];
    expect(applyRefreshLayout(layout, 24)).toEqual(layout);
  });

  test('handles each page independently', () => {
    const stale = page(new Date(now - 60 * MINUTE).toISOString());
    const fresh = page(new Date(now - MINUTE).toISOString());
    expect(applyRefreshLayout([stale, fresh], 24)).toEqual([
      setLayoutUndefined(stale),
      fresh,
    ]);
  });
});
