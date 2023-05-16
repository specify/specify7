import { theories } from '../../../tests/utils';
import { f } from '../../../utils/functools';
import type { RA } from '../../../utils/types';
import { formatNumber } from '../../Atoms/Internationalization';
import {
  applyStatBackendResponse,
  generateStatUrl,
  getDefaultLayoutFlagged,
  getDynamicCategoriesToFetch,
  getOffsetOne,
} from '../hooks';
import type { StatLayout } from '../types';
import { defaultLayoutTest, statsSpecTest } from './layout.tests';

const backEndResponse = {
  '/stats/collection/preparations/': {
    'C&S': {
      lots: 826,
      total: 430,
    },
    EtOH: {
      lots: 176,
      total: 985,
    },
    'X-Ray': {
      lots: 460,
      total: 460,
    },
  },
  '/stats/collection/type_specimens/': {
    Holotype: 19,
    Neotype: 1,
  },
};

// Applying Backend stat response tests
theories(applyStatBackendResponse, [
  {
    in: [
      backEndResponse,
      defaultLayoutTest[0].categories[3].items,
      '/stats/collection/type_specimens/',
      (rawNumber: number | undefined) => f.maybe(rawNumber, formatNumber),
      statsSpecTest,
    ],
    out: [
      {
        type: 'DefaultStat',
        itemType: 'BackEndStat',
        pageName: 'collection',
        categoryName: 'type_specimens',
        itemName: 'phantomItem',
        label: 'Holotype',
        itemValue: '19',
        pathToValue: 'Holotype',
      },
      {
        type: 'DefaultStat',
        itemType: 'BackEndStat',
        pageName: 'collection',
        categoryName: 'type_specimens',
        itemName: 'phantomItem',
        label: 'Neotype',
        itemValue: '1',
        pathToValue: 'Neotype',
      },
    ],
  },
  {
    in: [
      backEndResponse,
      defaultLayoutTest[0].categories[1].items,
      '/stats/collection/preparations/',
      (
        prep:
          | {
              readonly lots: number;
              readonly total: number;
            }
          | undefined
      ) =>
        prep === undefined
          ? undefined
          : `${formatNumber(prep.lots)} / ${formatNumber(prep.total)}`,
      statsSpecTest,
    ],
    out: [
      {
        type: 'DefaultStat',
        itemType: 'BackEndStat',
        pageName: 'collection',
        categoryName: 'preparations',
        itemName: 'phantomItem',
        label: 'C&S',
        itemValue: '826 / 430',
        pathToValue: 'C&S',
      },
      {
        type: 'DefaultStat',
        itemType: 'BackEndStat',
        pageName: 'collection',
        categoryName: 'preparations',
        itemName: 'phantomItem',
        label: 'EtOH',
        itemValue: '176 / 985',
        pathToValue: 'EtOH',
      },
      {
        type: 'DefaultStat',
        itemType: 'BackEndStat',
        pageName: 'collection',
        categoryName: 'preparations',
        itemName: 'phantomItem',
        label: 'X-Ray',
        itemValue: '460 / 460',
        pathToValue: 'X-Ray',
      },
    ],
  },
  {
    in: [
      backEndResponse,
      defaultLayoutTest[0].categories[0].items,
      '/stats/collection/type_specimens/',
      (rawNumber: number | undefined) => f.maybe(rawNumber, formatNumber),
      statsSpecTest,
    ],
    out: defaultLayoutTest[0].categories[0].items,
  },
  {
    in: [
      backEndResponse,
      defaultLayoutTest[0].categories[1].items,
      '/stats/collection/type_specimens/',
      (rawNumber: number | undefined) => f.maybe(rawNumber, formatNumber),
      statsSpecTest,
    ],
    out: defaultLayoutTest[0].categories[1].items,
  },
]);

// Test for Get base offset
theories(getOffsetOne, [
  {
    in: [8, 2],
    out: 7,
  },
  {
    in: [8, 7],
    out: 7,
  },
  {
    in: [8, 8],
    out: 7,
  },
  {
    in: [8, 10],
    out: 8,
  },
  {
    in: [1, 20],
    out: 1,
  },
  {
    in: [0, 0],
    out: 0,
  },
]);

function flagDefaultItem(
  index: RA<{
    readonly pageIndex: number;
    readonly categoryIndex: number;
    readonly itemIndex: number;
  }>
): RA<StatLayout> {
  return defaultLayoutTest.map((page, myPageIndex) => ({
    ...page,
    categories: page.categories.map((category, myCategoryIndex) => ({
      ...category,
      items: category.items.map((item, myItemIndex) => ({
        ...item,
        isVisible: index.some(
          ({ pageIndex, categoryIndex, itemIndex }) =>
            pageIndex === myPageIndex &&
            categoryIndex === myCategoryIndex &&
            itemIndex === myItemIndex
        )
          ? false
          : undefined,
      })),
    })),
  }));
}

theories(getDefaultLayoutFlagged, [
  {
    in: [
      { label: '', lastUpdated: undefined, categories: [] },
      defaultLayoutTest,
    ],
    out: flagDefaultItem([]),
  },
  {
    in: [
      {
        label: '',
        lastUpdated: undefined,
        categories: [
          { label: '', items: [defaultLayoutTest[0].categories[0].items[0]] },
        ],
      },
      defaultLayoutTest,
    ],
    out: flagDefaultItem([{ pageIndex: 0, categoryIndex: 0, itemIndex: 0 }]),
  },
  {
    in: [
      {
        label: '',
        lastUpdated: undefined,
        categories: [
          {
            label: '',
            items: [defaultLayoutTest[0].categories[0].items[0]],
          },
          {
            label: '',
            items: [defaultLayoutTest[1].categories[0].items[0]],
          },
        ],
      },
      defaultLayoutTest,
    ],
    out: flagDefaultItem([
      { pageIndex: 0, categoryIndex: 0, itemIndex: 0 },
      { pageIndex: 1, categoryIndex: 0, itemIndex: 0 },
    ]),
  },
  {
    in: [
      {
        label: '',
        lastUpdated: undefined,
        categories: [
          {
            label: '',
            items: [
              defaultLayoutTest[0].categories[2].items[0],
              defaultLayoutTest[0].categories[1].items[0],
            ],
          },
          {
            label: '',
            items: [
              defaultLayoutTest[0].categories[0].items[0],
              defaultLayoutTest[1].categories[0].items[0],
            ],
          },
        ],
      },
      defaultLayoutTest,
    ],
    out: flagDefaultItem([
      { pageIndex: 0, categoryIndex: 0, itemIndex: 0 },
      { pageIndex: 1, categoryIndex: 0, itemIndex: 0 },
      { pageIndex: 0, categoryIndex: 2, itemIndex: 0 },
      { pageIndex: 0, categoryIndex: 1, itemIndex: 0 },
    ]),
  },
]);

theories(getDynamicCategoriesToFetch, [
  {
    in: [defaultLayoutTest],
    out: [
      '/stats/collection/preparations/',
      '/stats/collection/type_specimens/',
    ],
  },
]);

theories(generateStatUrl, [
  {
    in: ['collection', 'holdings', 'loans'],
    out: '/stats/collection/holdings/loans/',
  },
  {
    in: ['collection/user', 'preparations', 'phantomItem'],
    out: '/stats/collection/user/preparations/',
  },
]);
