import { getDateInputValue } from '../../utils/dayJs';
import type { IR } from '../../utils/types';
import { formatNumber } from '../Atoms/Internationalization';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import type { BackendStatsResult, BackendStat, StatItemSpec } from './utils';

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
    label: 'Holdings',
    categories(backendStatsResult) {
      return {
        specimen: {
          label: 'Specimens',

          spec: {
            type: 'Querybuildstat',
            tableName: 'CollectionObject',
            fields: [],
          },
        },
        preparation: {
          label: 'Preparations',
          spec: {
            type: 'Querybuildstat',
            tableName: 'Preparation',
            fields: [{ position: 0, path: 'countAmt' }],
          },
        },
        typeSpecimen: {
          label: 'Type Specimens',
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
          label: 'Families Represented',
          spec: {
            type: 'Backendstat',
            value: backendStatsResult?.familiesRepresented,
          },
        },
        generaRepresented: {
          label: 'Genera Represented',
          spec: {
            type: 'Backendstat',
            value: backendStatsResult?.generaRepresented,
          },
        },
        speciesRepresented: {
          label: 'Species Represented',
          spec: {
            type: 'Backendstat',
            value: backendStatsResult?.speciesRepresented,
          },
        },
      };
    },
  },
  preparation: {
    label: 'Preparations',
    categories: (backendStatsResult) =>
      modifyBackendResult<'preparation'>(
        backendStatsResult,
        (prepelement) =>
          `${formatNumber(prepelement.lots)} / ${formatNumber(
            prepelement.total
          )}`
      ),
  },
  loans: {
    label: 'Loans',
    categories() {
      return {
        itemsOnLoans: {
          label: 'Items on Loans',
          spec: {
            type: 'Querybuildstat',
            tableName: 'LoanPreparation',
            fields: [
              {
                position: 0,
                path: 'Loan.isClosed',
                operStart: queryFieldFilters.falseOrNull.id,
              },
            ],
          },
        },
        openLoansCount: {
          label: 'Open Loans Count',
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
        overdueLoanCount: {
          label: 'Overdue Loans Count',

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
    label: 'Taxonomic Tree',
    categories() {
      return {
        classesCount: {
          label: 'Classes',
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
          label: 'Orders',
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
          label: 'Families',
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
          label: 'Genera',
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
          label: 'Species',
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
    label: 'Locality / Geography',
    categories(backendStatsResult) {
      return {
        localityCount: {
          label: 'Locality Count',
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
          label: 'Geography Entry Count',
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
          label: 'Countries',
          spec: {
            type: 'Backendstat',
            value: backendStatsResult?.countries,
          },
        },
        georeferencedLocalityCount: {
          label: 'Georeferenced Localities Count',
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
  typeSpecimen: {
    label: 'Type Specimens',
    categories: (backendStatsResult) =>
      modifyBackendResult<'typeSpecimen'>(backendStatsResult, formatNumber),
  },
  catalogStats: {
    label: 'Collection Catalogs',
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
          label: 'Cataloged Last 7 Days',
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
          label: 'Cataloged Last 30 Days',
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
          label: 'Cataloged Last year',
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
