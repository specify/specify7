import { statsText } from '../../localization/stats';
import { today } from '../../utils/relativeDate';
import type { RA } from '../../utils/types';
import { ensure } from '../../utils/types';
import { formatNumber } from '../Atoms/Internationalization';
import type { Tables } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import {
  anyTreeRank,
  formattedEntry,
  formatTreeRank,
} from '../WbPlanView/mappingHelpers';
import { generateStatUrl } from './hooks';
import type {
  BackEndStat,
  DynamicStat,
  StatFormatterGenerator,
  StatLayout,
  StatsSpec,
} from './types';
import type { DefaultStat, StatCategoryReturn } from './types';

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
                  {
                    path: 'isCurrent',
                    operStart: queryFieldFilters.true.id,
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
              formatterGenerator:
                ({ showTotal }) =>
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
                    : showTotal
                    ? `${formatNumber(prep.lots)} / ${formatNumber(prep.total)}`
                    : formatNumber(prep.lots),
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
      taxonomicTree: {
        label: statsText.taxonomicTree(),
        items: {
          dynamicPhantomItem: {
            label: statsText.taxonomicTree(),
            spec: {
              type: 'DynamicStat',
              tableNames: [
                'CollectionObject',
                'Determination',
                'Taxon',
                'TaxonTreeDefItem',
              ],
              dynamicQuerySpec: {
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: 'determinations.isCurrent',
                    operStart: queryFieldFilters.true.id,
                    isDisplay: false,
                  },
                  {
                    isNot: true,
                    path: `determinations.preferredTaxon.${formatTreeRank(
                      anyTreeRank
                    )}.definitionItem.name`,
                    operStart: queryFieldFilters.empty.id,
                  },
                ],
                isDistinct: true,
              },
              querySpec: {
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: `determinations.preferredTaxon.${formatTreeRank(
                      anyTreeRank
                    )}.fullName`,
                    isDisplay: true,
                    operStart: queryFieldFilters.any.id,
                  },
                  {
                    path: `determinations.preferredTaxon.${formatTreeRank(
                      anyTreeRank
                    )}.id`,
                    isDisplay: true,
                    operStart: queryFieldFilters.any.id,
                  },
                ],
                isDistinct: true,
              },
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
                isDistinct: true,
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
              tableNames: ['Determination'],
              dynamicQuerySpec: {
                tableName: 'Determination',
                fields: [
                  {
                    isNot: true,
                    path: 'typeStatusName',
                    operStart: queryFieldFilters.empty.id,
                  },
                ],
                isDistinct: true,
              },
              querySpec: {
                tableName: 'Determination',
                fields: [{ path: formattedEntry }],
              },
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
  readonly tableName: keyof Tables;
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
          tableName: (spec as BackEndStat).tableName,
          formatterGenerator: (spec as BackEndStat).formatterGenerator,
        }))
    )
  );
}

function generateDynamicSpec(statsSpec: StatsSpec): RA<{
  readonly responseKey: string;
  readonly tableNames: RA<keyof Tables>;
}> {
  return Object.entries(statsSpec).flatMap(([_, { categories, urlPrefix }]) =>
    Object.entries(categories).flatMap(([categoryKey, { items }]) =>
      Object.entries(items)
        .filter(([_, { spec }]) => spec.type === 'DynamicStat')
        .map(([itemKey, { spec }]) => ({
          responseKey: generateStatUrl(urlPrefix, categoryKey, itemKey),
          tableNames: (spec as DynamicStat).tableNames,
        }))
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
