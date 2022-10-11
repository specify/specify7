import { getDateInputValue } from '../../utils/dayJs';
import type { IR } from '../../utils/types';
import { formatNumber } from '../Atoms/Internationalization';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import type { BackendStatsResult, BackendStat, StatItemSpec } from './utils';
import { statsText } from '../../localization/stats';

function modifyBackendResult<CATEGORY_NAME extends keyof BackendStatsResult>(
  backendobject: BackendStatsResult[CATEGORY_NAME] | undefined,
  modifyfunction: (
    rawValue: BackendStatsResult[CATEGORY_NAME][keyof BackendStatsResult[CATEGORY_NAME]]
  ) => BackendStat['value']
): StatCategoryReturn {
  if (backendobject === undefined) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(backendobject).map(([key, value]) => [
      key,
      {
        label: key,
        spec: {
          type: 'Backendstat',
          value: modifyfunction(value),
        },
      },
    ])
  );
}

export type StatCategoryReturn =
  | IR<{ readonly label: string; readonly spec: StatItemSpec }>
  | undefined;

type StatsSpec =
  | {
      readonly [CATEGORY_NAME in keyof BackendStatsResult]: {
        readonly label: string;
        readonly categories: (
          backendStatsResult: BackendStatsResult[CATEGORY_NAME] | undefined
        ) => StatCategoryReturn;
      };
    }
  | {
      readonly [CATEGORY_NAME in string]: {
        readonly label: string;
        readonly categories: () => StatCategoryReturn;
      };
    };

