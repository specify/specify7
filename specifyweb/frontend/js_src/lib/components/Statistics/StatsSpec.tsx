import { statsText } from '../../localization/stats';
import { getDateInputValue } from '../../utils/dayJs';
import { f } from '../../utils/functools';
import { today } from '../../utils/relativeDate';
import type { RA } from '../../utils/types';
import { ensure } from '../../utils/types';
import { formatNumber } from '../Atoms/Internationalization';
import type { Tables } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { formattedEntry } from '../WbPlanView/mappingHelpers';
import { generateStatUrl } from './hooks';
import type {
  BackEndStat,
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
          preparations: {
            label: statsText.preparations(),
            spec: {
              type: 'QueryBuilderStat',
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
              type: 'QueryBuilderStat',
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
              type: 'QueryBuilderStat',
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
              type: 'QueryBuilderStat',
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
              type: 'QueryBuilderStat',
              querySpec: {
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
          },
        },
      },
      taxonomicTree: {
        label: statsText.taxonomicTree(),
        items: {
          classesCount: {
            label: statsText.classes(),
            spec: {
              type: 'QueryBuilderStat',
              querySpec: {
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
          },
          ordersCount: {
            label: statsText.orders(),
            spec: {
              type: 'QueryBuilderStat',
              querySpec: {
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
          },
          familiesCount: {
            label: statsText.families(),
            spec: {
              type: 'QueryBuilderStat',
              querySpec: {
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
          },
          generaCount: {
            label: statsText.genera(),
            spec: {
              type: 'QueryBuilderStat',
              querySpec: {
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
          },
          speciesCount: {
            label: statsText.species(),
            spec: {
              type: 'QueryBuilderStat',
              querySpec: {
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
              type: 'QueryBuilderStat',
              querySpec: {
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
          },
          geographyEntryCount: {
            label: statsText.geographyEntries(),
            spec: {
              type: 'QueryBuilderStat',
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
              type: 'QueryBuilderStat',
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
          phantomItem: {
            label: statsText.typeSpecimens(),
            spec: {
              type: 'BackEndStat',
              pathToValue: undefined,
              tableName: 'Determination',
              formatterGenerator: () => (rawNumber: number | undefined) =>
                f.maybe(rawNumber, formatNumber),
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
              type: 'QueryBuilderStat',
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
              type: 'QueryBuilderStat',
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
              type: 'QueryBuilderStat',
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
              type: 'QueryBuilderStat',
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
              type: 'QueryBuilderStat',
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
          collectionObjectsDetermined: {
            label: statsText.collectionObjectsDetermined(),
            spec: {
              type: 'QueryBuilderStat',
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
          collectionObjectInventorized: {
            label: statsText.collectionObjectsInventorized(),
            spec: {
              type: 'QueryBuilderStat',
              querySpec: {
                tableName: 'CollectionObject',
                fields: [
                  {
                    path: 'inventorizedBy.specifyuser.name',
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
    itemType: spec.type === 'BackEndStat' ? 'BackEndStat' : 'QueryStat',
    pathToValue: spec.type === 'BackEndStat' ? spec.pathToValue : undefined,
  }));

function generateDynamicSpec(statsSpec: StatsSpec): RA<{
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
export const defaultLayoutGenerated = generateDefaultLayout(statsSpec);
