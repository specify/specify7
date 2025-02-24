import { statsText } from '../../localization/stats';
import { today } from '../../utils/relativeDate';
import type { RA } from '../../utils/types';
import { ensure, filterArray } from '../../utils/types';
import { formatNumber } from '../Atoms/Internationalization';
import { userInformation } from '../InitialContext/userInformation';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { flippedSortTypes } from '../QueryBuilder/helpers';
import { formattedEntry, formatTreeRank } from '../WbPlanView/mappingHelpers';
import { generateStatUrl } from './hooks';
import type {
  BackEndStat,
  DefaultStat,
  QuerySpec,
  StatCategoryReturn,
  StatFormatterGenerator,
  StatLayout,
  StatsSpec,
} from './types';

export const statsSpec: StatsSpec = {
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
              type: 'QueryStat',
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
          preparations: {
            label: statsText.preparations(),
            spec: {
              type: 'QueryStat',
              querySpec: {
                tableName: 'Preparation',
                fields: [
                  {
                    path: formattedEntry,
                  },
                  { path: 'countAmt' },
                ],
              },
            },
          },
          typeSpecimens: {
            label: statsText.typeSpecimens(),
            spec: {
              type: 'QueryStat',
              querySpec: {
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: 'catalogNumber',
                  },
                  {
                    path: 'determinations.typeStatusName',
                    operStart: queryFieldFilters.empty.id,
                    isNot: true,
                  },
                  {
                    path: 'determinations.isCurrent',
                    operStart: queryFieldFilters.trueOrNull.id,
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
              formatterGenerator:
                ({ showPreparationsTotal }) =>
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
                    : showPreparationsTotal
                      ? `${formatNumber(prep.lots)} / ${formatNumber(prep.total)}`
                      : formatNumber(prep.lots),

              querySpec: (dynamicResult) => ({
                tableName: 'Preparation',
                fields: [
                  {
                    path: formattedEntry,
                    isDisplay: true,
                    operStart: queryFieldFilters.any.id,
                  },
                  {
                    path: 'collectionobject.catalogNumber',
                    isDisplay: true,
                    operStart: queryFieldFilters.any.id,
                  },
                  {
                    path: 'preptype.name',
                    isDisplay: true,
                    operStart: queryFieldFilters.equal.id,
                    startValue: dynamicResult.toString(),
                  },
                ],
              }),
            },
          },
        },
      },
      loans: {
        label: statsText.loans(),
        items: {
          itemsOnLoans: {
            label: statsText.itemsOnLoans(),
            spec: {
              type: 'QueryStat',
              querySpec: {
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
          },
          openLoansCount: {
            label: statsText.openLoans(),
            spec: {
              type: 'QueryStat',
              querySpec: {
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
          },
          overdueLoansCount: {
            label: statsText.overdueLoans(),
            spec: {
              type: 'QueryStat',
              querySpec: {
                tableName: 'Loan',
                fields: [
                  {
                    path: formattedEntry,
                  },
                  {
                    path: 'currentDueDate',
                    operStart: queryFieldFilters.lessOrEqual.id,
                    startValue: `${today} + 0 day`,
                  },
                  {
                    path: 'isClosed',
                    operStart: queryFieldFilters.false.id,
                    isDisplay: false,
                  },
                ],
              },
            },
          },
        },
      },
      taxonsRepresented: {
        label: statsText.taxonRepresented(),
        items: {
          dynamicPhantomItem: {
            label: statsText.taxonRepresented(),
            spec: {
              type: 'DynamicStat',
              dynamicQuerySpec: {
                tableName: 'TaxonTreeDefItem',
                fields: [
                  {
                    path: 'rankId',
                    operStart: queryFieldFilters.greater.id,
                    sortType: flippedSortTypes.ascending,
                    isDisplay: false,
                    startValue: '0',
                  },
                  {
                    isNot: true,
                    path: 'name',
                    operStart: queryFieldFilters.empty.id,
                  },
                ],
                isDistinct: true,
              },
              querySpec: (taxonRankName) => ({
                shouldAugment: false,
                /*
                 * This is faster than running a query through collection object
                 * since collection object can have a single determination as current ideally
                 */
                tableName: 'Determination',
                fields: [
                  {
                    path: `preferredTaxon.${formatTreeRank(
                      taxonRankName
                    )}.fullName`,
                    isDisplay: true,
                    operStart: queryFieldFilters.any.id,
                  },
                  {
                    path: `preferredTaxon.${formatTreeRank(
                      taxonRankName
                    )}.taxonid`,
                    isNot: true,
                    isDisplay: true,
                    operStart: queryFieldFilters.empty.id,
                  },
                  {
                    path: 'isCurrent',
                    isDisplay: false,
                    operStart: queryFieldFilters.true.id,
                  },
                ],
                isDistinct: true,
              }),
            },
          },
        },
      },

      // eslint-disable-next-line @typescript-eslint/naming-convention
      locality_geography: {
        // FEATURE: refactor all strings to use localized table names
        label: statsText.localityGeography(),
        items: {
          localityCount: {
            label: statsText.localities(),
            spec: {
              type: 'QueryStat',
              querySpec: {
                tableName: 'Locality',
                fields: [
                  {
                    path: formattedEntry,
                  },
                  {
                    path: 'localityName',
                    operStart: queryFieldFilters.any.id,
                  },
                  {
                    path: 'latitude1',
                    operStart: queryFieldFilters.any.id,
                  },
                  {
                    path: 'longitude1',
                    operStart: queryFieldFilters.any.id,
                  },
                ],
              },
            },
          },
          geographyEntryCount: {
            label: statsText.geographyEntries(),
            spec: {
              type: 'QueryStat',
              querySpec: {
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
          },
          georeferencedLocalityCount: {
            label: statsText.georeferencedLocalities(),
            spec: {
              type: 'QueryStat',
              querySpec: {
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
          },
          percentGeoReferenced: {
            label: statsText.percentGeoReferenced(),
            spec: {
              type: 'BackEndStat',
              pathToValue: 'percentGeoReferenced',
              formatterGenerator: () => (rawResult: string) => `${rawResult}%`,
            },
          },
        },
      },

      geographiesRepresented: {
        label: statsText.geographiesRepresented(),
        items: {
          dynamicPhantomItem: {
            label: statsText.geographiesRepresented(),
            spec: {
              type: 'DynamicStat',
              dynamicQuerySpec: {
                tableName: 'GeographyTreeDefItem',
                fields: [
                  {
                    path: 'rankId',
                    operStart: queryFieldFilters.greater.id,
                    sortType: flippedSortTypes.ascending,
                    isDisplay: false,
                    startValue: '0',
                  },
                  {
                    isNot: true,
                    path: 'name',
                    operStart: queryFieldFilters.empty.id,
                  },
                ],
                isDistinct: true,
              },
              querySpec: (geographyRankName) => ({
                shouldAugment: false,
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: `collectingevent.locality.geography.${formatTreeRank(
                      geographyRankName
                    )}.fullName`,
                    isDisplay: true,
                    operStart: queryFieldFilters.any.id,
                  },
                  {
                    path: `collectingevent.locality.geography.${formatTreeRank(
                      geographyRankName
                    )}.geographyid`,
                    isNot: true,
                    isDisplay: true,
                    operStart: queryFieldFilters.empty.id,
                  },
                ],
                isDistinct: true,
              }),
            },
          },
        },
      },

      // eslint-disable-next-line @typescript-eslint/naming-convention
      type_specimens: {
        label: statsText.typeSpecimens(),
        items: {
          dynamicPhantomItem: {
            label: statsText.typeSpecimens(),
            spec: {
              type: 'DynamicStat',
              dynamicQuerySpec: {
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: 'determinations.isCurrent',
                    operStart: queryFieldFilters.trueOrNull.id,
                    isDisplay: false,
                  },
                  {
                    isNot: true,
                    path: 'determinations.typeStatusName',
                    operStart: queryFieldFilters.empty.id,
                  },
                ],
                isDistinct: true,
              },

              querySpec: (dynamicResult) => ({
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: 'catalogNumber',
                  },

                  {
                    path: 'determinations.isCurrent',
                    operStart: queryFieldFilters.trueOrNull.id,
                    isDisplay: false,
                  },
                  {
                    path: 'determinations.typeStatusName',
                    operStart: queryFieldFilters.equal.id,
                    startValue: dynamicResult,
                    isDisplay: false,
                  },
                ],
              }),
            },
          },
        },
      },
      catalogStats: {
        label: statsText.digitization(),
        items: {
          catalogedLastSevenDays: {
            label: statsText.digitizedLastSevenDays(),
            spec: {
              type: 'QueryStat',
              querySpec: {
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: formattedEntry,
                  },
                  {
                    path: 'timestampCreated',
                    operStart: queryFieldFilters.greaterOrEqual.id,
                    startValue: `${today} - 1 week`,
                  },
                ],
              },
            },
          },
          catalogedLastMonth: {
            label: statsText.digitizedLastMonth(),
            spec: {
              type: 'QueryStat',
              querySpec: {
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: formattedEntry,
                  },
                  {
                    path: 'timestampCreated',
                    operStart: queryFieldFilters.greaterOrEqual.id,
                    startValue: `${today} - 1 month`,
                  },
                ],
              },
            },
          },
          catalogedLastYear: {
            label: statsText.digitizedLastYear(),
            spec: {
              type: 'QueryStat',
              querySpec: {
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: formattedEntry,
                  },
                  {
                    path: 'timestampCreated',
                    operStart: queryFieldFilters.greaterOrEqual.id,
                    startValue: `${today} - 1 year`,
                  },
                ],
              },
            },
          },
        },
      },
      attachments: {
        label: statsText.attachments(),
        items: {
          collectionObjectsWithAttachments: {
            label: statsText.collectionObjectsWithAttachments(),
            spec: {
              type: 'QueryStat',
              querySpec: {
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: 'collectionObjectId',
                  },
                  {
                    path: 'collectionObjectAttachments.attachment.attachmentId',
                    operStart: queryFieldFilters.empty.id,
                    isNot: true,
                    isDisplay: false,
                  },
                ],
                isDistinct: true,
              },
            },
          },
          collectionObjectsWithImages: {
            label: statsText.collectionObjectsWithImages(),
            spec: {
              type: 'QueryStat',
              querySpec: {
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: 'collectionObjectId',
                  },
                  {
                    path: 'collectionObjectAttachments.attachment.mimeType',
                    operStart: queryFieldFilters.contains.id,
                    startValue: 'image',
                    isDisplay: false,
                  },
                ],
                isDistinct: true,
              },
            },
          },
          percentCoImaged: {
            label: statsText.percentImaged(),
            spec: {
              type: 'BackEndStat',
              pathToValue: 'percentCoImaged',
              formatterGenerator: () => (rawResult: string) => `${rawResult}%`,
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
        label: statsText.curation(),
        items: {
          collectionObjectsCataloged: {
            label: statsText.collectionObjectsCataloged(),
            spec: {
              type: 'QueryStat',
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
          collectionObjectsDetermined: {
            label: statsText.collectionObjectsDetermined(),
            spec: {
              type: 'QueryStat',
              querySpec: {
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: 'determinations.determiner.specifyuser.name',
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

ensure<StatsSpec>()(statsSpec);

const statSpecToItems = (
  categoryName: string,
  pageName: string,
  items: StatCategoryReturn
): RA<DefaultStat> =>
  Object.entries(items).map(([itemName, { label, spec }]) => ({
    type: 'DefaultStat',
    pageName,
    itemName,
    categoryName,
    label,
    itemValue: undefined,
    itemType: spec.type,
    pathToValue: spec.type === 'BackEndStat' ? spec.pathToValue : undefined,
  }));

function generateBackEndSpec(statsSpec: StatsSpec): RA<{
  readonly responseKey: string;
  readonly querySpec: ((dynamicResult: string) => QuerySpec) | undefined;
  readonly formatterGenerator: StatFormatterGenerator;
}> {
  return Object.entries(statsSpec).flatMap(([_, { categories, urlPrefix }]) =>
    Object.entries(categories).flatMap(([categoryKey, { items }]) =>
      Object.entries(items)
        .filter(
          ([_, { spec }]) =>
            spec.type === 'BackEndStat' && spec.pathToValue === undefined
        )
        .map(([itemKey, { spec }]) => ({
          responseKey: generateStatUrl(urlPrefix, categoryKey, itemKey),
          querySpec: (spec as BackEndStat).querySpec,
          formatterGenerator: (spec as BackEndStat).formatterGenerator,
        }))
    )
  );
}

function generateDynamicSpec(statsSpec: StatsSpec): RA<{
  readonly responseKey: string;
  readonly dynamicQuerySpec: QuerySpec;
}> {
  return Object.entries(statsSpec).flatMap(([_, { categories, urlPrefix }]) =>
    Object.entries(categories).flatMap(([categoryKey, { items }]) =>
      filterArray(
        Object.entries(items).map(([itemKey, { spec }]) =>
          spec.type === 'DynamicStat'
            ? {
                responseKey: generateStatUrl(urlPrefix, categoryKey, itemKey),
                dynamicQuerySpec: spec.dynamicQuerySpec,
              }
            : undefined
        )
      )
    )
  );
}

export function generateDefaultLayout(
  statsSpecBasis: StatsSpec
): RA<StatLayout> {
  return Object.entries(statsSpecBasis).map(
    ([sourceKey, { sourceLabel, categories }]) => ({
      label: sourceLabel,
      categories: Object.entries(categories).map(
        ([categoryName, { label, items }]) => ({
          label,
          items: statSpecToItems(categoryName, sourceKey, items),
        })
      ),
      lastUpdated: undefined,
    })
  );
}

export const dynamicStatsSpec = generateDynamicSpec(statsSpec);
export const backEndStatsSpec = generateBackEndSpec(statsSpec);
export const defaultLayoutGenerated = generateDefaultLayout(statsSpec);
