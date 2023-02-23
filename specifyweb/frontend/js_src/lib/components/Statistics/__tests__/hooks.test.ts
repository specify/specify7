import { theories } from '../../../tests/utils';
import { f } from '../../../utils/functools';
import { formatNumber } from '../../Atoms/Internationalization';
import { applyStatBackendResponse } from '../hooks';
import { defaultLayoutTest, statsSpecTest } from './layout.tests';

const backEndResponse = {
  '/statistics/collection/preparations/': {
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
  '/statistics/collection/type_specimens/': {
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
      '/statistics/collection/type_specimens/',
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
      '/statistics/collection/preparations/',
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
      '/statistics/collection/type_specimens/',
      (rawNumber: number | undefined) => f.maybe(rawNumber, formatNumber),
      statsSpecTest,
    ],
    out: defaultLayoutTest[0].categories[0].items,
  },
  {
    in: [
      backEndResponse,
      defaultLayoutTest[0].categories[1].items,
      '/statistics/collection/type_specimens/',
      (rawNumber: number | undefined) => f.maybe(rawNumber, formatNumber),
      statsSpecTest,
    ],
    out: defaultLayoutTest[0].categories[1].items,
  },
]);
