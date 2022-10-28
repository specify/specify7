import { getDateInputValue } from '../../utils/dayJs';
import type { IR } from '../../utils/types';
import { formatNumber } from '../Atoms/Internationalization';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import type { BackendStatsResult, BackendStat, StatItemSpec } from './utils';
import { statsText } from '../../localization/stats';
import { formattedEntry } from '../WbPlanView/mappingHelpers';

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
          label: statsText('collectionObjects'),
          spec: {
            type: 'Querybuildstat',
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
        preparations: {
          label: statsText('preparations'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Preparation',
            fields: [
              {
                path: formattedEntry,
              },
              { path: 'countAmt' },
            ],
          },
        },
        typeSpecimens: {
          label: statsText('typeSpecimens'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Determination',
            fields: [
              {
                path: formattedEntry,
              },
              {
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
                path: `loan.${formattedEntry}`,
              },
              {
                path: 'loan.isClosed',
                operStart: queryFieldFilters.falseOrNull.id,
                isDisplay: false,
              },
            ],
          },
        },
        openLoansCount: {
          label: statsText('openLoans'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Loan',
            fields: [
              {
                path: formattedEntry,
              },
              {
                path: 'isClosed',
                operStart: queryFieldFilters.falseOrNull.id,
                isDisplay: false,
              },
            ],
          },
        },
        overdueLoansCount: {
          label: statsText('overdueLoans'),

          spec: {
            type: 'Querybuildstat',
            tableName: 'Loan',
            fields: [
              {
                path: formattedEntry,
              },
              {
                path: 'currentDueDate',
                operStart: queryFieldFilters.lessOrEqual.id,
                startValue: getDateInputValue(new Date()),
              },
              {
                path: 'isClosed',
                operStart: queryFieldFilters.false.id,
                isDisplay: false,
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
                path: formattedEntry,
              },
              {
                path: 'rankId',
                operStart: queryFieldFilters.equal.id,
                startValue: '60',
                isDisplay: false,
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
                path: formattedEntry,
              },
              {
                path: 'rankId',
                operStart: queryFieldFilters.equal.id,
                startValue: '100',
                isDisplay: false,
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
                path: formattedEntry,
              },
              {
                path: 'rankId',
                operStart: queryFieldFilters.equal.id,
                startValue: '140',
                isDisplay: false,
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
                path: formattedEntry,
              },
              {
                path: 'rankId',
                operStart: queryFieldFilters.equal.id,
                startValue: '180',
                isDisplay: false,
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
                path: formattedEntry,
              },
              {
                path: 'rankId',
                operStart: queryFieldFilters.equal.id,
                startValue: '220',
                isDisplay: false,
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
          label: statsText('localities'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Locality',
            fields: [
              {
                path: formattedEntry,
              },
              {
                path: 'localityId',
                operStart: queryFieldFilters.any.id,
              },
            ],
          },
        },
        geographyEntryCount: {
          label: statsText('geographyEntries'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Geography',
            fields: [
              {
                path: formattedEntry,
              },
              {
                path: 'geographyId',
                operStart: queryFieldFilters.any.id,
              },
            ],
          },
        },
        countriesCount: {
          label: statsText('countries'),
          spec: {
            type: 'Backendstat',
            value: backendStatsResult?.countries,
          },
        },
        georeferencedLocalityCount: {
          label: statsText('georeferencedLocalities'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'Locality',
            fields: [
              {
                path: formattedEntry,
              },
              {
                path: 'latitude1',
                operStart: queryFieldFilters.empty.id,
                isNot: true,
                isDisplay: false,
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
    label: statsText('computerization'),
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
          label: statsText('computerizedLast7Days'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'CollectionObject',
            fields: [
              {
                path: formattedEntry,
              },
              {
                path: 'catalogedDate',
                operStart: queryFieldFilters.between.id,
                startValue: `${initialDateSevenDaysPast},${initialDate}`,
              },
            ],
          },
        },
        catalogedLast30Days: {
          label: statsText('computerizedLast30Days'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'CollectionObject',
            fields: [
              {
                path: formattedEntry,
              },
              {
                path: 'catalogedDate',
                operStart: queryFieldFilters.between.id,
                startValue: `${initialDateThirtyDaysPast},${initialDate}`,
              },
            ],
          },
        },
        catalogedLastYear: {
          label: statsText('computerizedLastYear'),
          spec: {
            type: 'Querybuildstat',
            tableName: 'CollectionObject',
            fields: [
              {
                path: formattedEntry,
              },
              {
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
