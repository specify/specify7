import { getDateInputValue } from '../../utils/dayJs';
import type { IR } from '../../utils/types';
import { formatNumber } from '../Atoms/Internationalization';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { statsText } from '../../localization/stats';
import { formattedEntry } from '../WbPlanView/mappingHelpers';
import type {
  BackEndStat,
  BackendStatsResult,
  StatCategoryReturn,
} from './types';
import React from 'react';
import { userInformation } from '../InitialContext/userInformation';

const modifyBackendResult = <CATEGORY_NAME extends keyof BackendStatsResult>(
  backEndStats: BackendStatsResult[CATEGORY_NAME] | undefined,
  modifyFunction: (
    rawValue: BackendStatsResult[CATEGORY_NAME][keyof BackendStatsResult[CATEGORY_NAME]]
  ) => BackEndStat['value']
): StatCategoryReturn =>
  backEndStats === undefined
    ? undefined
    : Object.fromEntries(
        Object.entries(backEndStats).map(([key, value]) => [
          key,
          {
            label: key,
            spec: {
              type: 'BackEndStat',
              value: modifyFunction(value),
            },
          },
        ])
      );

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

export const statsSpec: IR<StatsSpec> = {
  [statsText('collection')]: {
    holdings: {
      label: statsText('holdings'),
      categories: (backendStatsResult) => ({
        specimens: {
          label: statsText('collectionObjects'),
          spec: {
            type: 'QueryBuilderStat',
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
            type: 'QueryBuilderStat',
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
            type: 'QueryBuilderStat',
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
            type: 'BackEndStat',
            value: backendStatsResult?.familiesRepresented,
          },
        },
        generaRepresented: {
          label: statsText('generaRepresented'),
          spec: {
            type: 'BackEndStat',
            value: backendStatsResult?.generaRepresented,
          },
        },
        speciesRepresented: {
          label: statsText('speciesRepresented'),
          spec: {
            type: 'BackEndStat',
            value: backendStatsResult?.speciesRepresented,
          },
        },
      }),
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
      categories: () => ({
        itemsOnLoans: {
          label: statsText('itemsOnLoans'),
          spec: {
            type: 'QueryBuilderStat',
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
            type: 'QueryBuilderStat',
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
            type: 'QueryBuilderStat',
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
      }),
    },
    taxonomicTree: {
      label: statsText('taxonomicTree'),
      categories: () => ({
        classesCount: {
          label: statsText('classes'),
          spec: {
            type: 'QueryBuilderStat',
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
            type: 'QueryBuilderStat',
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
            type: 'QueryBuilderStat',
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
            type: 'QueryBuilderStat',
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
            type: 'QueryBuilderStat',
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
      }),
    },
    localityGeography: {
      label: statsText('localityGeography'),
      categories: (backendStatsResult) => ({
        localityCount: {
          label: statsText('localities'),
          spec: {
            type: 'QueryBuilderStat',
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
            type: 'QueryBuilderStat',
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
            type: 'BackEndStat',
            value: backendStatsResult?.countries,
          },
        },
        georeferencedLocalityCount: {
          label: statsText('georeferencedLocalities'),
          spec: {
            type: 'QueryBuilderStat',
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
      }),
    },
    typeSpecimens: {
      label: statsText('typeSpecimens'),
      categories: (backendStatsResult) =>
        modifyBackendResult<'typeSpecimens'>(backendStatsResult, formatNumber),
    },
    catalogStats: {
      label: statsText('computerization'),
      categories() {
        const currentDate = new Date();
        const initialDate = getDateInputValue(currentDate);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const initialDateSevenDaysPast = getDateInputValue(weekAgo);

        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const initialDateMonthPast = getDateInputValue(monthAgo);

        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        const initialDateYearPast = getDateInputValue(yearAgo);

        return {
          catalogedLastSevenDays: {
            label: statsText('computerizedLastSevenDays'),
            spec: {
              type: 'QueryBuilderStat',
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
          catalogedLastMonth: {
            label: statsText('computerizedLastMonth'),
            spec: {
              type: 'QueryBuilderStat',
              tableName: 'CollectionObject',
              fields: [
                {
                  path: formattedEntry,
                },
                {
                  path: 'catalogedDate',
                  operStart: queryFieldFilters.between.id,
                  startValue: `${initialDateMonthPast},${initialDate}`,
                },
              ],
            },
          },
          catalogedLastYear: {
            label: statsText('computerizedLastYear'),
            spec: {
              type: 'QueryBuilderStat',
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
  },
  [statsText('personal')]: {
    holdings: {
      label: statsText('collection'),
      categories: () => ({
        collectionObjectsModified: {
          label: statsText('collectionObjectsModified'),
          spec: {
            type: 'QueryBuilderStat',
            tableName: 'CollectionObject',
            fields: [
              {
                path: 'modifiedByAgent.SpecifyUser.name',
                startvalue: userInformation.name,
                operstart: queryFieldFilters.equal.id,
              },
            ],
          },
        },
        collectionObjectsCataloged: {
          label: statsText('collectionObjectsCataloged'),
          spec: {
            type: 'QueryBuilderStat',
            tableName: 'CollectionObject',
            fields: [
              {
                path: 'cataloger.SpecifyUser.name',
                startvalue: userInformation.name,
                operstart: queryFieldFilters.equal.id,
              },
            ],
          },
        },
        collectionObjectsDetermined: {
          label: statsText('collectionObjectsDetermined'),
          spec: {
            type: 'QueryBuilderStat',
            tableName: 'CollectionObject',
            fields: [
              {
                path: 'determinations.determiner.SpecifyUser.name',
                startvalue: userInformation.name,
                operstart: queryFieldFilters.equal.id,
              },
            ],
          },
        },
        collectionObjectInventorized: {
          label: statsText('collectionObjects'),
          spec: {
            type: 'QueryBuilderStat',
            tableName: 'CollectionObject',
            fields: [
              {
                path: 'inventorizedBy.SpecifyUser.name',
                startvalue: userInformation.name,
                operstart: queryFieldFilters.equal.id,
              },
            ],
          },
        },
      }),
    },
  },
};
