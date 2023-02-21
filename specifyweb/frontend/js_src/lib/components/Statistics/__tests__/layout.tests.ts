import { StatsSpec } from '../types';
import { statsText } from '../../../localization/stats';
import { formattedEntry } from '../../WbPlanView/mappingHelpers';
import { queryFieldFilters } from '../../QueryBuilder/FieldFilter';
import { formatNumber } from '../../Atoms/Internationalization';
import { f } from '../../../utils/functools';
import { userInformation } from '../../InitialContext/userInformation';
import { ensure } from '../../../utils/types';
import { generateDefaultLayout } from '../StatsSpec';

export const statsSpecTest: StatsSpec = {
  collection: {
    sourceLabel: statsText.collection(),
    urlPrefix: 'collection',
    categories: {
      holdings: {
        label: statsText.holdings(),
        items: {
          specimens: {
            label: statsText.collectionObjects(),
            spec: {
              type: 'QueryBuilderStat',
              querySpec: {
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: formattedEntry,
                    isDisplay: true,
                    operStart: queryFieldFilters.any.id,
                  },
                ],
              },
            },
          },
        },
      },
      preparations: {
        label: statsText.preparations(),
        items: {
          phantomItem: {
            label: statsText.preparations(),
            spec: {
              type: 'BackEndStat',
              pathToValue: undefined,
              tableName: 'Preparation',
              formatter: (
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
            },
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      locality_geography: {
        // FEATURE: refactor all strings to use localized table names
        label: statsText.localityGeography(),
        items: {
          countries: {
            label: statsText.countries(),
            spec: {
              type: 'BackEndStat',
              pathToValue: 'countries',
              tableName: 'Geography',
              formatter: (rawNumber: number | undefined) =>
                f.maybe(rawNumber, formatNumber),
            },
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      type_specimens: {
        label: statsText.typeSpecimens(),
        items: {
          phantomItem: {
            label: statsText.typeSpecimens(),
            spec: {
              type: 'BackEndStat',
              pathToValue: undefined,
              tableName: 'Determination',
              formatter: (rawNumber: number | undefined) =>
                f.maybe(rawNumber, formatNumber),
            },
          },
        },
      },
    },
  },
  user: {
    sourceLabel: statsText.personal(),
    urlPrefix: 'collection/user',
    categories: {
      holdings: {
        label: statsText.collection(),
        items: {
          collectionObjectsCataloged: {
            label: statsText.collectionObjectsCataloged(),
            spec: {
              type: 'QueryBuilderStat',
              querySpec: {
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: 'cataloger.specifyuser.name',
                    startValue: userInformation.name,
                    operStart: queryFieldFilters.equal.id,
                  },
                ],
              },
            },
          },
        } as const,
      },
    },
  },
};

ensure<StatsSpec>()(statsSpecTest);

export const defaultLayoutTest = generateDefaultLayout(statsSpecTest);