export const statsSpec: StatsSpec = {
  holdings: {
    label: statsText('holdings'),
    categories(backendStatsResult) {
      return {
        specimens: {
          label: statsText('specimens'),

          spec: {
            type: 'Querybuildstat',
            tableName: 'CollectionObject',
            fields: [],
          },
        },
        preparations: {
          label: statsText('preparations'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Preparation',
            fields: [{ position: 0, path: 'countAmt' }],
          },
        },
        typeSpecimens: {
          label: statsText('typeSpecimens'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Determination',
            fields: [
              {
                position: 0,
                path: 'typeStatusName',
                operStart: queryFieldFilters.equal.id,
                isNot: true,
              },
            ],
          },
        },
        familiesRepresented: {
          label: statsText('familiesRepresented'),
          spec: {
            type: 'Backendstat',
            value: backendStatsResult?.familiesRepresented,
          },
        },
        generaRepresented: {
          label: statsText('generaRepresented'),
          spec: {
            type: 'Backendstat',
            value: backendStatsResult?.generaRepresented,
          },
        },
        speciesRepresented: {
          label: statsText('speciesRepresented'),
          spec: {
            type: 'Backendstat',
            value: backendStatsResult?.speciesRepresented,
          },
        },
      };
    },
  },
  preparations: {
    label: statsText('preparations'),
    categories: (backendStatsResult) =>
      modifyBackendResult<'preparations'>(
        backendStatsResult,
        (prepelement) =>
          `${formatNumber(prepelement.lots)} / ${formatNumber(
            prepelement.total
          )}`
      ),
  },
  loans: {
    label: statsText('loans'),
    categories() {
      return {
        itemsOnLoans: {
          label: statsText('itemsOnLoans'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'LoanPreparation',
            fields: [
              {
                position: 0,
                path: 'loan.isClosed',
                operStart: queryFieldFilters.falseOrNull.id,
              },
            ],
          },
        },
        openLoansCount: {
          label: statsText('openLoansCount'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Loan',
            fields: [
              {
                position: 0,
                path: 'isClosed',
                operStart: queryFieldFilters.falseOrNull.id,
              },
            ],
          },
        },
        overdueLoansCount: {
          label: statsText('overdueLoansCount'),

          spec: {
            type: 'Querybuildstat',
            tableName: 'Loan',
            fields: [
              {
                position: 0,
                path: 'currentDueDate',
                operStart: queryFieldFilters.lessOrEqual.id,
                startValue: getDateInputValue(new Date()),
              },
              {
                position: 1,
                path: 'isClosed',
                operStart: queryFieldFilters.false.id,
              },
            ],
          },
        },
      };
    },
  },
  taxonomicTree: {
    label: statsText('taxonomicTree'),
    categories() {
      return {
        classesCount: {
          label: statsText('classes'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Taxon',
            fields: [
              {
                position: 0,
                path: 'rankId',
                operStart: queryFieldFilters.equal.id,
                startValue: '60',
              },
            ],
          },
        },
        ordersCount: {
          label: statsText('orders'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Taxon',
            fields: [
              {
                position: 0,
                path: 'rankId',
                operStart: queryFieldFilters.equal.id,
                startValue: '100',
              },
            ],
          },
        },
        familiesCount: {
          label: statsText('families'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Taxon',
            fields: [
              {
                position: 0,
                path: 'rankId',
                operStart: queryFieldFilters.equal.id,
                startValue: '140',
              },
            ],
          },
        },
        generaCount: {
          label: statsText('genera'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Taxon',
            fields: [
              {
                position: 0,
                path: 'rankId',
                operStart: queryFieldFilters.equal.id,
                startValue: '180',
              },
            ],
          },
        },
        speciesCount: {
          label: statsText('species'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Taxon',
            fields: [
              {
                position: 0,
                path: 'rankId',
                operStart: queryFieldFilters.equal.id,
                startValue: '220',
              },
            ],
          },
        },
      };
    },
  },
  localityGeography: {
    label: statsText('localityGeography'),
    categories(backendStatsResult) {
      return {
        localityCount: {
          label: statsText('localityCount'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Locality',
            fields: [
              {
                position: 0,
                path: 'localityId',
                operStart: queryFieldFilters.any.id,
              },
            ],
          },
        },
        geographyEntryCount: {
          label: statsText('geographyEntryCount'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Geography',
            fields: [
              {
                position: 0,
                path: 'geographyId',
                operStart: queryFieldFilters.any.id,
              },
            ],
          },
        },
        countriesCount: {
          label: statsText('countriesCount'),
          spec: {
            type: 'Backendstat',
            value: backendStatsResult?.countries,
          },
        },
        georeferencedLocalityCount: {
          label: statsText('georeferencedLocalityCount'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Locality',
            fields: [
              {
                position: 0,
                path: 'latitude1',
                operStart: queryFieldFilters.empty.id,
                isNot: true,
              },
            ],
          },
        },
      };
    },
  },
  typeSpecimens: {
    label: statsText('typeSpecimens'),
    categories: (backendStatsResult) =>
      modifyBackendResult<'typeSpecimens'>(backendStatsResult, formatNumber),
  },
  catalogStats: {
    label: statsText('catalogStats'),
    categories() {
      const local = new Date();
      const initialDate = getDateInputValue(local);
      local.setDate(local.getDate() - 7);
      const initialDateSevenDaysPast = getDateInputValue(local);
      local.setDate(local.getDate() - 23);
      const initialDateThirtyDaysPast = getDateInputValue(local);
      local.setDate(local.getDate() + 30);
      local.setFullYear(local.getFullYear() - 1);
      const initialDateYearPast = getDateInputValue(local);
      return {
        catalogedLast7Days: {
          label: statsText('catalogedLast7Days'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'CollectionObject',
            fields: [
              {
                position: 0,
                path: 'catalogedDate',
                operStart: queryFieldFilters.between.id,
                startValue: `${initialDateSevenDaysPast},${initialDate}`,
              },
            ],
          },
        },
        catalogedLast30Days: {
          label: statsText('catalogedLast30Days'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'CollectionObject',
            fields: [
              {
                position: 0,
                path: 'catalogedDate',
                operStart: queryFieldFilters.between.id,
                startValue: `${initialDateThirtyDaysPast},${initialDate}`,
              },
            ],
          },
        },
        catalogedLastYear: {
          label: statsText('catalogedLastYear'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'CollectionObject',
            fields: [
              {
                position: 0,
                path: 'catalogedDate',
                operStart: queryFieldFilters.between.id,
                startValue: `${initialDateYearPast},${initialDate}`,
              },
            ],
          },
        },
      };
    },
  },
};
